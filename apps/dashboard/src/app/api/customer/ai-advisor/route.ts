import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DAILY_LIMIT = 20;

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  // Check plan — professional only
  const company = await database.queryOne(
    `SELECT subscription_plan FROM companies WHERE id = $1`, [tenantId],
  );
  if (!company || !["professional", "enterprise"].includes(company.subscription_plan || "")) {
    return NextResponse.json({ error: "AI Advisor requires Professional plan", upgrade: true }, { status: 403 });
  }

  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "AI Advisor not configured — ANTHROPIC_API_KEY missing" }, { status: 503 });
  }

  // Rate limit: 20 messages/day/user
  const todayCount = await database.queryOne(
    `SELECT COUNT(*) as count FROM policy_triggers
     WHERE tenant_id = $1 AND action_taken = 'ai_advisor' AND triggered_at > NOW() - INTERVAL '24 hours'`,
    [tenantId],
  );
  if (parseInt(todayCount?.count || "0") >= DAILY_LIMIT) {
    return NextResponse.json({ error: `Daily limit reached (${DAILY_LIMIT} messages/day). Resets in 24 hours.` }, { status: 429 });
  }

  try {
    const { message } = await request.json();
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    // Build context from customer's actual data
    const [scoreRes, vulnsRes, complianceRes, scansRes, endpointsRes] = await Promise.all([
      database.queryOne(
        `SELECT ROUND(AVG(latest_score)) as score FROM (
           SELECT DISTINCT ON (url) security_score as latest_score
           FROM security_scans WHERE tenant_id = $1 AND status = 'completed' AND security_score IS NOT NULL
           ORDER BY url, created_at DESC
         ) sub`, [tenantId]),
      database.queryMany(
        `SELECT vulnerability_type, severity, title, affected_url, remediation
         FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'
         ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END
         LIMIT 20`, [tenantId]),
      database.queryMany(
        `SELECT DISTINCT ON (vulnerability_type) vulnerability_type as type, severity
         FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'
         ORDER BY vulnerability_type`, [tenantId]),
      database.queryOne(
        `SELECT COUNT(*) as total,
           COUNT(CASE WHEN created_at > NOW() - INTERVAL '7 days' THEN 1 END) as last_week
         FROM security_scans WHERE tenant_id = $1 AND status = 'completed'`, [tenantId]),
      database.queryMany(
        `SELECT DISTINCT ON (url) url, security_score
         FROM security_scans WHERE tenant_id = $1 AND status = 'completed'
         ORDER BY url, created_at DESC LIMIT 20`, [tenantId]),
    ]);

    const score = parseInt(scoreRes?.score || "0");
    const vulnList = vulnsRes.map((v: any) => `- [${v.severity}] ${v.title} on ${v.affected_url}`).join("\n");
    const endpoints = endpointsRes.map((e: any) => `- ${e.url} (score: ${e.security_score})`).join("\n");
    const vulnTypes = complianceRes.map((v: any) => v.type).join(", ");

    const systemPrompt = `You are GovernAPI's AI Security Advisor. You help users improve their API security based on their REAL scan data.

CUSTOMER DATA (live from their dashboard):
- Overall Security Score: ${score}/100
- Total Scans: ${scansRes?.total || 0} (${scansRes?.last_week || 0} in last 7 days)
- Monitored Endpoints (${endpointsRes.length}):
${endpoints || "  None yet"}
- Open Vulnerabilities (${vulnsRes.length}):
${vulnList || "  None"}
- Vulnerability Types Found: ${vulnTypes || "None"}

RULES:
- Give specific, actionable advice based on THEIR data above — never generic tips
- Reference their actual vulnerability names, URLs, and scores
- When suggesting fixes, include brief code snippets (Express, Nginx, or Django)
- Be concise — 2-4 paragraphs max
- If they ask about something not in their data, say so honestly
- Format with markdown for readability`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[AI Advisor] API error:", response.status, err);
      return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 502 });
    }

    const result = await response.json();
    const reply = result.content?.[0]?.text || "I couldn't generate a response. Please try again.";

    // Track usage
    await database.query(
      `INSERT INTO policy_triggers (tenant_id, policy_id, details, action_taken, triggered_at)
       VALUES ($1, 0, $2, 'ai_advisor', NOW())`,
      [tenantId, message.substring(0, 200)],
    ).catch(() => {});

    const remaining = DAILY_LIMIT - parseInt(todayCount?.count || "0") - 1;

    return NextResponse.json({ success: true, reply, remaining });
  } catch (error: any) {
    console.error("[AI Advisor] Error:", error?.message);
    return NextResponse.json({ error: "Failed to get AI response" }, { status: 500 });
  }
}
