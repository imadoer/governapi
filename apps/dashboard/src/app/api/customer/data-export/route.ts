import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

const ALLOWED_TYPES = ["all", "scans", "vulnerabilities", "threats", "webhooks"] as const;
const MAX_RECORDS = 10000;

export async function GET(request: NextRequest) {
  // Self-auth: accept x-tenant-id (internal) or Bearer session token
  let tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    const auth = request.headers.get("authorization");
    const cookie = request.cookies.get("session_token")?.value;
    const token = auth?.startsWith("Bearer ") ? auth.substring(7) : cookie;
    if (token) {
      try {
        const { UserAuthService } = await import("../../../../services/auth/UserAuthService");
        const result = await UserAuthService.validateSession(token);
        if (result.success) tenantId = result.company?.id?.toString() || null;
      } catch {}
    }
  }
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") || "json";
    const dataType = url.searchParams.get("type") || "all";

    if (!ALLOWED_TYPES.includes(dataType as any)) {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    const safe = async (query: string, params: any[]) => {
      try { return await database.queryMany(query, params); } catch { return []; }
    };

    const wantScans = dataType === "all" || dataType === "scans";
    const wantVulns = dataType === "all" || dataType === "vulnerabilities" || dataType === "threats";
    const wantWebhooks = dataType === "all" || dataType === "webhooks";

    const [scans, vulns, webhooks] = await Promise.all([
      wantScans ? safe(
        `SELECT id, url as target, scan_type, status, security_score, vulnerability_count, created_at, completed_at, scan_duration
         FROM security_scans WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [tenantId, MAX_RECORDS]) : [],
      wantVulns ? safe(
        `SELECT id, title, vulnerability_type, severity, cvss_score, cwe_id, affected_url, status, remediation, created_at, last_seen
         FROM vulnerabilities WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [tenantId, MAX_RECORDS]) : [],
      wantWebhooks ? safe(
        `SELECT id, integration_type as type, is_active, last_used, created_at
         FROM external_integrations WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT $2`,
        [tenantId, MAX_RECORDS]) : [],
    ]);

    if (format === "csv") {
      let csv = "";
      if (wantVulns && vulns.length > 0) {
        csv += "id,title,vulnerability_type,severity,cvss_score,cwe_id,affected_url,status,created_at,last_seen\n";
        for (const v of vulns) {
          csv += `${v.id},"${(v.title||'').replace(/"/g,'""')}","${v.vulnerability_type}",${v.severity},${v.cvss_score||''},${v.cwe_id||''},"${v.affected_url||''}",${v.status},${v.created_at},${v.last_seen||''}\n`;
        }
      }
      if (wantScans && scans.length > 0) {
        if (csv) csv += "\n";
        csv += "id,target,scan_type,status,security_score,vulnerability_count,created_at,completed_at,duration_sec\n";
        for (const s of scans) {
          csv += `${s.id},"${s.target}",${s.scan_type},${s.status},${s.security_score||''},${s.vulnerability_count||0},${s.created_at},${s.completed_at||''},${s.scan_duration||''}\n`;
        }
      }
      if (wantWebhooks && webhooks.length > 0) {
        if (csv) csv += "\n";
        csv += "id,type,is_active,last_used,created_at\n";
        for (const w of webhooks) {
          csv += `${w.id},${w.type},${w.is_active},${w.last_used||''},${w.created_at}\n`;
        }
      }
      if (!csv) csv = "No data available for export.\n";

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="governapi-${dataType}-${Date.now()}.csv"`,
        },
      });
    }

    // JSON
    return NextResponse.json({
      success: true,
      export: {
        exportId: `export_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        dataType,
        summary: { scans: scans.length, vulnerabilities: vulns.length, webhooks: webhooks.length },
        data: {
          ...(scans.length > 0 && { scans }),
          ...(vulns.length > 0 && { vulnerabilities: vulns }),
          ...(webhooks.length > 0 && { webhooks }),
        },
      },
    });
  } catch (error) {
    logger.error("Export error:", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
