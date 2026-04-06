import { NextRequest, NextResponse } from "next/server";
import { APIKeyService } from "../../../../services/api-key-service";
import { database } from "../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing API key. Use: Authorization: Bearer gov_live_..." }, { status: 401 });
  }

  const apiKey = authHeader.substring(7);
  const validation = await APIKeyService.validateAPIKey(apiKey);
  if (!validation.valid || !validation.tenantId) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const tenantId = validation.tenantId.toString();

  try {
    // Get latest per-endpoint scores
    const scoreResult = await database.queryOne(
      `SELECT ROUND(AVG(latest_score)) as score FROM (
         SELECT DISTINCT ON (url) security_score as latest_score
         FROM security_scans WHERE tenant_id = $1 AND status = 'completed' AND security_score IS NOT NULL
         ORDER BY url, created_at DESC
       ) sub`,
      [tenantId],
    );
    const score = parseInt(scoreResult?.score || "0");

    // Get open vulnerability counts by severity
    const vulnCounts = await database.queryOne(
      `SELECT
         COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
         COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high,
         COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END) as medium,
         COUNT(CASE WHEN severity = 'LOW' THEN 1 END) as low
       FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'`,
      [tenantId],
    );
    const critical = parseInt(vulnCounts?.critical || "0");
    const high = parseInt(vulnCounts?.high || "0");
    const medium = parseInt(vulnCounts?.medium || "0");
    const low = parseInt(vulnCounts?.low || "0");

    // Check for policy violations (ci/cd fail actions)
    const violations = await database.queryMany(
      `SELECT pt.details, cr.name as policy_name
       FROM policy_triggers pt
       JOIN custom_rules cr ON pt.policy_id = cr.id
       WHERE pt.tenant_id = $1 AND cr.action = 'fail_cicd' AND cr.is_active = true
         AND pt.triggered_at > NOW() - INTERVAL '24 hours'
       ORDER BY pt.triggered_at DESC LIMIT 10`,
      [tenantId],
    );

    const pass = critical === 0 && violations.length === 0;

    return NextResponse.json({
      pass,
      score,
      vulnerabilities: { critical, high, medium, low },
      violations: violations.map((v) => ({
        policy: v.policy_name,
        details: v.details,
      })),
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({ error: "Check failed" }, { status: 500 });
  }
}
