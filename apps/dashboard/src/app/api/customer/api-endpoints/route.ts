import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Get all endpoints from scans — every URL that has been scanned is a monitored API
    const endpoints = await database.queryMany(
      `SELECT
         url,
         MAX(security_score) FILTER (WHERE id = latest_id) as last_score,
         COUNT(*) as scan_count,
         MAX(created_at) as last_scanned,
         SUM(vulnerability_count) FILTER (WHERE id = latest_id) as vuln_count
       FROM (
         SELECT *,
           FIRST_VALUE(id) OVER (PARTITION BY url ORDER BY created_at DESC) as latest_id
         FROM security_scans
         WHERE tenant_id = $1 AND status = 'completed'
       ) scans
       GROUP BY url
       ORDER BY MAX(security_score) FILTER (WHERE id = latest_id) ASC NULLS LAST`,
      [tenantId],
    );

    // Get per-endpoint vuln counts from vulnerabilities table (deduplicated)
    const vulnCounts = await database.queryMany(
      `SELECT affected_url, COUNT(*) as count
       FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'
       GROUP BY affected_url`,
      [tenantId],
    );
    const vulnMap: Record<string, number> = {};
    for (const v of vulnCounts) {
      vulnMap[v.affected_url] = parseInt(v.count);
    }

    const result = endpoints.map((ep: any) => {
      const score = parseInt(ep.last_score || "0");
      const vulns = vulnMap[ep.url] || parseInt(ep.vuln_count || "0");
      return {
        url: ep.url,
        score,
        vulnCount: vulns,
        scanCount: parseInt(ep.scan_count || "0"),
        lastScanned: ep.last_scanned,
        status: score >= 80 ? "good" : score >= 50 ? "warning" : "critical",
      };
    });

    return NextResponse.json({
      success: true,
      endpoints: result,
      total: result.length,
    });

  // ── Legacy query below (kept for reference) ──
  } catch (e) {
    // Fallback: try old apis table
    try {
      const apis = await database.queryMany(
        `SELECT * FROM apis WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
      return NextResponse.json({ success: true, endpoints: apis, total: apis.length });
    } catch {}
    return NextResponse.json({ error: "Failed to fetch endpoints" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Keep existing POST for adding endpoints manually
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });
  try {
    const { name, url, method = "GET", description } = await request.json();
    if (!url) return NextResponse.json({ error: "URL required" }, { status: 400 });
    const ep = await database.queryOne(
      `INSERT INTO apis (tenant_id, name, url, method, description, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'active', NOW()) RETURNING *`,
      [tenantId, name || url, url, method, description || ""],
    );
    return NextResponse.json({ success: true, endpoint: ep });
  } catch (error) {
    return NextResponse.json({ error: "Failed to add endpoint" }, { status: 500 });
  }
}

/* ── OLD GET CODE REMOVED — was querying empty apis table ── */

