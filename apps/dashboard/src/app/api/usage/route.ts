import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function GET(request: NextRequest) {
  // Get tenant ID from middleware-injected headers
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    // Get current month usage for the authenticated tenant
    const usageResult = await database.queryOne(
      `SELECT COUNT(*) as usage_count 
       FROM api_usage 
       WHERE tenant_id = $1 
       AND timestamp >= DATE_TRUNC('month', NOW())`,
      [tenantId],
    );

    // Get daily usage breakdown for the current month
    const dailyUsage = await database.queryMany(
      `SELECT DATE(timestamp) as date, COUNT(*) as requests
       FROM api_usage 
       WHERE tenant_id = $1 
       AND timestamp >= DATE_TRUNC('month', NOW())
       GROUP BY DATE(timestamp)
       ORDER BY date DESC`,
      [tenantId],
    );

    // Get endpoint usage breakdown
    const endpointUsage = await database.queryMany(
      `SELECT endpoint, COUNT(*) as requests
       FROM api_usage 
       WHERE tenant_id = $1 
       AND timestamp >= DATE_TRUNC('month', NOW())
       GROUP BY endpoint
       ORDER BY requests DESC
       LIMIT 10`,
      [tenantId],
    );

    return NextResponse.json({
      success: true,
      currentUsage: parseInt(usageResult?.usage_count || "0"),
      dailyBreakdown: dailyUsage,
      topEndpoints: endpointUsage,
    });
  } catch (error) {
    logger.error("Usage API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to fetch usage data",
      },
      { status: 500 },
    );
  }
}
