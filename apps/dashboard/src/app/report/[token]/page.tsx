import { database } from "../../../infrastructure/database";

export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Resolve company from token (company_id or a hash)
  let company = await database.queryOne(
    `SELECT company_id as id, company_name as name FROM companies WHERE company_id = $1 AND status = 'active'`,
    [token],
  ).catch(() => null);

  if (!company) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#64748b" }}>
          <h1 style={{ color: "white", fontSize: 24 }}>Report Not Found</h1>
          <p>This security report link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  // Get score
  const scoreResult = await database.queryOne(
    `SELECT ROUND(AVG(latest_score)) as score FROM (
       SELECT DISTINCT ON (url) security_score as latest_score
       FROM security_scans WHERE tenant_id = $1 AND status = 'completed' AND security_score IS NOT NULL
       ORDER BY url, created_at DESC
     ) sub`,
    [company.id],
  ).catch(() => null);
  const score = parseInt(scoreResult?.score || "0");

  // Last scan date
  const lastScan = await database.queryOne(
    `SELECT MAX(completed_at) as last_scan FROM security_scans WHERE tenant_id = $1 AND status = 'completed'`,
    [company.id],
  ).catch(() => null);
  const lastScanDate = lastScan?.last_scan
    ? new Date(lastScan.last_scan).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "No scans yet";

  // Compliance summary
  const vulnSummaries = await database.queryMany(
    `SELECT vulnerability_type as type, severity, title, COUNT(*) as count
     FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'
     GROUP BY vulnerability_type, severity, title`,
    [company.id],
  ).catch(() => []);

  // Import dynamically to avoid client bundle issues
  const { assessCompliance } = await import("../../../lib/compliance-mapper");
  const assessments = assessCompliance(vulnSummaries, true);

  // Scan count
  const scanCount = await database.queryOne(
    `SELECT COUNT(*) as count FROM security_scans WHERE tenant_id = $1 AND status = 'completed'`,
    [company.id],
  ).catch(() => null);

  const scoreColor = score >= 70 ? "#10b981" : score >= 40 ? "#f59e0b" : "#ef4444";
  const scoreLabel = score >= 70 ? "Good" : score >= 40 ? "Needs Improvement" : "Critical";

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", fontFamily: "system-ui, -apple-system, sans-serif", color: "#e2e8f0" }}>
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-block", padding: "8px 20px", background: "linear-gradient(135deg, #06b6d4, #3b82f6)", borderRadius: 10, marginBottom: 16 }}>
            <span style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>GovernAPI</span>
          </div>
          <h1 style={{ margin: 0, color: "white", fontSize: 24, fontWeight: 600 }}>Security Report</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 14 }}>{company.name}</p>
        </div>

        {/* Score */}
        <div style={{ textAlign: "center", marginBottom: 40, padding: 32, background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 120, height: 120, borderRadius: "50%",
            border: `5px solid ${scoreColor}`, marginBottom: 12,
          }}>
            <span style={{ fontSize: 48, fontWeight: "bold", color: "white" }}>{score}</span>
          </div>
          <p style={{ margin: 0, color: scoreColor, fontSize: 16, fontWeight: 600 }}>{scoreLabel}</p>
          <p style={{ margin: "8px 0 0", color: "#64748b", fontSize: 13 }}>
            Last scanned: {lastScanDate} · {parseInt(scanCount?.count || "0")} total scans
          </p>
        </div>

        {/* Compliance */}
        <div style={{ marginBottom: 40, padding: 24, background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
          <h2 style={{ margin: "0 0 16px", color: "white", fontSize: 16, fontWeight: 600 }}>Compliance Summary</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {assessments.map((a) => (
              <div key={a.id} style={{ padding: 12, background: "rgba(15,23,42,0.5)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 4 }}>{a.shortName}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: a.score >= 70 ? "#10b981" : a.score >= 40 ? "#f59e0b" : "#ef4444" }}>
                  {a.score}%
                </div>
                <div style={{ fontSize: 11, color: "#475569" }}>{a.passing}/{a.totalRequirements} passing</div>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ textAlign: "center", color: "#475569", fontSize: 11, lineHeight: 1.6 }}>
          <p style={{ margin: "0 0 16px" }}>
            This report is generated by automated external security scanning and does not constitute a formal audit.
            For detailed findings, the organization can share their full GovernAPI dashboard.
          </p>
          <p style={{ margin: 0 }}>
            <a href="https://governapi.com" style={{ color: "#06b6d4", textDecoration: "none" }}>Powered by GovernAPI</a>
            {" "}— API Security Scanning & Compliance
          </p>
        </div>
      </div>
    </div>
  );
}
