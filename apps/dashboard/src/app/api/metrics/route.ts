import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const metrics = await database.queryOne(
      `SELECT 
         COUNT(*) as total_requests,
         AVG(response_time) as avg_response_time,
         COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count
       FROM request_logs 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'`,
      [tenantId],
    );

    return NextResponse.json({
      metrics: {
        totalRequests: parseInt(metrics?.total_requests || "0"),
        averageResponseTime: metrics?.avg_response_time
          ? Math.round(parseFloat(metrics.avg_response_time))
          : null,
        errorCount: parseInt(metrics?.error_count || "0"),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Metrics endpoint error:", error);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
