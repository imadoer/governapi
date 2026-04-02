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

  const searchParams = request.nextUrl.searchParams;
  const timeframe = searchParams.get("timeframe") || "24h";

  const intervalMap: Record<string, string> = {
    "1h": "1 hour",
    "24h": "24 hours",
    "7d": "7 days",
    "30d": "30 days",
  };
  const interval = intervalMap[timeframe] || "24 hours";

  try {
    const [
      summaryResult,
      topThreats,
      trends,
      recentBlocked,
      threatSources,
      patterns,
      attackVectors,
    ] = await Promise.all([
      database.queryOne(
        `SELECT COUNT(*) as total_threats, COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_threats, COUNT(CASE WHEN risk_score >= 80 THEN 1 END) as critical_threats, COUNT(CASE WHEN risk_score >= 60 AND risk_score < 80 THEN 1 END) as high_threats, COUNT(CASE WHEN risk_score >= 40 AND risk_score < 60 THEN 1 END) as medium_threats, COUNT(CASE WHEN risk_score < 40 THEN 1 END) as low_threats, AVG(risk_score)::NUMERIC(10,2) as average_risk_score, COUNT(DISTINCT source_ip) as unique_sources FROM threat_events_enhanced WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '${interval}'`,
        [tenantId]
      ),
      database.queryMany(
        `SELECT event_type as type, COUNT(*) as count, AVG(risk_score)::NUMERIC(10,2) as avg_risk_score, MAX(detected_at) as last_seen FROM threat_events_enhanced WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '${interval}' GROUP BY event_type ORDER BY count DESC LIMIT 10`,
        [tenantId]
      ),
      database.queryMany(
        `SELECT DATE_TRUNC('hour', detected_at) as time_bucket, COUNT(*) as count, COUNT(CASE WHEN blocked = true THEN 1 END) as blocked, AVG(risk_score)::NUMERIC(10,2) as avg_risk FROM threat_events_enhanced WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '${interval}' GROUP BY time_bucket ORDER BY time_bucket ASC`,
        [tenantId]
      ),
      database.queryMany(
        `SELECT id, event_type as threat_type, source_ip, target_endpoint, CASE WHEN risk_score >= 80 THEN 'CRITICAL' WHEN risk_score >= 60 THEN 'HIGH' WHEN risk_score >= 40 THEN 'MEDIUM' ELSE 'LOW' END as severity, action_taken, detected_at as blocked_at, risk_score, request_path FROM threat_events_enhanced WHERE tenant_id = $1 AND blocked = true AND detected_at >= NOW() - INTERVAL '${interval}' ORDER BY detected_at DESC LIMIT 50`,
        [tenantId]
      ),
      database.queryMany(
        `SELECT source_ip, COUNT(*) as threat_count, COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count, MAX(detected_at) as last_activity, ARRAY_AGG(DISTINCT event_type) as threat_types, AVG(risk_score)::NUMERIC(10,2) as avg_risk_score FROM threat_events_enhanced WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '7 days' GROUP BY source_ip HAVING COUNT(*) >= 1 ORDER BY threat_count DESC LIMIT 20`,
        [tenantId]
      ),
      database.queryMany(
        `SELECT id, pattern_name as name, pattern_type as type, severity, is_active, created_at FROM threat_patterns WHERE is_active = true ORDER BY severity DESC, pattern_name LIMIT 20`
      ),
      database.queryMany(
        `SELECT CASE WHEN event_type ILIKE '%sql%' OR event_type ILIKE '%injection%' THEN 'Injection' WHEN event_type ILIKE '%xss%' OR event_type ILIKE '%script%' THEN 'XSS' WHEN event_type ILIKE '%auth%' OR event_type ILIKE '%brute%' THEN 'Auth Attack' WHEN event_type ILIKE '%ddos%' OR event_type ILIKE '%flood%' THEN 'DDoS' WHEN event_type ILIKE '%bot%' OR event_type ILIKE '%crawler%' THEN 'Bot Traffic' ELSE 'Other' END as vector, COUNT(*) as count FROM threat_events_enhanced WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '${interval}' GROUP BY vector ORDER BY count DESC`,
        [tenantId]
      ),
    ]);

    const summary = summaryResult || {
      total_threats: 0,
      blocked_threats: 0,
      critical_threats: 0,
      high_threats: 0,
      medium_threats: 0,
      low_threats: 0,
      average_risk_score: 0,
      unique_sources: 0,
    };

    return NextResponse.json({
      success: true,
      threatIntelligence: {
        summary: {
          totalThreats: parseInt(summary.total_threats || "0"),
          blockedThreats: parseInt(summary.blocked_threats || "0"),
          criticalThreats: parseInt(summary.critical_threats || "0"),
          highThreats: parseInt(summary.high_threats || "0"),
          mediumThreats: parseInt(summary.medium_threats || "0"),
          lowThreats: parseInt(summary.low_threats || "0"),
          averageRiskScore: parseFloat(summary.average_risk_score || "0"),
          uniqueSources: parseInt(summary.unique_sources || "0"),
          timeframe,
          updatedAt: new Date().toISOString(),
        },
        topThreats: topThreats.map((t: any) => ({
          type: t.type,
          count: parseInt(t.count),
          avgRiskScore: parseFloat(t.avg_risk_score || "0"),
          lastSeen: t.last_seen,
        })),
        geoDistribution: [],
        trends: trends.map((t: any) => ({
          timestamp: t.time_bucket,
          count: parseInt(t.count),
          blocked: parseInt(t.blocked),
          avgRisk: parseFloat(t.avg_risk || "0"),
        })),
        recentBlocked: recentBlocked.map((t: any) => ({
          id: t.id,
          threat_type: t.threat_type,
          source_ip: t.source_ip,
          target_endpoint: t.target_endpoint || "Unknown",
          severity: t.severity,
          action_taken: t.action_taken,
          blocked_at: t.blocked_at,
          risk_score: parseFloat(t.risk_score || "0"),
          request_path: t.request_path,
          country: null,
        })),
        threatSources: threatSources.map((s: any) => ({
          source_ip: s.source_ip,
          threat_count: parseInt(s.threat_count),
          blocked_count: parseInt(s.blocked_count),
          last_activity: s.last_activity,
          threat_types: s.threat_types || [],
          country: null,
          avg_risk_score: parseFloat(s.avg_risk_score || "0"),
        })),
        patterns: patterns.map((p: any) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          severity: p.severity,
          isActive: p.is_active === true,
          createdAt: p.created_at,
        })),
        attackVectors: attackVectors.map((v: any) => ({
          vector: v.vector,
          count: parseInt(v.count),
        })),
      },
    });
  } catch (error: any) {
    logger.error("Threat intelligence API error:", {
      error: error.message,
      stack: error.stack,
      tenantId,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch threat intelligence data",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
