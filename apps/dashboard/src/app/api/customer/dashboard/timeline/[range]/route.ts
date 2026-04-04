import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../../infrastructure/database";

export async function GET(request: NextRequest, { params }: { params: Promise<{ range: string }> }) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { range: rawRange } = await params;
  const range = ["24h", "7d", "30d"].includes(rawRange) ? rawRange : "7d";

  const config: Record<string, { interval: string; trunc: string }> = {
    "24h": { interval: "24 hours", trunc: "hour" },
    "7d":  { interval: "7 days",   trunc: "day" },
    "30d": { interval: "30 days",  trunc: "day" },
  };
  const { interval, trunc } = config[range];

  try {
    const [scans, threats, bots] = await Promise.all([
      database.queryMany(`
        SELECT DATE_TRUNC('${trunc}', created_at) as bucket,
               COUNT(*) as scan_count,
               ROUND(AVG(security_score)) as avg_score
        FROM security_scans
        WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '${interval}'
          AND status = 'completed' AND security_score IS NOT NULL
        GROUP BY 1 ORDER BY 1
      `, [tenantId]),
      database.queryMany(`
        SELECT DATE_TRUNC('${trunc}', detected_at) as bucket,
               COUNT(*) as threat_count,
               COUNT(*) FILTER (WHERE action_taken = 'blocked') as blocked_count
        FROM threat_events_enhanced
        WHERE tenant_id = $1 AND detected_at >= NOW() - INTERVAL '${interval}'
        GROUP BY 1 ORDER BY 1
      `, [tenantId]),
      database.queryMany(`
        SELECT DATE_TRUNC('${trunc}', detected_at) as bucket,
               COUNT(*) as bot_count,
               COUNT(*) FILTER (WHERE blocked = true) as bot_blocked
        FROM bot_detection_events
        WHERE detected_at >= NOW() - INTERVAL '${interval}'
        GROUP BY 1 ORDER BY 1
      `, []),
    ]);

    const map = new Map<string, any>();
    for (const r of scans) {
      const e = map.get(r.bucket) || { bucket: r.bucket, scans: 0, avgScore: null, threats: 0, blocked: 0 };
      e.scans = parseInt(r.scan_count); e.avgScore = parseInt(r.avg_score);
      map.set(r.bucket, e);
    }
    for (const r of threats) {
      const e = map.get(r.bucket) || { bucket: r.bucket, scans: 0, avgScore: null, threats: 0, blocked: 0 };
      e.threats += parseInt(r.threat_count); e.blocked += parseInt(r.blocked_count);
      map.set(r.bucket, e);
    }
    for (const r of bots) {
      const e = map.get(r.bucket) || { bucket: r.bucket, scans: 0, avgScore: null, threats: 0, blocked: 0 };
      e.threats += parseInt(r.bot_count); e.blocked += parseInt(r.bot_blocked);
      map.set(r.bucket, e);
    }

    const timeline = [...map.values()].sort((a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime());

    const res = NextResponse.json({ success: true, timeline, hasData: timeline.length > 0, range });
    res.headers.set("Cache-Control", "private, max-age=10, stale-while-revalidate=30");
    return res;
  } catch (error) {
    console.error("Timeline API error:", error);
    return NextResponse.json({ success: true, timeline: [], hasData: false, range });
  }
}
