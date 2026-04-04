import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { assessCompliance, DISCLAIMER } from "../../../../lib/compliance-mapper";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    // Get all open vulnerabilities grouped by type
    const vulnSummaries = await database.queryMany(
      `SELECT vulnerability_type as type, severity, title, COUNT(*) as count
       FROM vulnerabilities
       WHERE tenant_id = $1 AND status = 'open'
       GROUP BY vulnerability_type, severity, title
       ORDER BY count DESC`,
      [tenantId],
    );

    // Check if there are recent scans (within 30 days)
    const recentScan = await database.queryOne(
      `SELECT COUNT(*) as count FROM security_scans
       WHERE tenant_id = $1 AND status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'`,
      [tenantId],
    );
    const hasRecentScans = parseInt(recentScan?.count || "0") > 0;

    // Check if there are ANY scans at all
    const anyScan = await database.queryOne(
      `SELECT COUNT(*) as count FROM security_scans WHERE tenant_id = $1 AND status = 'completed'`,
      [tenantId],
    );
    const hasAnyScans = parseInt(anyScan?.count || "0") > 0;

    if (!hasAnyScans) {
      return NextResponse.json({
        success: true,
        hasData: false,
        message: "Run a security scan to generate your compliance assessment",
        frameworks: [],
        disclaimer: DISCLAIMER,
      });
    }

    // Get company info for the report
    const company = await database.queryOne(
      `SELECT company_name FROM companies WHERE id = $1`,
      [tenantId],
    );

    const frameworks = assessCompliance(
      vulnSummaries.map((v: any) => ({
        type: v.type,
        severity: v.severity,
        title: v.title,
        count: parseInt(v.count),
      })),
      hasRecentScans,
    );

    // Overall compliance score (average across frameworks)
    const overallScore = frameworks.length > 0
      ? Math.round(frameworks.reduce((s, f) => s + f.score, 0) / frameworks.length)
      : 0;

    const res = NextResponse.json({
      success: true,
      hasData: true,
      companyName: company?.company_name || "Your Company",
      overallScore,
      frameworks,
      summary: {
        totalFrameworks: frameworks.length,
        totalRequirements: frameworks.reduce((s, f) => s + f.totalRequirements, 0),
        totalPassing: frameworks.reduce((s, f) => s + f.passing, 0),
        totalFailing: frameworks.reduce((s, f) => s + f.failing, 0),
      },
      disclaimer: DISCLAIMER,
      assessedAt: new Date().toISOString(),
    });

    res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return res;
  } catch (error) {
    console.error("Compliance assessment error:", error);
    return NextResponse.json({ error: "Assessment failed" }, { status: 500 });
  }
}
