import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

const PLAN_LIMITS: Record<string, any> = {
  free: { endpoints: 1, scansPerMonth: 3, fullScansPerWeek: 0, teamMembers: 0, aiMessages: 0, label: "Free" },
  starter: { endpoints: 5, scansPerMonth: Infinity, fullScansPerWeek: 5, teamMembers: 0, aiMessages: 0, label: "Starter" },
  professional: { endpoints: Infinity, scansPerMonth: Infinity, fullScansPerWeek: Infinity, teamMembers: 5, aiMessages: 20, label: "Professional" },
};

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const company = await database.queryOne(
      `SELECT subscription_plan FROM companies WHERE id = $1`, [tenantId],
    );
    const plan = company?.subscription_plan || "free";
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;

    // Get current usage
    const [scanCount, endpointCount, fullScanCount] = await Promise.all([
      database.queryOne(
        `SELECT COUNT(*) as count FROM security_scans WHERE tenant_id = $1 AND created_at > date_trunc('month', NOW())`,
        [tenantId]),
      database.queryOne(
        `SELECT COUNT(DISTINCT url) as count FROM security_scans WHERE tenant_id = $1 AND status = 'completed'`,
        [tenantId]),
      database.queryOne(
        `SELECT COUNT(*) as count FROM security_scans WHERE tenant_id = $1 AND scan_type IN ('comprehensive','deep','owasp_top10') AND created_at > NOW() - INTERVAL '7 days'`,
        [tenantId]),
    ]);

    return NextResponse.json({
      success: true,
      plan,
      limits,
      usage: {
        scansThisMonth: parseInt(scanCount?.count || "0"),
        endpoints: parseInt(endpointCount?.count || "0"),
        fullScansThisWeek: parseInt(fullScanCount?.count || "0"),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
