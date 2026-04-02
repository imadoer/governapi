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
    // Get real performance metrics from API usage logs
    const performanceStats = await database.queryOne(
      `SELECT 
         COUNT(*) as total_requests,
         AVG(response_time) as avg_response_time,
         MIN(response_time) as min_response_time,
         MAX(response_time) as max_response_time,
         PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_time) as median_response_time,
         PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time,
         COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests,
         COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests
       FROM api_usage 
       WHERE tenant_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'`,
      [tenantId],
    );

    // Get performance trends by hour
    const hourlyTrends = await database.queryMany(
      `SELECT 
         DATE_TRUNC('hour', timestamp) as hour,
         AVG(response_time) as avg_response_time,
         COUNT(*) as request_count,
         COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests
       FROM api_usage 
       WHERE tenant_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'
       GROUP BY DATE_TRUNC('hour', timestamp)
       ORDER BY hour DESC`,
      [tenantId],
    );

    // Get performance by endpoint
    const endpointPerformance = await database.queryMany(
      `SELECT 
         endpoint,
         COUNT(*) as request_count,
         AVG(response_time) as avg_response_time,
         PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time,
         COUNT(CASE WHEN response_time > 1000 THEN 1 END) as slow_requests
       FROM api_usage 
       WHERE tenant_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'
       GROUP BY endpoint
       ORDER BY request_count DESC
       LIMIT 10`,
      [tenantId],
    );

    // Get error rate analysis
    const errorAnalysis = await database.queryOne(
      `SELECT 
         COUNT(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 END) as client_errors,
         COUNT(CASE WHEN status_code >= 500 THEN 1 END) as server_errors,
         COUNT(CASE WHEN status_code = 429 THEN 1 END) as rate_limit_errors,
         COUNT(CASE WHEN status_code = 503 THEN 1 END) as service_unavailable
       FROM api_usage 
       WHERE tenant_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'`,
      [tenantId],
    );

    // Get slowest endpoints
    const slowestEndpoints = await database.queryMany(
      `SELECT 
         endpoint,
         AVG(response_time) as avg_response_time,
         COUNT(*) as request_count
       FROM api_usage 
       WHERE tenant_id = $1 AND timestamp >= NOW() - INTERVAL '24 hours'
       GROUP BY endpoint
       HAVING COUNT(*) >= 10
       ORDER BY avg_response_time DESC
       LIMIT 5`,
      [tenantId],
    );

    const totalRequests = parseInt(performanceStats?.total_requests || "0");
    const successfulRequests = parseInt(
      performanceStats?.successful_requests || "0",
    );
    const slowRequests = parseInt(performanceStats?.slow_requests || "0");

    return NextResponse.json({
      success: true,
      performance: {
        summary: {
          totalRequests,
          averageResponseTime: performanceStats?.avg_response_time
            ? Math.round(parseFloat(performanceStats.avg_response_time))
            : null,
          minResponseTime: performanceStats?.min_response_time
            ? Math.round(parseFloat(performanceStats.min_response_time))
            : null,
          maxResponseTime: performanceStats?.max_response_time
            ? Math.round(parseFloat(performanceStats.max_response_time))
            : null,
          medianResponseTime: performanceStats?.median_response_time
            ? Math.round(parseFloat(performanceStats.median_response_time))
            : null,
          p95ResponseTime: performanceStats?.p95_response_time
            ? Math.round(parseFloat(performanceStats.p95_response_time))
            : null,
          slowRequests,
          successRate:
            totalRequests > 0
              ? Math.round((successfulRequests / totalRequests) * 100 * 100) /
                100
              : 0,
          slowRequestRate:
            totalRequests > 0
              ? Math.round((slowRequests / totalRequests) * 100 * 100) / 100
              : 0,
        },
        hourlyTrends: hourlyTrends.map((trend) => ({
          hour: trend.hour,
          averageResponseTime: Math.round(
            parseFloat(trend.avg_response_time || "0"),
          ),
          requestCount: parseInt(trend.request_count || "0"),
          slowRequests: parseInt(trend.slow_requests || "0"),
        })),
        endpointPerformance: endpointPerformance.map((ep) => ({
          endpoint: ep.endpoint,
          requestCount: parseInt(ep.request_count || "0"),
          averageResponseTime: Math.round(
            parseFloat(ep.avg_response_time || "0"),
          ),
          p95ResponseTime: Math.round(parseFloat(ep.p95_response_time || "0")),
          slowRequests: parseInt(ep.slow_requests || "0"),
        })),
        errorAnalysis: {
          clientErrors: parseInt(errorAnalysis?.client_errors || "0"),
          serverErrors: parseInt(errorAnalysis?.server_errors || "0"),
          rateLimitErrors: parseInt(errorAnalysis?.rate_limit_errors || "0"),
          serviceUnavailable: parseInt(
            errorAnalysis?.service_unavailable || "0",
          ),
        },
        slowestEndpoints: slowestEndpoints.map((ep) => ({
          endpoint: ep.endpoint,
          averageResponseTime: Math.round(
            parseFloat(ep.avg_response_time || "0"),
          ),
          requestCount: parseInt(ep.request_count || "0"),
        })),
      },
    });
  } catch (error) {
    logger.error("Performance API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch performance data" },
      { status: 500 },
    );
  }
}
