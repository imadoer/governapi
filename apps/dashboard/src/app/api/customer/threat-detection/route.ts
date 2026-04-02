import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

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
    const timeframe = url.searchParams.get("timeframe") || "24h";
    const riskThreshold = parseInt(
      url.searchParams.get("riskThreshold") || "50",
    );

    // Validate timeframe
    const validTimeframes = ["1h", "24h", "7d", "30d"];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json(
        {
          error: `Invalid timeframe. Allowed: ${validTimeframes.join(", ")}`,
        },
        { status: 400 },
      );
    }

    const intervalMap = {
      "1h": "1 hour",
      "24h": "24 hours",
      "7d": "7 days",
      "30d": "30 days",
    };
    const interval = intervalMap[timeframe as keyof typeof intervalMap];

    // Get threat detection summary
    const [threatSummary, topThreats, riskDistribution, blockedThreats] =
      await Promise.all([
        // Overall threat statistics
        database.queryOne(
          `SELECT 
           COUNT(*) as total_threats,
           COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_threats,
           COUNT(CASE WHEN risk_score >= 80 THEN 1 END) as critical_threats,
           COUNT(CASE WHEN risk_score >= 60 AND risk_score < 80 THEN 1 END) as high_threats,
           COUNT(CASE WHEN risk_score >= 40 AND risk_score < 60 THEN 1 END) as medium_threats,
           COUNT(CASE WHEN risk_score < 40 THEN 1 END) as low_threats,
           AVG(risk_score) as avg_risk_score,
           COUNT(DISTINCT source_ip) as unique_sources
         FROM threat_events_enhanced 
         WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '${interval}'`,
          [tenantId],
        ),

        // Top threat types
        database.queryMany(
          `SELECT 
           event_type,
           COUNT(*) as count,
           AVG(risk_score) as avg_risk,
           MAX(risk_score) as max_risk,
           COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count
         FROM threat_events_enhanced 
         WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '${interval}'
         GROUP BY event_type
         ORDER BY count DESC, avg_risk DESC
         LIMIT 10`,
          [tenantId],
        ),

        // Risk score distribution by hour/day
        database.queryMany(
          `SELECT 
           DATE_TRUNC('hour', detected_at) as time_bucket,
           COUNT(*) as threat_count,
           AVG(risk_score) as avg_risk_score,
           MAX(risk_score) as max_risk_score
         FROM threat_events_enhanced 
         WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '${interval}'
         GROUP BY time_bucket
         ORDER BY time_bucket`,
          [tenantId],
        ),

        // Recently blocked threats (high risk)
        database.queryMany(
          `SELECT
           event_type,
           source_ip,
           request_path,
           risk_score,
           confidence_level
         FROM threat_events_enhanced
         WHERE tenant_id = $1
           AND risk_score >= $2
           AND detected_at >= NOW() - INTERVAL '${interval}'
         ORDER BY detected_at DESC, risk_score DESC
         LIMIT 50`,
          [tenantId, riskThreshold],
        ),
      ]);

    return NextResponse.json({
      success: true,
      timeframe,
      riskThreshold,
      threatDetection: {
        summary: {
          totalThreats: parseInt(threatSummary?.total_threats || "0"),
          blockedThreats: parseInt(threatSummary?.blocked_threats || "0"),
          criticalThreats: parseInt(threatSummary?.critical_threats || "0"),
          highThreats: parseInt(threatSummary?.high_threats || "0"),
          mediumThreats: parseInt(threatSummary?.medium_threats || "0"),
          lowThreats: parseInt(threatSummary?.low_threats || "0"),
          averageRiskScore: threatSummary?.avg_risk_score
            ? Math.round(parseFloat(threatSummary.avg_risk_score))
            : null,
          uniqueSources: parseInt(threatSummary?.unique_sources || "0"),
          blockRate: threatSummary?.total_threats
            ? Math.round(
                (parseInt(threatSummary.blocked_threats) /
                  parseInt(threatSummary.total_threats)) *
                  100,
              )
            : 0,
        },

        topThreatTypes: topThreats.map((threat) => ({
          type: threat.event_type,
          count: parseInt(threat.count),
          averageRisk: Math.round(parseFloat(threat.avg_risk || "0")),
          maxRisk: parseInt(threat.max_risk || "0"),
          blockedCount: parseInt(threat.blocked_count || "0"),
          blockRate: Math.round(
            (parseInt(threat.blocked_count || "0") / parseInt(threat.count)) *
              100,
          ),
        })),

        riskTrends: riskDistribution.map((trend) => ({
          timestamp: trend.time_bucket,
          threatCount: parseInt(trend.threat_count),
          averageRisk: Math.round(parseFloat(trend.avg_risk_score || "0")),
          maxRisk: parseInt(trend.max_risk_score || "0"),
        })),

        recentHighRiskThreats: blockedThreats.map((threat) => ({
          type: threat.event_type,
          sourceIp: threat.source_ip,
          path: threat.request_path,
          riskScore: threat.risk_score,
          confidence: Math.round(parseFloat(threat.confidence_level) * 100),
          // detectionMethod removed - column does not exist
          detectedAt: threat.detected_at,
        })),
      },
    });
  } catch (error) {
    logger.error("Threat detection API error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    console.error('Full threat detection error:', error);
    return NextResponse.json(
      { error: "Failed to fetch threat detection data" },
      { status: 500 },
    );
  }
}
