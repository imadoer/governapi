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
    const url = new URL(request.url);
    const timeframe = url.searchParams.get("timeframe") || "30d";
    const threatType = url.searchParams.get("type");

    // Calculate interval for database query
    const intervalMap = {
      "24h": "24 hours",
      "7d": "7 days",
      "30d": "30 days",
      "90d": "90 days",
    };
    const interval =
      intervalMap[timeframe as keyof typeof intervalMap] || "30 days";

    // Get threat analytics overview
    const threatOverview = await database.queryOne(
      `SELECT 
         COUNT(*) as total_threats,
         COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_threats,
         COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_threats,
         COUNT(CASE WHEN action_taken = 'blocked' THEN 1 END) as blocked_threats,
         COUNT(CASE WHEN action_taken = 'allowed' THEN 1 END) as allowed_threats,
         COUNT(DISTINCT source_ip) as unique_sources,
         COUNT(DISTINCT threat_type) as threat_types_detected
       FROM threat_events 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${interval}'
       ${threatType ? "AND threat_type = $2" : ""}`,
      threatType ? [tenantId, threatType] : [tenantId],
    );

    // Get threat trends by day
    const threatTrends = await database.queryMany(
      `SELECT 
         DATE_TRUNC('day', created_at) as date,
         COUNT(*) as total_threats,
         COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_threats,
         COUNT(CASE WHEN action_taken = 'blocked' THEN 1 END) as blocked_threats
       FROM threat_events 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY DATE_TRUNC('day', created_at)
       ORDER BY date ASC`,
      [tenantId],
    );

    // Get threat type distribution
    const threatTypeDistribution = await database.queryMany(
      `SELECT 
         threat_type,
         COUNT(*) as count,
         COUNT(CASE WHEN action_taken = 'blocked' THEN 1 END) as blocked_count,
         AVG(risk_score) as avg_risk_score
       FROM threat_events 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY threat_type
       ORDER BY count DESC`,
      [tenantId],
    );

    // Get top threat sources
    const topThreatSources = await database.queryMany(
      `SELECT 
         source_ip,
         COUNT(*) as threat_count,
         COUNT(CASE WHEN action_taken = 'blocked' THEN 1 END) as blocked_count,
         MAX(created_at) as last_seen,
         ARRAY_AGG(DISTINCT threat_type) as threat_types
       FROM threat_events 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY source_ip
       ORDER BY threat_count DESC
       LIMIT 10`,
      [tenantId],
    );

    // Get attack vectors analysis
    const attackVectors = await database.queryMany(
      `SELECT 
         target_endpoint,
         COUNT(*) as attack_count,
         COUNT(DISTINCT source_ip) as unique_attackers,
         COUNT(CASE WHEN action_taken = 'blocked' THEN 1 END) as blocked_attacks
       FROM threat_events 
       WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${interval}'
       GROUP BY target_endpoint
       ORDER BY attack_count DESC
       LIMIT 15`,
      [tenantId],
    );

    // Get threat intelligence data
    const threatIntelligence = await database.queryOne(
      `SELECT 
         COUNT(CASE WHEN ti.reputation = 'malicious' THEN 1 END) as known_malicious_ips,
         COUNT(CASE WHEN ti.threat_category = 'botnet' THEN 1 END) as botnet_sources,
         COUNT(CASE WHEN ti.threat_category = 'tor' THEN 1 END) as tor_sources
       FROM threat_events te
       LEFT JOIN threat_intelligence ti ON te.source_ip = ti.ip_address
       WHERE te.tenant_id = $1 AND te.created_at >= NOW() - INTERVAL '${interval}'`,
      [tenantId],
    );

    const totalThreats = parseInt(threatOverview?.total_threats || "0");
    const blockedThreats = parseInt(threatOverview?.blocked_threats || "0");

    return NextResponse.json({
      success: true,
      threatAnalytics: {
        timeframe,
        overview: {
          totalThreats,
          criticalThreats: parseInt(threatOverview?.critical_threats || "0"),
          highThreats: parseInt(threatOverview?.high_threats || "0"),
          blockedThreats,
          allowedThreats: parseInt(threatOverview?.allowed_threats || "0"),
          uniqueSources: parseInt(threatOverview?.unique_sources || "0"),
          threatTypesDetected: parseInt(
            threatOverview?.threat_types_detected || "0",
          ),
          blockingEffectiveness:
            totalThreats > 0
              ? Math.round((blockedThreats / totalThreats) * 100)
              : 0,
        },
        trends: threatTrends.map((trend) => ({
          date: trend.date,
          totalThreats: parseInt(trend.total_threats || "0"),
          criticalThreats: parseInt(trend.critical_threats || "0"),
          blockedThreats: parseInt(trend.blocked_threats || "0"),
        })),
        threatTypes: threatTypeDistribution.map((type) => ({
          threatType: type.threat_type,
          count: parseInt(type.count || "0"),
          blockedCount: parseInt(type.blocked_count || "0"),
          averageRiskScore: type.avg_risk_score
            ? Math.round(parseFloat(type.avg_risk_score))
            : null,
          blockingRate:
            parseInt(type.count || "0") > 0
              ? Math.round(
                  (parseInt(type.blocked_count || "0") /
                    parseInt(type.count || "0")) *
                    100,
                )
              : 0,
        })),
        topSources: topThreatSources.map((source) => ({
          sourceIp: source.source_ip,
          threatCount: parseInt(source.threat_count || "0"),
          blockedCount: parseInt(source.blocked_count || "0"),
          lastSeen: source.last_seen,
          threatTypes: Array.isArray(source.threat_types)
            ? source.threat_types
            : [],
        })),
        attackVectors: attackVectors.map((vector) => ({
          targetEndpoint: vector.target_endpoint,
          attackCount: parseInt(vector.attack_count || "0"),
          uniqueAttackers: parseInt(vector.unique_attackers || "0"),
          blockedAttacks: parseInt(vector.blocked_attacks || "0"),
        })),
        threatIntelligence: {
          knownMaliciousIps: parseInt(
            threatIntelligence?.known_malicious_ips || "0",
          ),
          botnetSources: parseInt(threatIntelligence?.botnet_sources || "0"),
          torSources: parseInt(threatIntelligence?.tor_sources || "0"),
        },
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error("Threat analytics error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch threat analytics" },
      { status: 500 },
    );
  }
}
