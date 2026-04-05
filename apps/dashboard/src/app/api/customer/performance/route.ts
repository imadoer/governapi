import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Performance data derived from security scans (not real-time monitoring)
    const [summary, hourlyTrends, endpoints, slowest] = await Promise.all([
      // Summary stats from scan durations
      database.queryOne(
        `SELECT
           COUNT(*) as total_scans,
           ROUND(AVG(scan_duration * 1000)) as avg_response_time,
           MIN(scan_duration * 1000) as min_response_time,
           MAX(scan_duration * 1000) as max_response_time,
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY scan_duration * 1000) as median_response_time,
           PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY scan_duration * 1000) as p95_response_time,
           COUNT(CASE WHEN scan_duration > 5 THEN 1 END) as slow_requests,
           COUNT(CASE WHEN security_score > 0 THEN 1 END) as successful_scans
         FROM security_scans
         WHERE tenant_id = $1 AND status = 'completed'
           AND created_at >= NOW() - INTERVAL '30 days'`,
        [tenantId],
      ),
      // Hourly scan activity (last 24h)
      database.queryMany(
        `SELECT
           DATE_TRUNC('hour', created_at) as hour,
           ROUND(AVG(scan_duration * 1000)) as avg_response_time,
           COUNT(*) as scan_count
         FROM security_scans
         WHERE tenant_id = $1 AND status = 'completed'
           AND created_at >= NOW() - INTERVAL '24 hours'
         GROUP BY DATE_TRUNC('hour', created_at)
         ORDER BY hour`,
        [tenantId],
      ),
      // Per-endpoint performance (latest scan per URL)
      database.queryMany(
        `SELECT DISTINCT ON (url) url as endpoint,
           security_score, scan_duration * 1000 as response_time,
           vulnerability_count, created_at as last_scanned
         FROM security_scans
         WHERE tenant_id = $1 AND status = 'completed'
         ORDER BY url, created_at DESC`,
        [tenantId],
      ),
      // Slowest endpoints
      database.queryMany(
        `SELECT DISTINCT ON (url) url as endpoint,
           scan_duration * 1000 as response_time,
           security_score, created_at as last_scanned
         FROM security_scans
         WHERE tenant_id = $1 AND status = 'completed'
         ORDER BY url, created_at DESC`,
        [tenantId],
      ),
    ]);

    const totalScans = parseInt(summary?.total_scans || "0");
    const successfulScans = parseInt(summary?.successful_scans || "0");

    // Sort slowest by response time DESC
    slowest.sort((a: any, b: any) => (b.response_time || 0) - (a.response_time || 0));

    // Error analysis from vulnerabilities
    const errorEndpoints = endpoints.filter((e: any) => e.security_score === 0);

    const res = NextResponse.json({
      success: true,
      performance: {
        summary: {
          totalRequests: totalScans,
          averageResponseTime: parseInt(summary?.avg_response_time || "0"),
          minResponseTime: parseInt(summary?.min_response_time || "0"),
          maxResponseTime: parseInt(summary?.max_response_time || "0"),
          medianResponseTime: parseInt(summary?.median_response_time || "0"),
          p95ResponseTime: parseInt(summary?.p95_response_time || "0"),
          slowRequests: parseInt(summary?.slow_requests || "0"),
          successRate: totalScans > 0 ? Math.round((successfulScans / totalScans) * 100) : 0,
          slowRequestRate: totalScans > 0 ? Math.round((parseInt(summary?.slow_requests || "0") / totalScans) * 100) : 0,
        },
        hourlyTrends: hourlyTrends.map((t: any) => ({
          hour: t.hour,
          averageResponseTime: parseInt(t.avg_response_time || "0"),
          requestCount: parseInt(t.scan_count || "0"),
        })),
        endpointPerformance: endpoints.map((e: any) => ({
          endpoint: e.endpoint,
          requestCount: 1,
          averageResponseTime: parseInt(e.response_time || "0"),
          p95ResponseTime: parseInt(e.response_time || "0"),
          slowRequests: (e.response_time || 0) > 5000 ? 1 : 0,
          securityScore: e.security_score,
          vulnCount: e.vulnerability_count || 0,
          lastScanned: e.last_scanned,
        })),
        errorAnalysis: {
          clientErrors: 0,
          serverErrors: errorEndpoints.length,
          rateLimitErrors: 0,
          serviceUnavailable: 0,
        },
        slowestEndpoints: slowest.slice(0, 10).map((e: any) => ({
          endpoint: e.endpoint,
          averageResponseTime: parseInt(e.response_time || "0"),
          requestCount: 1,
          securityScore: e.security_score,
        })),
      },
    });

    res.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=30");
    return res;
  } catch (error) {
    console.error("Performance API error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch performance data" }, { status: 500 });
  }
}
