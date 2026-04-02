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
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get("integration_id");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get webhook logs
    const logs = await database.queryMany(
      `SELECT 
        id, integration_id, integration_type, webhook_url, event_type,
        payload, response_status, response_body, response_time_ms,
        success, error_message, created_at
       FROM webhook_logs
       WHERE tenant_id = $1 ${integrationId ? 'AND integration_id = $2' : ''}
       ORDER BY created_at DESC
       LIMIT $${integrationId ? '3' : '2'}`,
      integrationId ? [tenantId, integrationId, limit] : [tenantId, limit]
    );

    // Get analytics
    const analytics = await database.queryOne(
      `SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN NOT success THEN 1 ELSE 0 END) as failed,
        AVG(response_time_ms)::integer as avg_response_time,
        MAX(created_at) as last_request
       FROM webhook_logs
       WHERE tenant_id = $1 ${integrationId ? 'AND integration_id = $2' : ''}
       AND created_at > NOW() - INTERVAL '7 days'`,
      integrationId ? [tenantId, integrationId] : [tenantId]
    );

    return NextResponse.json({
      success: true,
      logs: logs.map(log => ({
        id: log.id,
        integrationId: log.integration_id,
        integrationType: log.integration_type,
        webhookUrl: log.webhook_url,
        eventType: log.event_type,
        payload: log.payload,
        responseStatus: log.response_status,
        responseBody: log.response_body,
        responseTime: log.response_time_ms,
        success: log.success,
        errorMessage: log.error_message,
        createdAt: log.created_at,
      })),
      analytics: {
        totalRequests: parseInt(analytics?.total_requests || 0),
        successful: parseInt(analytics?.successful || 0),
        failed: parseInt(analytics?.failed || 0),
        successRate: analytics?.total_requests > 0 
          ? Math.round((analytics.successful / analytics.total_requests) * 100)
          : 0,
        avgResponseTime: analytics?.avg_response_time || 0,
        lastRequest: analytics?.last_request,
      }
    });

  } catch (error) {
    logger.error("Failed to fetch webhook logs", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    
    return NextResponse.json(
      { error: "Failed to fetch webhook logs" },
      { status: 500 },
    );
  }
}
