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
    const [recentBlocked, threatSources] = await Promise.all([
      database.queryMany(
        `SELECT id, event_type as threat_type, source_ip, 
                CASE 
                  WHEN risk_score >= 80 THEN 'CRITICAL'
                  WHEN risk_score >= 60 THEN 'HIGH'
                  WHEN risk_score >= 40 THEN 'MEDIUM'
                  ELSE 'LOW'
                END as severity,
                action_taken, detected_at as created_at, 
                request_path as description, target_endpoint
         FROM threat_events_enhanced
         WHERE tenant_id = $1 AND blocked = true
         ORDER BY detected_at DESC
         LIMIT 20`,
        [tenantId],
      ),
      database.queryMany(
        `SELECT source_ip, COUNT(*) as threat_count,
                COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count,
                MAX(detected_at) as last_activity,
                ARRAY_AGG(DISTINCT event_type) as threat_types
         FROM threat_events_enhanced
         WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '7 days'
         GROUP BY source_ip
         HAVING COUNT(*) >= 1
         ORDER BY threat_count DESC
         LIMIT 10`,
        [tenantId],
      ),
    ]);

    return NextResponse.json({
      success: true,
      threatBlocking: {
        recentBlocked: recentBlocked.map((threat: any) => ({
          id: threat.id,
          threatType: threat.threat_type,
          sourceIp: threat.source_ip,
          targetEndpoint: threat.target_endpoint || "Unknown",
          severity: threat.severity,
          actionTaken: threat.action_taken,
          ruleTriggered: "N/A",
          blockedAt: threat.created_at,
        })),
        threatSources: threatSources.map((source: any) => ({
          sourceIp: source.source_ip,
          threatCount: parseInt(source.threat_count || "0"),
          blockedCount: parseInt(source.blocked_count || "0"),
          lastActivity: source.last_activity,
          threatTypes: source.threat_types || [],
        })),
        effectiveness: [],
      },
    });
  } catch (error: any) {
    logger.error("Threat blocking API error:", { error: error.message });
    return NextResponse.json(
      { error: "Failed to fetch threat blocking data" },
      { status: 500 },
    );
  }
}
