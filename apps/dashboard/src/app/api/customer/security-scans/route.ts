import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { dispatchWebhooks } from "../../../../lib/webhook-dispatch";
import { evaluatePolicies } from "../../../../lib/policy-engine";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = `
      SELECT 
        ss.id,
        ss.url as target,
        ss.scan_type,
        ss.status,
        ss.security_score,
        ss.vulnerability_count,
        ss.created_at,
        ss.completed_at,
        ss.scan_duration as duration
      FROM security_scans ss
      WHERE ss.tenant_id = $1`;

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND ss.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY ss.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const securityScans = await database.queryMany(query, params);

    const scanStats = await database.queryOne(
      `SELECT
         COUNT(*) as total_scans,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_scans,
         COUNT(CASE WHEN status = 'running' THEN 1 END) as running_scans,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_scans,
         AVG(CASE WHEN security_score IS NOT NULL THEN security_score END) as avg_security_score
       FROM security_scans
       WHERE tenant_id = $1`,
      [tenantId],
    );

    const vulnSummary = await database.queryOne(
      `SELECT
         COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_vulns,
         COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_vulns,
         COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END) as medium_vulns,
         COUNT(CASE WHEN severity = 'LOW' THEN 1 END) as low_vulns
       FROM vulnerabilities
       WHERE tenant_id = $1 AND status = 'open'`,
      [tenantId],
    );

    const formattedScans = securityScans.map((scan: any) => ({
      id: scan.id,
      target: scan.target,
      scanType: scan.scan_type,
      status: scan.status,
      securityScore: scan.security_score,
      vulnerabilityCount: scan.vulnerability_count || 0,
      createdAt: scan.created_at,
      completedAt: scan.completed_at,
      duration: scan.duration,
    }));

    return NextResponse.json({
      success: true,
      securityScans: formattedScans,
      statistics: {
        total: parseInt(scanStats?.total_scans || "0"),
        completed: parseInt(scanStats?.completed_scans || "0"),
        running: parseInt(scanStats?.running_scans || "0"),
        failed: parseInt(scanStats?.failed_scans || "0"),
        averageSecurityScore: scanStats?.avg_security_score
          ? Math.round(parseFloat(scanStats.avg_security_score))
          : null,
      },
      vulnerabilitySummary: {
        critical: parseInt(vulnSummary?.critical_vulns || "0"),
        high: parseInt(vulnSummary?.high_vulns || "0"),
        medium: parseInt(vulnSummary?.medium_vulns || "0"),
        low: parseInt(vulnSummary?.low_vulns || "0"),
      },
      pagination: {
        limit,
        offset,
        hasMore: formattedScans.length === limit,
      },
    });
  } catch (error) {
    logger.error("Security scans GET error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch security scans",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const { url, scanType = "comprehensive" } = body;

    // Plan-based scan limit enforcement (checked BEFORE scan runs)
    const company = await database.queryOne(
      `SELECT subscription_plan FROM companies WHERE id = $1`, [tenantId],
    );
    const plan = company?.subscription_plan || "free";
    if (plan === "free") {
      const monthScans = await database.queryOne(
        `SELECT COUNT(*) as count FROM security_scans WHERE tenant_id = $1 AND created_at > DATE_TRUNC('month', NOW())`,
        [tenantId],
      );
      if (parseInt(monthScans?.count || "0") >= 3) {
        return NextResponse.json(
          { error: "Scan limit reached (3/month on Free plan). Upgrade to Starter for unlimited scans.", upgrade: true },
          { status: 403 },
        );
      }
    }

    if (!url) {
      return NextResponse.json(
        { error: "Target URL is required" },
        { status: 400 },
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { error: "Invalid URL protocol. Only HTTP and HTTPS are allowed" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid target URL format" },
        { status: 400 },
      );
    }

    // Normalize: strip trailing slash for deduplication
    // https://stripe.com/ and https://stripe.com are the same endpoint
    let normalizedUrl = parsedUrl.toString();
    if (normalizedUrl.endsWith("/") && parsedUrl.pathname === "/") {
      normalizedUrl = normalizedUrl.slice(0, -1);
    } else if (parsedUrl.pathname.length > 1 && normalizedUrl.endsWith("/")) {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    // Block scanning of webhook/integration URLs
    const blockedDomains = ["hooks.slack.com", "events.pagerduty.com", "discord.com/api/webhooks"];
    // Also check tenant's own webhook URLs
    try {
      const integrations = await database.queryMany(
        `SELECT credentials->>'webhook_url' as url FROM external_integrations WHERE tenant_id = $1 AND is_active = true`,
        [tenantId],
      );
      for (const i of integrations) {
        if (i.url) {
          try { blockedDomains.push(new URL(i.url).hostname); } catch {}
        }
      }
    } catch {}

    if (blockedDomains.some((d) => parsedUrl.hostname.includes(d))) {
      return NextResponse.json(
        { error: "Cannot scan webhook or integration URLs. These are for sending notifications, not for security scanning." },
        { status: 400 },
      );
    }

    const validScanTypes = [
      "quick",
      "comprehensive",
      "deep",
      "owasp_top10",
      "custom",
    ];
    if (!validScanTypes.includes(scanType)) {
      return NextResponse.json(
        { error: "Invalid scan type. Allowed: " + validScanTypes.join(", ") },
        { status: 400 },
      );
    }

    const existingScan = await database.queryOne(
      `SELECT id FROM security_scans
       WHERE tenant_id = $1 AND url = $2 AND status IN ('pending', 'running')`,
      [tenantId, normalizedUrl],
    );

    if (existingScan) {
      return NextResponse.json(
        {
          error: "A security scan is already running for this target",
          existingScanId: existingScan.id,
        },
        { status: 409 },
      );
    }

    const securityScan = await database.queryOne(
      `INSERT INTO security_scans (tenant_id, url, target, scan_type, status, created_at, created_by)
       VALUES ($1, $2, $2, $3, $4, NOW(), $5) RETURNING *`,
      [tenantId, normalizedUrl, scanType, "pending", userId || "system"],
    );

    if (!securityScan) {
      return NextResponse.json(
        { error: "Failed to create security scan" },
        { status: 500 },
      );
    }

    await database.query(
      `INSERT INTO scan_queue (scan_id, tenant_id, scan_type, priority, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [securityScan.id, tenantId, "security", "normal"],
    );

    startSecurityScan(securityScan.id, tenantId, normalizedUrl, scanType).catch(err => {
      logger.error("Async scan start failed:", err);
    });

    return NextResponse.json({
      success: true,
      securityScan: {
        id: securityScan.id,
        target: securityScan.url,
        scanType: securityScan.scan_type,
        status: securityScan.status,
        createdAt: securityScan.created_at,
      },
      message: "Security scan queued successfully",
    });
  } catch (error) {
    logger.error("Security scan POST error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: "Failed to create security scan",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 },
    );
  }
}

// ========================================
// SCANNING LOGIC BY TYPE
// ========================================

async function startSecurityScan(
  scanId: number,
  tenantId: string,
  targetUrl: string,
  scanType: string
) {
  const startTime = Date.now();
  
  try {
    await database.query(
      `UPDATE security_scans SET status = 'running', updated_at = NOW() WHERE id = $1`,
      [scanId]
    );

    let vulnerabilities: any[] = [];
    let securityScore = 100;

    // Execute scan based on type
    switch (scanType) {
      case "quick":
        vulnerabilities = await runQuickScan(targetUrl);
        break;
      case "comprehensive":
        vulnerabilities = await runComprehensiveScan(targetUrl);
        break;
      case "deep":
        vulnerabilities = await runDeepScan(targetUrl);
        break;
      case "owasp_top10":
        vulnerabilities = await runOWASPScan(targetUrl);
        break;
      default:
        vulnerabilities = await runComprehensiveScan(targetUrl);
    }

    // Calculate security score based on vulnerabilities
    vulnerabilities.forEach(vuln => {
      if (vuln.severity === 'CRITICAL') securityScore -= 25;
      else if (vuln.severity === 'HIGH') securityScore -= 15;
      else if (vuln.severity === 'MEDIUM') securityScore -= 10;
      else if (vuln.severity === 'LOW') securityScore -= 5;
    });

    securityScore = Math.max(0, securityScore);

    // Upsert vulnerabilities — update last_seen if same vuln+url exists, else insert
    for (const vuln of vulnerabilities) {
      const existing = await database.queryOne(
        `SELECT id FROM vulnerabilities
         WHERE tenant_id = $1 AND vulnerability_type = $2 AND affected_url = $3 AND status = 'open'`,
        [tenantId, vuln.vulnerability_type, vuln.affected_url],
      );

      if (existing) {
        await database.query(
          `UPDATE vulnerabilities SET scan_id = $1, last_seen = NOW(), severity = $2 WHERE id = $3`,
          [scanId, vuln.severity, existing.id],
        );
      } else {
        await database.query(
          `INSERT INTO vulnerabilities (
            tenant_id, scan_id, vulnerability_type, severity, title,
            description, cwe_id, cvss_score, affected_url, remediation, status, created_at, last_seen
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'open', NOW(), NOW())`,
          [
            tenantId, scanId, vuln.vulnerability_type, vuln.severity,
            vuln.title, vuln.description, vuln.cwe_id || null,
            vuln.cvss_score || null, vuln.affected_url, vuln.remediation,
          ],
        );
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    await database.query(
      `UPDATE security_scans 
       SET status = 'completed', 
           security_score = $1, 
           vulnerability_count = $2,
           scan_duration = $3,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $4`,
      [securityScore, vulnerabilities.length, duration, scanId]
    );

    await database.query(
      `UPDATE scan_queue SET status = 'completed', processed_at = NOW() WHERE scan_id = $1`,
      [scanId]
    );

    // Dispatch webhook notifications (fire-and-forget)
    const sevCounts: Record<string, number> = {};
    const criticals: string[] = [];
    for (const v of vulnerabilities) {
      sevCounts[v.severity] = (sevCounts[v.severity] || 0) + 1;
      if (v.severity === "CRITICAL") criticals.push(v.title);
    }
    dispatchWebhooks(tenantId, "scan.completed", {
      scanId, url: targetUrl, securityScore,
      vulnerabilityCount: vulnerabilities.length,
      severities: sevCounts,
      criticalVulns: criticals,
      scanType,
    }).catch((err) => console.error("Webhook dispatch failed:", err));

    // Send email alert for CRITICAL vulnerabilities
    if (criticals.length > 0) {
      import("../../../../lib/email").then(({ EmailService }) => {
        database.queryOne(
          `SELECT u.email, u.first_name, c.company_name FROM users u JOIN companies c ON u.company_id = c.id WHERE c.id = $1 ORDER BY u.created_at LIMIT 1`,
          [tenantId],
        ).then((owner) => {
          if (!owner?.email) return;
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXTAUTH_URL || "https://governapi.com";
          EmailService.send({
            to: owner.email,
            subject: `CRITICAL vulnerability found on ${targetUrl}`,
            html: `<!DOCTYPE html><html><body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0f172a;">
<div style="max-width:600px;margin:0 auto;background:#1e293b;">
<div style="padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.06);text-align:center;">
  <div style="display:inline-block;padding:10px 20px;background:linear-gradient(135deg,#ef4444,#dc2626);border-radius:10px;margin-bottom:16px;">
    <span style="color:white;font-size:18px;font-weight:bold;">CRITICAL Alert</span>
  </div>
  <h2 style="margin:0;color:white;font-size:20px;">Critical vulnerability detected</h2>
</div>
<div style="padding:32px 40px;">
  <p style="color:#e2e8f0;font-size:15px;">Hi ${owner.first_name || "there"},</p>
  <p style="color:#e2e8f0;font-size:15px;">A scan of <strong style="color:white;">${targetUrl}</strong> found ${criticals.length} CRITICAL vulnerabilit${criticals.length > 1 ? "ies" : "y"}:</p>
  <div style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:8px;padding:16px;margin:16px 0;">
    ${criticals.map(c => `<p style="margin:4px 0;color:#fca5a5;font-size:14px;">&#x2022; ${c}</p>`).join("")}
  </div>
  <p style="color:#94a3b8;font-size:14px;">Security score: <strong style="color:${securityScore >= 70 ? "#10b981" : securityScore >= 40 ? "#f59e0b" : "#ef4444"}">${securityScore}/100</strong></p>
  <div style="text-align:center;margin:24px 0;">
    <a href="${baseUrl}/dashboard" style="display:inline-block;padding:12px 32px;background:#ef4444;color:white;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">View in Dashboard →</a>
  </div>
</div>
<div style="padding:16px 40px;background:rgba(0,0,0,0.3);text-align:center;">
  <p style="margin:0;color:#475569;font-size:10px;">GovernAPI Critical Vulnerability Alert — ${owner.company_name}</p>
</div>
</div></body></html>`,
          }).catch(() => {});
        }).catch(() => {});
      }).catch(() => {});
    }

    // Evaluate security policies after scan completion
    evaluatePolicies({
      scanId,
      tenantId,
      url: targetUrl,
      securityScore,
      vulnerabilities,
    }).catch((err) => console.error("Policy evaluation failed:", err));

  } catch (error) {
    logger.error("Security scan execution failed:", error);
    
    await database.query(
      `UPDATE security_scans 
       SET status = 'failed', 
           error_message = $1,
           updated_at = NOW()
       WHERE id = $2`,
      [error instanceof Error ? error.message : String(error), scanId]
    );

    await database.query(
      `UPDATE scan_queue 
       SET status = 'failed', 
           error_message = $1,
           processed_at = NOW() 
       WHERE scan_id = $2`,
      [error instanceof Error ? error.message : String(error), scanId]
    );
  }
}

// ========================================
// QUICK SCAN - Basic Security Headers
// ========================================
async function runQuickScan(targetUrl: string): Promise<any[]> {
  const vulnerabilities: any[] = [];

  try {
    const response = await fetch(targetUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(10000),
    });

    const headers = response.headers;

    // Check security headers
    if (!headers.get("x-frame-options")) {
      vulnerabilities.push({
        vulnerability_type: "Missing X-Frame-Options",
        severity: "MEDIUM",
        title: "Clickjacking Protection Missing",
        description: "The X-Frame-Options header is not set, making the site vulnerable to clickjacking attacks",
        cwe_id: "CWE-1021",
        cvss_score: 5.3,
        affected_url: targetUrl,
        remediation: "Add 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN' header",
      });
    }

    if (!headers.get("strict-transport-security")) {
      vulnerabilities.push({
        vulnerability_type: "Missing HSTS",
        severity: "HIGH",
        title: "HTTP Strict Transport Security Not Enabled",
        description: "HSTS header missing - traffic can be downgraded to HTTP",
        cwe_id: "CWE-523",
        cvss_score: 7.4,
        affected_url: targetUrl,
        remediation: "Add 'Strict-Transport-Security: max-age=31536000; includeSubDomains' header",
      });
    }

    if (!headers.get("x-content-type-options")) {
      vulnerabilities.push({
        vulnerability_type: "Missing X-Content-Type-Options",
        severity: "LOW",
        title: "MIME Sniffing Not Prevented",
        description: "Browser may interpret files as different MIME type",
        cwe_id: "CWE-16",
        cvss_score: 3.7,
        affected_url: targetUrl,
        remediation: "Add 'X-Content-Type-Options: nosniff' header",
      });
    }

    if (!headers.get("content-security-policy")) {
      vulnerabilities.push({
        vulnerability_type: "Missing CSP",
        severity: "MEDIUM",
        title: "No Content Security Policy",
        description: "Missing CSP makes site vulnerable to XSS attacks",
        cwe_id: "CWE-693",
        cvss_score: 6.1,
        affected_url: targetUrl,
        remediation: "Implement Content-Security-Policy header with strict directives",
      });
    }

    // Rate Limiting Check
    const rateLimitHeaders = [
      "x-ratelimit-limit",
      "x-ratelimit-remaining",
      "x-ratelimit-reset",
      "retry-after",
      "ratelimit-limit",
      "ratelimit-policy",
    ];
    const foundRateLimitHeader = rateLimitHeaders.find((h) => headers.get(h));
    if (!foundRateLimitHeader) {
      vulnerabilities.push({
        vulnerability_type: "Missing Rate Limiting",
        severity: "MEDIUM",
        title: "No Rate Limiting Detected",
        description: "No rate limiting headers found (X-RateLimit-Limit, RateLimit-Limit, Retry-After, etc). Without rate limiting, attackers can send unlimited requests, leading to denial of service, credential stuffing, or data scraping.",
        cwe_id: "CWE-770",
        cvss_score: 5.3,
        affected_url: targetUrl,
        remediation: "Implement rate limiting on your API. Examples:\n\n• Express: Use express-rate-limit middleware\n  const rateLimit = require('express-rate-limit');\n  app.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));\n\n• Nginx: Use limit_req directive\n  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\n  location /api/ { limit_req zone=api burst=20; }\n\n• Django: Use django-ratelimit\n  @ratelimit(key='ip', rate='100/h')\n  def api_view(request): ...",
      });
    }

    // SSL/TLS Check
    if (targetUrl.startsWith('http://')) {
      vulnerabilities.push({
        vulnerability_type: "Insecure Protocol",
        severity: "HIGH",
        title: "HTTP Instead of HTTPS",
        description: "Site is accessible over unencrypted HTTP",
        cwe_id: "CWE-319",
        cvss_score: 7.5,
        affected_url: targetUrl,
        remediation: "Enforce HTTPS and redirect all HTTP traffic",
      });
    }

  } catch (fetchError) {
    vulnerabilities.push({
      vulnerability_type: "Target Unreachable",
      severity: "HIGH",
      title: "Cannot Connect to Target",
      description: `Failed to connect: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`,
      affected_url: targetUrl,
      remediation: "Verify target URL is accessible and not blocking requests",
    });
  }

  return vulnerabilities;
}

// ========================================
// COMPREHENSIVE SCAN - Headers + Common Vulnerabilities
// ========================================
async function runComprehensiveScan(targetUrl: string): Promise<any[]> {
  let vulnerabilities = await runQuickScan(targetUrl);

  try {
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(15000),
    });

    const headers = response.headers;
    const body = await response.text();

    // CORS Check
    const corsHeader = headers.get("access-control-allow-origin");
    if (corsHeader === "*") {
      vulnerabilities.push({
        vulnerability_type: "Insecure CORS Configuration",
        severity: "HIGH",
        title: "Overly Permissive CORS Policy",
        description: "Access-Control-Allow-Origin is set to wildcard (*)",
        cwe_id: "CWE-942",
        cvss_score: 7.5,
        affected_url: targetUrl,
        remediation: "Restrict CORS to specific trusted domains only",
      });
    }

    // Cookie Security
    const setCookie = headers.get("set-cookie");
    if (setCookie) {
      if (!setCookie.includes("Secure")) {
        vulnerabilities.push({
          vulnerability_type: "Insecure Cookie",
          severity: "MEDIUM",
          title: "Cookie Missing Secure Flag",
          description: "Cookies can be transmitted over unencrypted connections",
          cwe_id: "CWE-614",
          cvss_score: 5.9,
          affected_url: targetUrl,
          remediation: "Add 'Secure' flag to all cookies",
        });
      }
      if (!setCookie.includes("HttpOnly")) {
        vulnerabilities.push({
          vulnerability_type: "Insecure Cookie",
          severity: "MEDIUM",
          title: "Cookie Missing HttpOnly Flag",
          description: "Cookies accessible via JavaScript, vulnerable to XSS",
          cwe_id: "CWE-1004",
          cvss_score: 6.1,
          affected_url: targetUrl,
          remediation: "Add 'HttpOnly' flag to sensitive cookies",
        });
      }
      if (!setCookie.includes("SameSite")) {
        vulnerabilities.push({
          vulnerability_type: "Insecure Cookie",
          severity: "MEDIUM",
          title: "Cookie Missing SameSite Attribute",
          description: "Vulnerable to CSRF attacks",
          cwe_id: "CWE-352",
          cvss_score: 6.5,
          affected_url: targetUrl,
          remediation: "Add 'SameSite=Strict' or 'SameSite=Lax' to cookies",
        });
      }
    }

    // Information Disclosure
    const serverHeader = headers.get("server");
    if (serverHeader && (serverHeader.includes("Apache") || serverHeader.includes("nginx"))) {
      vulnerabilities.push({
        vulnerability_type: "Information Disclosure",
        severity: "LOW",
        title: "Server Version Disclosure",
        description: `Server header reveals: ${serverHeader}`,
        cwe_id: "CWE-200",
        cvss_score: 3.7,
        affected_url: targetUrl,
        remediation: "Remove or obfuscate server version information",
      });
    }

    const xPoweredBy = headers.get("x-powered-by");
    if (xPoweredBy) {
      vulnerabilities.push({
        vulnerability_type: "Information Disclosure",
        severity: "LOW",
        title: "Technology Stack Disclosure",
        description: `X-Powered-By header reveals: ${xPoweredBy}`,
        cwe_id: "CWE-200",
        cvss_score: 3.7,
        affected_url: targetUrl,
        remediation: "Remove X-Powered-By header",
      });
    }

    // ── Credential Leak Detection ──
    // Scan response headers and body for exposed secrets/API keys
    const credentialPatterns: { name: string; pattern: RegExp; mask: (m: string) => string }[] = [
      { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/g, mask: (m) => m.slice(0, 8) + "..." },
      { name: "AWS Secret Key", pattern: /(?:aws_secret_access_key|AWS_SECRET)['"=:\s]+([A-Za-z0-9/+=]{40})/gi, mask: (m) => m.slice(0, 15) + "..." },
      { name: "Stripe Secret Key", pattern: /sk_live_[0-9a-zA-Z]{24,}/g, mask: (m) => m.slice(0, 12) + "..." },
      { name: "Stripe Publishable Key", pattern: /pk_live_[0-9a-zA-Z]{24,}/g, mask: (m) => m.slice(0, 12) + "..." },
      { name: "GitHub Token", pattern: /gh[po]_[A-Za-z0-9_]{36,}/g, mask: (m) => m.slice(0, 8) + "..." },
      { name: "GitHub Fine-Grained Token", pattern: /github_pat_[A-Za-z0-9_]{22,}/g, mask: (m) => m.slice(0, 15) + "..." },
      { name: "Slack Token", pattern: /xox[bpras]-[0-9A-Za-z-]{10,}/g, mask: (m) => m.slice(0, 10) + "..." },
      { name: "Google API Key", pattern: /AIza[0-9A-Za-z_-]{35}/g, mask: (m) => m.slice(0, 10) + "..." },
      { name: "Bearer Token in HTML", pattern: /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/g, mask: (m) => m.slice(0, 15) + "..." },
      { name: "Private Key", pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, mask: () => "-----BEGIN PRIVATE KEY-----" },
      { name: "Generic Secret Assignment", pattern: /(?:api[_-]?key|secret[_-]?key|access[_-]?token|auth[_-]?token|password)\s*[=:]\s*['"][A-Za-z0-9/+=_.-]{16,}['"]/gi, mask: (m) => m.slice(0, 20) + "..." },
    ];

    // Check headers for leaked credentials
    const allHeaders = [...headers.entries()].map(([k, v]) => `${k}: ${v}`).join("\n");
    const searchTargets = [
      { source: "response body", text: body.slice(0, 500000) },
      { source: "response headers", text: allHeaders },
    ];

    for (const { source, text } of searchTargets) {
      for (const cred of credentialPatterns) {
        const matches = text.match(cred.pattern);
        if (matches) {
          // Deduplicate matches
          const unique = [...new Set(matches)];
          for (const match of unique.slice(0, 3)) {
            vulnerabilities.push({
              vulnerability_type: "Credential Leak",
              severity: "CRITICAL",
              title: `Exposed ${cred.name}`,
              description: `${cred.name} found in ${source}: ${cred.mask(match)}. This credential could be used by attackers to access your systems.`,
              cwe_id: "CWE-798",
              cvss_score: 9.8,
              affected_url: targetUrl,
              remediation: `Immediately rotate this ${cred.name}. Remove it from ${source}. Use environment variables or a secrets manager instead of hardcoding credentials.`,
            });
          }
        }
      }
    }

    // Check for common sensitive files with false-positive detection.
    // Many sites return 200 with a custom "not found" page for all paths (soft 404).
    // We fetch a known-bad path first as a baseline, then compare.
    const sensitiveFiles = [
      { path: '/.env', signatures: ['DB_PASSWORD', 'DATABASE_URL', 'SECRET_KEY', 'API_KEY', 'APP_KEY='] },
      { path: '/.git/config', signatures: ['[core]', '[remote', 'repositoryformatversion'] },
      { path: '/config.json', signatures: ['"database"', '"host"', '"password"', '"secret"'] },
      { path: '/package.json', signatures: ['"name"', '"version"', '"dependencies"'] },
      { path: '/.htaccess', signatures: ['RewriteEngine', 'RewriteRule', 'Deny from', 'AuthType'] },
      { path: '/wp-config.php', signatures: ['DB_NAME', 'DB_USER', 'DB_PASSWORD', 'table_prefix'] },
      { path: '/admin', signatures: [] },
      { path: '/phpmyadmin', signatures: ['phpMyAdmin', 'pma_', 'server_type'] },
    ];

    // Fetch a baseline response from a random nonexistent path to detect soft 404s
    let baselineSize = -1;
    let baselineBodySnippet = '';
    try {
      const baselineUrl = new URL('/___governapi_probe_404_' + Date.now(), targetUrl).toString();
      const baselineResp = await fetch(baselineUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'GovernAPI-Scanner/1.0' },
      });
      if (baselineResp.status === 200) {
        const baselineBody = await baselineResp.text();
        baselineSize = baselineBody.length;
        baselineBodySnippet = baselineBody.slice(0, 2000).toLowerCase();
      }
    } catch {}

    const softNotFoundPatterns = [
      'not found', 'page not found', '404', 'does not exist',
      'no results', 'nothing here', 'page you requested',
      'couldn\'t find', 'could not find', 'unavailable',
    ];

    for (const { path: file, signatures } of sensitiveFiles) {
      try {
        const fileUrl = new URL(file, targetUrl).toString();
        const fileResponse = await fetch(fileUrl, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'GovernAPI-Scanner/1.0' },
        });

        if (fileResponse.status !== 200) continue;

        const body = await fileResponse.text();
        const bodyLower = body.slice(0, 2000).toLowerCase();
        const bodySize = body.length;

        // Check 1: If response is same size as baseline (±10%), it's a soft 404
        if (baselineSize > 0 && Math.abs(bodySize - baselineSize) < baselineSize * 0.1) {
          continue; // Same as the 404 page — skip
        }

        // Check 2: If body contains "not found" type messages, skip
        if (softNotFoundPatterns.some(p => bodyLower.includes(p))) {
          continue;
        }

        // Check 3: If body content closely matches baseline content, skip
        if (baselineBodySnippet && baselineBodySnippet.length > 100) {
          // Simple similarity: if >80% of baseline snippet appears in this response
          const overlap = baselineBodySnippet.split(' ').filter(w => w.length > 4 && bodyLower.includes(w)).length;
          const totalWords = baselineBodySnippet.split(' ').filter(w => w.length > 4).length;
          if (totalWords > 10 && overlap / totalWords > 0.8) {
            continue; // Content is too similar to baseline 404
          }
        }

        // Check 4: For files with known signatures, verify at least one signature is present
        if (signatures.length > 0) {
          const hasSignature = signatures.some(sig => body.includes(sig));
          if (!hasSignature) {
            continue; // No expected content signatures found — likely not a real exposure
          }
        }

        // Passed all checks — this is a real exposure
        vulnerabilities.push({
          vulnerability_type: "Information Disclosure",
          severity: "CRITICAL",
          title: `Exposed Sensitive File: ${file}`,
          description: `Sensitive file ${file} is publicly accessible and contains expected content`,
          cwe_id: "CWE-548",
          cvss_score: 9.8,
          affected_url: fileUrl,
          remediation: `Restrict access to ${file} or remove from public directory`,
        });
      } catch {}
    }

  } catch (error) {
    logger.error("Comprehensive scan error:", error);
  }

  return vulnerabilities;
}

// ========================================
// DEEP SCAN - Full Vulnerability Testing
// ========================================
async function runDeepScan(targetUrl: string): Promise<any[]> {
  let vulnerabilities = await runComprehensiveScan(targetUrl);

  try {
    const parsedUrl = new URL(targetUrl);

    // SQL Injection Testing (Basic)
    const sqlPayloads = ["'", "1' OR '1'='1", "'; DROP TABLE users--"];
    
    for (const payload of sqlPayloads) {
      try {
        const testUrl = `${targetUrl}${parsedUrl.search ? '&' : '?'}test=${encodeURIComponent(payload)}`;
        const response = await fetch(testUrl, {
          signal: AbortSignal.timeout(5000),
        });
        const body = await response.text();
        
        if (body.includes('SQL') || body.includes('syntax error') || body.includes('mysql')) {
          vulnerabilities.push({
            vulnerability_type: "SQL Injection",
            severity: "CRITICAL",
            title: "Potential SQL Injection Vulnerability",
            description: "Application may be vulnerable to SQL injection attacks",
            cwe_id: "CWE-89",
            cvss_score: 9.8,
            affected_url: testUrl,
            affected_parameter: "test",
            remediation: "Use parameterized queries and input validation",
          });
          break; // Found one, no need to test more
        }
      } catch {}
    }

    // XSS Testing (Basic)
    const xssPayloads = ["<script>alert(1)</script>", "<img src=x onerror=alert(1)>"];
    
    for (const payload of xssPayloads) {
      try {
        const testUrl = `${targetUrl}${parsedUrl.search ? '&' : '?'}q=${encodeURIComponent(payload)}`;
        const response = await fetch(testUrl, {
          signal: AbortSignal.timeout(5000),
        });
        const body = await response.text();
        
        if (body.includes(payload)) {
          vulnerabilities.push({
            vulnerability_type: "Cross-Site Scripting (XSS)",
            severity: "HIGH",
            title: "Reflected XSS Vulnerability Detected",
            description: "User input is reflected without proper sanitization",
            cwe_id: "CWE-79",
            cvss_score: 7.3,
            affected_url: testUrl,
            affected_parameter: "q",
            remediation: "Sanitize all user input and encode output properly",
          });
          break;
        }
      } catch {}
    }

    // Path Traversal Testing
    const traversalPayloads = ["../../../etc/passwd", "....//....//....//etc/passwd"];
    
    for (const payload of traversalPayloads) {
      try {
        const testUrl = `${targetUrl}${parsedUrl.search ? '&' : '?'}file=${encodeURIComponent(payload)}`;
        const response = await fetch(testUrl, {
          signal: AbortSignal.timeout(5000),
        });
        const body = await response.text();
        
        if (body.includes('root:') || body.includes('/bin/bash')) {
          vulnerabilities.push({
            vulnerability_type: "Path Traversal",
            severity: "CRITICAL",
            title: "Directory Traversal Vulnerability",
            description: "Application allows access to files outside intended directory",
            cwe_id: "CWE-22",
            cvss_score: 9.1,
            affected_url: testUrl,
            affected_parameter: "file",
            remediation: "Validate and sanitize file paths, use whitelist approach",
          });
          break;
        }
      } catch {}
    }

    // Command Injection Testing
    const commandPayloads = ["; ls", "| whoami", "`id`"];
    
    for (const payload of commandPayloads) {
      try {
        const testUrl = `${targetUrl}${parsedUrl.search ? '&' : '?'}cmd=${encodeURIComponent(payload)}`;
        const response = await fetch(testUrl, {
          signal: AbortSignal.timeout(5000),
        });
        const body = await response.text();
        
        if (body.includes('uid=') || body.includes('gid=') || body.includes('total ')) {
          vulnerabilities.push({
            vulnerability_type: "Command Injection",
            severity: "CRITICAL",
            title: "OS Command Injection Vulnerability",
            description: "Application executes system commands with user input",
            cwe_id: "CWE-78",
            cvss_score: 9.8,
            affected_url: testUrl,
            affected_parameter: "cmd",
            remediation: "Never execute user input as system commands, use safe APIs",
          });
          break;
        }
      } catch {}
    }

    // API Endpoint Discovery
    const commonApiPaths = ['/api', '/api/v1', '/api/v2', '/graphql', '/rest', '/swagger', '/api-docs'];
    
    for (const path of commonApiPaths) {
      try {
        const apiUrl = new URL(path, targetUrl).toString();
        const response = await fetch(apiUrl, {
          signal: AbortSignal.timeout(5000),
        });
        
        if (response.status < 400) {
          vulnerabilities.push({
            vulnerability_type: "Information Disclosure",
            severity: "LOW",
            title: `API Endpoint Discovered: ${path}`,
            description: `Public API endpoint found at ${path}`,
            cwe_id: "CWE-200",
            cvss_score: 3.7,
            affected_url: apiUrl,
            remediation: "Ensure API endpoints have proper authentication",
          });
        }
      } catch {}
    }

  } catch (error) {
    logger.error("Deep scan error:", error);
  }

  return vulnerabilities;
}

// ========================================
// OWASP TOP 10 SCAN
// ========================================
async function runOWASPScan(targetUrl: string): Promise<any[]> {
  let vulnerabilities = await runDeepScan(targetUrl);

  try {
    // A01:2021 - Broken Access Control
    const adminPaths = ['/admin', '/administrator', '/wp-admin', '/dashboard', '/panel'];
    for (const path of adminPaths) {
      try {
        const adminUrl = new URL(path, targetUrl).toString();
        const response = await fetch(adminUrl, {
          signal: AbortSignal.timeout(5000),
        });
        
        if (response.status === 200) {
          vulnerabilities.push({
            vulnerability_type: "Broken Access Control",
            severity: "HIGH",
            title: "Admin Panel Accessible Without Authentication",
            description: `Admin path ${path} is accessible without proper authentication`,
            cwe_id: "CWE-284",
            cvss_score: 8.1,
            affected_url: adminUrl,
            remediation: "Implement proper authentication and authorization",
          });
        }
      } catch {}
    }

    // A02:2021 - Cryptographic Failures
    if (targetUrl.startsWith('http://')) {
      vulnerabilities.push({
        vulnerability_type: "Cryptographic Failure",
        severity: "CRITICAL",
        title: "Sensitive Data Transmitted Over HTTP",
        description: "Site uses HTTP instead of HTTPS for sensitive data",
        cwe_id: "CWE-319",
        cvss_score: 9.1,
        affected_url: targetUrl,
        remediation: "Migrate to HTTPS and enable HSTS",
      });
    }

    // A04:2021 - Insecure Design
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(10000),
    });
    
    const headers = response.headers;
    if (!headers.get('x-frame-options') && !headers.get('content-security-policy')) {
      vulnerabilities.push({
        vulnerability_type: "Insecure Design",
        severity: "MEDIUM",
        title: "Missing Security Controls",
        description: "Multiple security headers are missing",
        cwe_id: "CWE-693",
        cvss_score: 5.3,
        affected_url: targetUrl,
        remediation: "Implement comprehensive security headers",
      });
    }

    // A05:2021 - Security Misconfiguration
    try {
      const robotsUrl = new URL('/robots.txt', targetUrl).toString();
      const robotsResponse = await fetch(robotsUrl, {
        signal: AbortSignal.timeout(5000),
      });
      
      if (robotsResponse.status === 200) {
        const robotsText = await robotsResponse.text();
        if (robotsText.includes('Disallow: /admin') || robotsText.includes('Disallow: /backup')) {
          vulnerabilities.push({
            vulnerability_type: "Security Misconfiguration",
            severity: "LOW",
            title: "robots.txt Discloses Sensitive Paths",
            description: "robots.txt reveals sensitive directory locations",
            cwe_id: "CWE-200",
            cvss_score: 3.7,
            affected_url: robotsUrl,
            remediation: "Avoid disclosing sensitive paths in robots.txt",
          });
        }
      }
    } catch {}

    // A06:2021 - Vulnerable and Outdated Components
    const techStack = [];
    const serverHeader = headers.get('server');
    const xPoweredBy = headers.get('x-powered-by');
    
    if (serverHeader) techStack.push(serverHeader);
    if (xPoweredBy) techStack.push(xPoweredBy);
    
    if (techStack.length > 0) {
      vulnerabilities.push({
        vulnerability_type: "Vulnerable Components",
        severity: "MEDIUM",
        title: "Technology Stack Version Disclosure",
        description: `Exposed technology: ${techStack.join(', ')}`,
        cwe_id: "CWE-1395",
        cvss_score: 5.3,
        affected_url: targetUrl,
        remediation: "Keep all components updated and remove version headers",
      });
    }

    // A09:2021 - Security Logging and Monitoring Failures
    if (!headers.get('x-request-id') && !headers.get('x-correlation-id')) {
      vulnerabilities.push({
        vulnerability_type: "Insufficient Logging",
        severity: "LOW",
        title: "Missing Request Tracking Headers",
        description: "No request ID or correlation headers for monitoring",
        cwe_id: "CWE-778",
        cvss_score: 3.1,
        affected_url: targetUrl,
        remediation: "Implement request tracking and correlation IDs",
      });
    }

  } catch (error) {
    logger.error("OWASP scan error:", error);
  }

  return vulnerabilities;
}
