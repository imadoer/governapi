import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const timeframe = request.nextUrl.searchParams.get("timeframe") || "24h";
    const hours = timeframe === "1h" ? 1 : timeframe === "24h" ? 24 : timeframe === "7d" ? 168 : 720;

    try {
      // Severity distribution based on risk score
      const severityData = await database.query(
        `SELECT 
          CASE 
            WHEN risk_score >= 90 THEN 'Critical'
            WHEN risk_score >= 75 THEN 'High'
            WHEN risk_score >= 50 THEN 'Medium'
            ELSE 'Low'
          END as name,
          COUNT(*) as value
         FROM threat_events_enhanced
         WHERE tenant_id = $1 
         AND created_at > NOW() - INTERVAL '${hours} hours'
         GROUP BY name
         ORDER BY value DESC`,
        [tenantId]
      );

      // Top threat types
      const topThreats = await database.query(
        `SELECT event_type as type, COUNT(*) as count
         FROM threat_events_enhanced
         WHERE tenant_id = $1
         AND created_at > NOW() - INTERVAL '${hours} hours'
         GROUP BY event_type
         ORDER BY count DESC
         LIMIT 5`,
        [tenantId]
      );

      // Activity timeline
      const timeline = await database.query(
        `SELECT 
          date_trunc('hour', created_at) as timestamp,
          COUNT(*) as count,
          COUNT(*) FILTER (WHERE blocked = true) as blocked
         FROM threat_events_enhanced
         WHERE tenant_id = $1
         AND created_at > NOW() - INTERVAL '${hours} hours'
         GROUP BY date_trunc('hour', created_at)
         ORDER BY timestamp ASC`,
        [tenantId]
      );

      return NextResponse.json({
        success: true,
        stats: {
          severityDistribution: severityData.rows,
          topThreatTypes: topThreats.rows,
          activityTimeline: timeline.rows,
        },
      });
    } catch (dbError) {
      console.log("Stats query failed:", dbError);
      return NextResponse.json({
        success: true,
        stats: {
          severityDistribution: [],
          topThreatTypes: [],
          activityTimeline: [],
        },
      });
    }
  } catch (error: any) {
    console.error("Stats error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
