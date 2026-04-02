import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    // Get real rate limiting statistics
    const rateLimitStats = await database.queryOne(
      `SELECT 
         COUNT(*) as total_requests,
         COUNT(CASE WHEN is_rate_limited = true THEN 1 END) as rate_limited_requests,
         COUNT(DISTINCT source_ip) as unique_ips,
         COUNT(DISTINCT CASE WHEN is_rate_limited = true THEN source_ip END) as blocked_ips,
         MAX(requests_per_minute) as peak_rps,
         AVG(requests_per_minute) as avg_rps
       FROM rate_limit_log 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '24 hours'`,
      [tenantId],
    );

    // Get current rate limit configurations
    const rateLimitRules = await database.queryMany(
      `SELECT id, rule_name, endpoint_pattern, requests_per_minute, requests_per_hour, 
              burst_limit, is_active, created_at, updated_at
       FROM rate_limit_rules 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [tenantId],
    );

    // Get recent rate limit violations
    const recentViolations = await database.queryMany(
      `SELECT source_ip, endpoint, requests_attempted, limit_exceeded, blocked_at,
              user_agent, violation_type
       FROM rate_limit_violations 
       WHERE tenant_id = $1 AND blocked_at >= NOW() - INTERVAL '1 hour'
       ORDER BY blocked_at DESC 
       LIMIT 20`,
      [tenantId],
    );

    // Get top violating IPs
    const topViolators = await database.queryMany(
      `SELECT source_ip, COUNT(*) as violation_count, 
              MAX(blocked_at) as last_violation,
              SUM(requests_attempted) as total_requests_attempted
       FROM rate_limit_violations 
       WHERE tenant_id = $1 AND blocked_at >= NOW() - INTERVAL '24 hours'
       GROUP BY source_ip 
       ORDER BY violation_count DESC 
       LIMIT 10`,
      [tenantId],
    );

    const totalRequests = parseInt(rateLimitStats?.total_requests || "0");
    const rateLimitedRequests = parseInt(
      rateLimitStats?.rate_limited_requests || "0",
    );

    return NextResponse.json({
      success: true,
      rateLimits: {
        statistics: {
          totalRequests,
          rateLimitedRequests,
          uniqueIps: parseInt(rateLimitStats?.unique_ips || "0"),
          blockedIps: parseInt(rateLimitStats?.blocked_ips || "0"),
          peakRPS: parseInt(rateLimitStats?.peak_rps || "0"),
          averageRPS: rateLimitStats?.avg_rps
            ? Math.round(parseFloat(rateLimitStats.avg_rps))
            : 0,
          blockRate:
            totalRequests > 0
              ? Math.round((rateLimitedRequests / totalRequests) * 100 * 100) /
                100
              : 0,
        },
        rules: rateLimitRules.map((rule) => ({
          id: rule.id,
          name: rule.rule_name,
          endpointPattern: rule.endpoint_pattern,
          requestsPerMinute: rule.requests_per_minute,
          requestsPerHour: rule.requests_per_hour,
          burstLimit: rule.burst_limit,
          isActive: rule.is_active,
          createdAt: rule.created_at,
          updatedAt: rule.updated_at,
        })),
        recentViolations: recentViolations.map((violation) => ({
          sourceIp: violation.source_ip,
          endpoint: violation.endpoint,
          requestsAttempted: violation.requests_attempted,
          limitExceeded: violation.limit_exceeded,
          blockedAt: violation.blocked_at,
          userAgent: violation.user_agent,
          violationType: violation.violation_type,
        })),
        topViolators: topViolators.map((violator) => ({
          sourceIp: violator.source_ip,
          violationCount: parseInt(violator.violation_count || "0"),
          lastViolation: violator.last_violation,
          totalRequestsAttempted: parseInt(
            violator.total_requests_attempted || "0",
          ),
        })),
      },
    });
  } catch (error) {
    logger.error("Rate limits API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch rate limit data" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const {
      ruleName,
      endpointPattern,
      requestsPerMinute,
      requestsPerHour,
      burstLimit = 10,
    } = await request.json();

    if (!ruleName || !endpointPattern || !requestsPerMinute) {
      return NextResponse.json(
        {
          error:
            "Rule name, endpoint pattern, and requests per minute are required",
        },
        { status: 400 },
      );
    }

    // Validate numeric limits
    if (
      requestsPerMinute <= 0 ||
      (requestsPerHour && requestsPerHour <= 0) ||
      burstLimit <= 0
    ) {
      return NextResponse.json(
        { error: "Rate limits must be positive numbers" },
        { status: 400 },
      );
    }

    // Check for duplicate endpoint pattern
    const existingRule = await database.queryOne(
      "SELECT id FROM rate_limit_rules WHERE tenant_id = $1 AND endpoint_pattern = $2",
      [tenantId, endpointPattern],
    );

    if (existingRule) {
      return NextResponse.json(
        { error: "Rate limit rule already exists for this endpoint pattern" },
        { status: 409 },
      );
    }

    // Create new rate limit rule
    const newRule = await database.queryOne(
      `INSERT INTO rate_limit_rules (tenant_id, rule_name, endpoint_pattern, requests_per_minute, 
                                     requests_per_hour, burst_limit, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [
        tenantId,
        ruleName,
        endpointPattern,
        requestsPerMinute,
        requestsPerHour,
        burstLimit,
        true,
        userId || "system",
      ],
    );

    if (!newRule) {
      return NextResponse.json(
        { error: "Failed to create rate limit rule" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      rule: {
        id: newRule.id,
        name: newRule.rule_name,
        endpointPattern: newRule.endpoint_pattern,
        requestsPerMinute: newRule.requests_per_minute,
        requestsPerHour: newRule.requests_per_hour,
        burstLimit: newRule.burst_limit,
        isActive: newRule.is_active,
        createdAt: newRule.created_at,
      },
      message: "Rate limit rule created successfully",
    });
  } catch (error) {
    logger.error("Rate limit rule creation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create rate limit rule" },
      { status: 500 },
    );
  }
}
