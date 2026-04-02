import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { startRequestTimer, endRequestTimer } from "../../../utils/performance";
import { database } from "../../../infrastructure/database";

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const {
      userAgent,
      ip,
      requestPath,
      requestHeaders = {},
    } = await request.json();

    if (!userAgent || !ip) {
      return NextResponse.json(
        { error: "User agent and IP address are required" },
        { status: 400 },
      );
    }

    // Perform bot detection analysis
    const botAnalysis = await analyzeBotBehavior({
      userAgent,
      ip,
      requestPath,
      requestHeaders,
    });

    // Store bot detection result
    const detectionResult = await database.queryOne(
      `INSERT INTO bot_detection_log (tenant_id, source_ip, user_agent, request_path, 
                                      is_bot, confidence_score, detection_reason, is_blocked, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [
        tenantId,
        ip,
        userAgent,
        requestPath || "/",
        botAnalysis.isBot,
        botAnalysis.confidenceScore,
        botAnalysis.reason,
        botAnalysis.shouldBlock,
      ],
    );

    // Check if IP should be temporarily blocked
    if (botAnalysis.shouldBlock) {
      await database.query(
        `INSERT INTO ip_blocks (tenant_id, ip_address, reason, blocked_until, created_at)
         VALUES ($1, $2, $3, NOW() + INTERVAL '1 hour', NOW())
         ON CONFLICT (tenant_id, ip_address) 
         DO UPDATE SET blocked_until = NOW() + INTERVAL '1 hour', reason = EXCLUDED.reason`,
        [tenantId, ip, "Bot detection: " + botAnalysis.reason],
      );
    }

    return NextResponse.json({
      success: true,
      botDetection: {
        id: detectionResult.id,
        isBot: botAnalysis.isBot,
        confidenceScore: botAnalysis.confidenceScore,
        reason: botAnalysis.reason,
        shouldBlock: botAnalysis.shouldBlock,
        detectedAt: detectionResult.created_at,
        analysis: botAnalysis.analysis,
      },
    });
  } catch (error) {
    logger.error("Bot detection error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to perform bot detection" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const onlyBots = url.searchParams.get("onlyBots") === "true";

    // Get bot detection history
    let query = `SELECT * FROM bot_detection_log WHERE tenant_id = $1`;
    const params = [tenantId];

    if (onlyBots) {
      query += " AND is_bot = true";
    }

    query += " ORDER BY created_at DESC LIMIT $2";
    params.push(limit.toString());

    const detections = await database.queryMany(query, params);

    // Get bot detection statistics
    const stats = await database.queryOne(
      `SELECT 
         COUNT(*) as total_requests,
         COUNT(CASE WHEN is_bot = true THEN 1 END) as bot_requests,
         COUNT(CASE WHEN is_blocked = true THEN 1 END) as blocked_requests,
         AVG(confidence_score) as avg_confidence
       FROM bot_detection_log 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
      [tenantId],
    );

    return NextResponse.json({
      success: true,
      detections: detections.map((detection) => ({
        id: detection.id,
        sourceIp: detection.source_ip,
        userAgent: detection.user_agent,
        requestPath: detection.request_path,
        isBot: detection.is_bot,
        confidenceScore: detection.confidence_score,
        detectionReason: detection.detection_reason,
        isBlocked: detection.is_blocked,
        detectedAt: detection.created_at,
      })),
      statistics: {
        totalRequests: parseInt(stats?.total_requests || "0"),
        botRequests: parseInt(stats?.bot_requests || "0"),
        blockedRequests: parseInt(stats?.blocked_requests || "0"),
        averageConfidence: stats?.avg_confidence
          ? Math.round(parseFloat(stats.avg_confidence) * 100) / 100
          : null,
      },
    });
  } catch (error) {
    logger.error("Bot detection history error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch bot detection history" },
      { status: 500 },
    );
  }
}

async function analyzeBotBehavior(requestData: any) {
  const { userAgent, ip, requestPath, requestHeaders } = requestData;
  let confidenceScore = 0;
  const reasons = [];
  const analysis: any = {};

  // User Agent Analysis
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /wget/i,
    /curl/i,
    /python/i,
    /java/i,
    /apache/i,
    /http/i,
  ];

  const goodBots = [
    /googlebot/i,
    /bingbot/i,
    /slurp/i,
    /duckduckbot/i,
    /baiduspider/i,
    /yandexbot/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /linkedinbot/i,
  ];

  let isSuspiciousBot = false;
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      isSuspiciousBot = true;
      break;
    }
  }

  let isGoodBot = false;
  for (const pattern of goodBots) {
    if (pattern.test(userAgent)) {
      isGoodBot = true;
      break;
    }
  }

  if (isSuspiciousBot && !isGoodBot) {
    confidenceScore += 0.6;
    reasons.push("Suspicious bot user agent detected");
  }

  analysis.userAgentAnalysis = {
    isSuspiciousBot,
    isGoodBot,
    userAgent: userAgent.substring(0, 100),
  };

  // Request Pattern Analysis
  if (requestPath) {
    if (requestPath.includes("/wp-admin") || requestPath.includes("/admin")) {
      confidenceScore += 0.2;
      reasons.push("Accessing administrative paths");
    }

    if (requestPath.includes("..") || requestPath.includes("%2e%2e")) {
      confidenceScore += 0.3;
      reasons.push("Path traversal patterns detected");
    }
  }

  // Header Analysis
  const hasCommonHeaders = !!(
    requestHeaders["accept"] &&
    requestHeaders["accept-language"] &&
    requestHeaders["accept-encoding"]
  );

  if (!hasCommonHeaders) {
    confidenceScore += 0.2;
    reasons.push("Missing common browser headers");
  }

  analysis.headerAnalysis = {
    hasCommonHeaders,
    headerCount: Object.keys(requestHeaders).length,
  };

  // IP Analysis (simplified - in production you'd check against threat databases)
  const ipAnalysis = await analyzeIP(ip);
  if (ipAnalysis.isSuspicious) {
    confidenceScore += ipAnalysis.suspicionScore;
    reasons.push(ipAnalysis.reason);
  }

  analysis.ipAnalysis = ipAnalysis;

  // Final determination
  const isBot = confidenceScore >= 0.5;
  const shouldBlock = confidenceScore >= 0.7;

  return {
    isBot,
    shouldBlock,
    confidenceScore: Math.min(1, confidenceScore),
    reason: reasons.join("; ") || "Normal traffic pattern",
    analysis,
  };
}

async function analyzeIP(ip: string) {
  // Simplified IP analysis - in production you'd check against threat intelligence
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
  ];

  const isPrivate = privateRanges.some((range) => range.test(ip));

  if (isPrivate) {
    return {
      isSuspicious: false,
      suspicionScore: 0,
      reason: "Private IP address",
      category: "private",
    };
  }

  // Check against known bot/datacenter ranges (simplified)
  const datacenterPatterns = [
    /^173\.252\./, // Facebook
    /^69\.63\./, // Facebook
    /^66\.220\./, // Amazon AWS
    /^54\./, // Amazon AWS
  ];

  const isDatacenter = datacenterPatterns.some((pattern) => pattern.test(ip));

  if (isDatacenter) {
    return {
      isSuspicious: true,
      suspicionScore: 0.3,
      reason: "Datacenter IP range",
      category: "datacenter",
    };
  }

  return {
    isSuspicious: false,
    suspicionScore: 0,
    reason: "Standard IP address",
    category: "residential",
  };
}
