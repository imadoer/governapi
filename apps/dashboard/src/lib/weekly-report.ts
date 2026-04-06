import { database } from "../infrastructure/database";
import { EmailService } from "./email";
import { assessCompliance } from "./compliance-mapper";

let weeklyIntervalId: ReturnType<typeof setInterval> | null = null;

/** Start the weekly report scheduler — runs every hour, sends on Monday 8 AM UTC */
export function startWeeklyReportScheduler() {
  if (weeklyIntervalId) return;
  console.log("[WeeklyReport] Scheduler started — checks hourly for Monday 8 AM UTC");
  weeklyIntervalId = setInterval(checkAndSendReports, 60 * 60 * 1000); // hourly
  // Also check on startup (in case server restarted on Monday morning)
  setTimeout(checkAndSendReports, 30_000);
}

async function checkAndSendReports() {
  const now = new Date();
  // Only run on Monday between 8:00 and 8:59 UTC
  if (now.getUTCDay() !== 1 || now.getUTCHours() !== 8) return;

  try {
    // Find all companies that haven't received a report this week
    const companies = await database.queryMany(
      `SELECT DISTINCT c.company_id as id, c.company_name as name
       FROM companies c
       JOIN users u ON u.company_id = c.company_id
       WHERE c.status = 'active'`,
      [],
    );

    for (const company of companies) {
      try {
        // Check if weekly reports are disabled
        const settings = await database.queryOne(
          `SELECT settings FROM enterprise_settings WHERE tenant_id = $1`,
          [company.id],
        );
        const parsed = settings?.settings
          ? (typeof settings.settings === "string" ? JSON.parse(settings.settings) : settings.settings)
          : {};
        if (parsed.weeklyReportEnabled === false) continue;

        // Check we haven't already sent this week
        const alreadySent = await database.queryOne(
          `SELECT id FROM policy_triggers
           WHERE tenant_id = $1 AND action_taken = 'weekly_report' AND triggered_at > NOW() - INTERVAL '6 days'`,
          [company.id],
        );
        if (alreadySent) continue;

        // Get the account owner email
        const owner = await database.queryOne(
          `SELECT email, full_name FROM users WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1`,
          [company.id],
        );
        if (!owner?.email) continue;

        await sendWeeklyReport(company.id, company.name, owner.email, owner.full_name);

        // Record that we sent it
        await database.query(
          `INSERT INTO policy_triggers (tenant_id, policy_id, details, action_taken, triggered_at)
           VALUES ($1, 0, 'Weekly report sent to ' || $2, 'weekly_report', NOW())`,
          [company.id, owner.email],
        ).catch(() => {});

      } catch (err: any) {
        console.error(`[WeeklyReport] Error for company ${company.id}:`, err?.message);
      }
    }
  } catch (err: any) {
    console.error("[WeeklyReport] Scheduler error:", err?.message);
  }
}

async function sendWeeklyReport(tenantId: string, companyName: string, email: string, userName: string) {
  // Current score
  const scoreResult = await database.queryOne(
    `SELECT ROUND(AVG(latest_score)) as score FROM (
       SELECT DISTINCT ON (url) security_score as latest_score
       FROM security_scans WHERE tenant_id = $1 AND status = 'completed' AND security_score IS NOT NULL
       ORDER BY url, created_at DESC
     ) sub`,
    [tenantId],
  );
  const currentScore = parseInt(scoreResult?.score || "0");

  // Last week's score (scans from 7-14 days ago)
  const lastWeekResult = await database.queryOne(
    `SELECT ROUND(AVG(latest_score)) as score FROM (
       SELECT DISTINCT ON (url) security_score as latest_score
       FROM security_scans
       WHERE tenant_id = $1 AND status = 'completed' AND security_score IS NOT NULL
         AND created_at < NOW() - INTERVAL '7 days'
       ORDER BY url, created_at DESC
     ) sub`,
    [tenantId],
  );
  const lastWeekScore = parseInt(lastWeekResult?.score || "0");
  const scoreDiff = currentScore - lastWeekScore;
  const scoreArrow = scoreDiff > 0 ? "↑" : scoreDiff < 0 ? "↓" : "→";
  const scoreColor = scoreDiff > 0 ? "#10b981" : scoreDiff < 0 ? "#ef4444" : "#94a3b8";

  // New vulns this week
  const newVulns = await database.queryOne(
    `SELECT COUNT(*) as count FROM vulnerabilities
     WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days' AND created_at = last_seen`,
    [tenantId],
  );
  const newVulnCount = parseInt(newVulns?.count || "0");

  // Resolved vulns this week
  const resolvedVulns = await database.queryOne(
    `SELECT COUNT(*) as count FROM vulnerabilities
     WHERE tenant_id = $1 AND status = 'resolved' AND updated_at > NOW() - INTERVAL '7 days'`,
    [tenantId],
  );
  const resolvedCount = parseInt(resolvedVulns?.count || "0");

  // Open vulns
  const openVulns = await database.queryOne(
    `SELECT COUNT(*) as count FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'`,
    [tenantId],
  );
  const openCount = parseInt(openVulns?.count || "0");

  // Compliance score
  const vulnSummaries = await database.queryMany(
    `SELECT vulnerability_type as type, severity, title, COUNT(*) as count
     FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'
     GROUP BY vulnerability_type, severity, title`,
    [tenantId],
  );
  const assessments = assessCompliance(vulnSummaries, true);
  const avgCompliance = assessments.length > 0
    ? Math.round(assessments.reduce((s, a) => s + a.score, 0) / assessments.length)
    : 0;

  // Top 3 priority fixes
  const topVulns = await database.queryMany(
    `SELECT DISTINCT ON (vulnerability_type) vulnerability_type, severity, title, remediation
     FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'
     ORDER BY vulnerability_type, CASE severity
       WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
       created_at DESC
     LIMIT 3`,
    [tenantId],
  );

  // Scans this week
  const weekScans = await database.queryOne(
    `SELECT COUNT(*) as count FROM security_scans WHERE tenant_id = $1 AND created_at > NOW() - INTERVAL '7 days'`,
    [tenantId],
  );

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://146.190.99.58:3000";

  const html = buildWeeklyReportHtml({
    userName: userName || "there",
    companyName,
    currentScore,
    lastWeekScore,
    scoreDiff,
    scoreArrow,
    scoreColor,
    newVulnCount,
    resolvedCount,
    openCount,
    avgCompliance,
    topVulns,
    weekScans: parseInt(weekScans?.count || "0"),
    baseUrl,
  });

  await EmailService.send({
    to: email,
    subject: `GovernAPI Weekly Security Report — ${companyName}`,
    html,
  });

  console.log(`[WeeklyReport] Sent to ${email} for ${companyName} (score: ${currentScore})`);
}

function buildWeeklyReportHtml(d: any): string {
  const fixItems = (d.topVulns || []).map((v: any) =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${
          v.severity === "CRITICAL" ? "#ef444420" : v.severity === "HIGH" ? "#f59e0b20" : "#eab30820"
        };color:${
          v.severity === "CRITICAL" ? "#ef4444" : v.severity === "HIGH" ? "#f59e0b" : "#eab308"
        };">${v.severity}</span>
      </td>
      <td style="padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e2e8f0;font-size:13px;">${v.title}</td>
    </tr>`
  ).join("");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;">
<div style="max-width:600px;margin:0 auto;background:#1e293b;">

<!-- Header -->
<div style="padding:32px 40px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);">
  <div style="display:inline-block;padding:10px 20px;background:linear-gradient(135deg,#06b6d4,#3b82f6);border-radius:10px;margin-bottom:16px;">
    <span style="color:white;font-size:20px;font-weight:bold;">GovernAPI</span>
  </div>
  <h2 style="margin:0;color:white;font-size:22px;">Weekly Security Report</h2>
  <p style="margin:8px 0 0;color:#64748b;font-size:13px;">${d.companyName} — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
</div>

<!-- Score Banner -->
<div style="padding:32px 40px;text-align:center;">
  <div style="display:inline-block;width:100px;height:100px;border-radius:50%;border:4px solid ${
    d.currentScore >= 70 ? "#10b981" : d.currentScore >= 40 ? "#f59e0b" : "#ef4444"
  };line-height:92px;text-align:center;">
    <span style="font-size:36px;font-weight:bold;color:white;">${d.currentScore}</span>
  </div>
  <p style="margin:12px 0 0;color:${d.scoreColor};font-size:16px;font-weight:600;">
    ${d.scoreArrow} ${Math.abs(d.scoreDiff)} from last week ${d.lastWeekScore > 0 ? `(was ${d.lastWeekScore})` : ""}
  </p>
</div>

<!-- Stats Grid -->
<div style="padding:0 40px 24px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
    <tr>
      <td style="padding:16px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);border-bottom:1px solid rgba(255,255,255,0.06);width:50%;">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">New Vulns</div>
        <div style="color:${d.newVulnCount > 0 ? "#ef4444" : "#10b981"};font-size:24px;font-weight:bold;margin-top:4px;">${d.newVulnCount}</div>
      </td>
      <td style="padding:16px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.06);width:50%;">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Resolved</div>
        <div style="color:#10b981;font-size:24px;font-weight:bold;margin-top:4px;">${d.resolvedCount}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px;text-align:center;border-right:1px solid rgba(255,255,255,0.06);width:50%;">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Open Vulns</div>
        <div style="color:#f59e0b;font-size:24px;font-weight:bold;margin-top:4px;">${d.openCount}</div>
      </td>
      <td style="padding:16px;text-align:center;width:50%;">
        <div style="color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Compliance</div>
        <div style="color:#06b6d4;font-size:24px;font-weight:bold;margin-top:4px;">${d.avgCompliance}%</div>
      </td>
    </tr>
  </table>
</div>

<!-- Top Fixes -->
${d.topVulns.length > 0 ? `
<div style="padding:0 40px 32px;">
  <h3 style="margin:0 0 12px;color:white;font-size:15px;font-weight:600;">Top Priority Fixes</h3>
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(255,255,255,0.06);border-radius:8px;overflow:hidden;">
    ${fixItems}
  </table>
</div>
` : ""}

<!-- CTA -->
<div style="padding:0 40px 32px;text-align:center;">
  <a href="${d.baseUrl}/dashboard" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg,#06b6d4,#3b82f6);color:white;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">
    View Full Dashboard →
  </a>
</div>

<!-- Footer -->
<div style="padding:20px 40px;background:rgba(0,0,0,0.3);border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
  <p style="margin:0 0 4px;color:#64748b;font-size:11px;">Scans this week: ${d.weekScans}</p>
  <p style="margin:0;color:#475569;font-size:10px;">
    You're receiving this because weekly reports are enabled.
    <a href="${d.baseUrl}/dashboard" style="color:#475569;">Manage in Settings</a>
  </p>
  <p style="margin:8px 0 0;color:#334155;font-size:10px;">© ${new Date().getFullYear()} GovernAPI</p>
</div>

</div></body></html>`;
}

/** Send a test weekly report immediately (for testing) */
export async function sendTestWeeklyReport(tenantId: string) {
  const company = await database.queryOne(
    `SELECT company_id as id, company_name as name FROM companies WHERE company_id = $1`,
    [tenantId],
  );
  if (!company) throw new Error("Company not found");

  const owner = await database.queryOne(
    `SELECT email, full_name FROM users WHERE company_id = $1 ORDER BY created_at ASC LIMIT 1`,
    [tenantId],
  );
  if (!owner?.email) throw new Error("No owner email found");

  await sendWeeklyReport(company.id, company.name, owner.email, owner.full_name);
  return { email: owner.email };
}
