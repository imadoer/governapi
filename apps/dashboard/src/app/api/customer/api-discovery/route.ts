import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

import { writeFileSync, appendFileSync } from "fs";

function debugLog(msg: string) {
  try { appendFileSync("/tmp/discovery-debug.log", msg + "\n"); } catch {}
}

const PROBE_PATHS = [
  // Common API roots
  "/", "/api", "/api/v1", "/api/v2", "/api/v3", "/v1", "/v2", "/v3",
  "/rest", "/rest/v1",
  // Common resources
  "/users", "/repos", "/gists", "/feeds", "/emojis", "/events",
  "/rate_limit", "/meta", "/octocat", "/zen", "/licenses",
  "/organizations", "/search", "/marketplace_listing/plans",
  "/notifications", "/issues", "/accounts", "/products", "/orders",
  "/api/users", "/api/admin", "/api/config", "/api/debug", "/api/internal",
  // Utility/test endpoints (httpbin-style)
  "/get", "/post", "/put", "/delete", "/patch",
  "/headers", "/ip", "/user-agent",
  "/html", "/json", "/xml", "/anything",
  "/cookies", "/cookies/set", "/redirect/1",
  "/status/200", "/status/418",
  "/response-headers", "/delay/0", "/base64/SFRUUEJJTg==",
  "/image", "/image/png", "/image/jpeg",
  "/encoding/utf8", "/forms/post", "/bytes/10",
  // User/account
  "/me", "/profile", "/settings", "/feed",
  "/webhook", "/webhooks", "/callback", "/ping", "/version",
  // Auth
  "/login", "/register", "/signup", "/logout", "/auth", "/oauth",
  "/oauth/authorize", "/oauth/token", "/token", "/api/token",
  "/auth/login", "/auth/register", "/sso", "/saml",
  "/.well-known/jwks.json", "/.well-known/openid-configuration",
  "/.well-known/security.txt",
  // Health/debug
  "/health", "/healthz", "/ready", "/alive", "/status", "/info",
  "/debug", "/debug/vars", "/debug/pprof", "/metrics", "/prometheus",
  "/config", "/configuration",
  // Docs
  "/graphql", "/graphiql", "/swagger", "/swagger-ui",
  "/swagger.json", "/swagger.yaml", "/openapi.json", "/openapi.yaml",
  "/docs", "/api-docs", "/api/docs", "/redoc", "/spec",
  // Sensitive/dangerous
  "/.env", "/.git", "/.git/config", "/.git/HEAD",
  "/admin", "/admin/api", "/console", "/dashboard",
  "/server-info", "/server-status", "/phpinfo.php",
  "/wp-admin", "/wp-json", "/wp-login.php",
  "/actuator", "/actuator/health", "/actuator/env", "/actuator/beans",
  // Data/storage
  "/db", "/database", "/phpmyadmin", "/adminer",
  "/elasticsearch", "/_cat/indices", "/_cluster/health",
  "/solr", "/redis", "/memcached",
  // Standard files
  "/robots.txt", "/sitemap.xml", "/favicon.ico", "/manifest.json",
  // Risky
  "/test", "/staging", "/backup",
];

const DANGEROUS = new Set([
  "/.env", "/.git", "/.git/config", "/.git/HEAD",
  "/admin", "/admin/api", "/console", "/debug", "/debug/vars", "/debug/pprof",
  "/config", "/configuration", "/phpinfo.php", "/server-info", "/server-status",
  "/actuator", "/actuator/env", "/actuator/beans", "/metrics", "/prometheus",
  "/api/debug", "/api/internal", "/api/config", "/api/admin", "/graphiql",
  "/backup", "/db", "/database", "/phpmyadmin", "/adminer",
  "/elasticsearch", "/_cat/indices", "/_cluster/health",
  "/solr", "/redis", "/memcached", "/staging", "/test", "/wp-admin",
]);

const SENSITIVE_PATTERNS = [
  { pattern: /DB_PASSWORD|DATABASE_URL|API_KEY|SECRET_KEY|PRIVATE_KEY/i, label: "Credentials exposed" },
  { pattern: /\[core\]|bare\s*=|repositoryformatversion/i, label: "Git config exposed" },
  { pattern: /phpinfo\(\)/i, label: "PHP info exposed" },
  { pattern: /BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY/i, label: "Private key exposed" },
];

/* ── POST: Run discovery scan ── */
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const { domain } = await request.json();
    if (!domain) return NextResponse.json({ error: "Domain required" }, { status: 400 });

    const clean = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const base = `https://${clean}`;
    const results: any[] = [];

    // Clear debug log
    try { writeFileSync("/tmp/discovery-debug.log", `=== Discovery scan: ${clean} at ${new Date().toISOString()} ===\nProbing ${PROBE_PATHS.length} paths...\n\n`); } catch {}

    // Probe in parallel batches of 10
    for (let i = 0; i < PROBE_PATHS.length; i += 10) {
      const batch = PROBE_PATHS.slice(i, i + 10);
      const settled = await Promise.allSettled(batch.map((p) => probe(base, p)));
      for (let j = 0; j < settled.length; j++) {
        const r = settled[j];
        if (r.status === "fulfilled" && r.value) {
          results.push(r.value);
        } else if (r.status === "rejected") {
          debugLog(`  REJECTED ${batch[j]}: ${r.reason}`);
        }
      }
    }

    // Separate found vs not-found
    const found = results.filter((r) => r.risk !== "not_found");
    const critical = found.filter((r) => r.risk === "exposed");
    const publicEps = found.filter((r) => r.risk === "public");
    const protectedEps = found.filter((r) => r.risk === "protected");
    const redirects = found.filter((r) => r.risk === "redirect");

    // Sort: exposed → public → redirect → protected
    const order: Record<string, number> = { exposed: 0, public: 1, redirect: 2, protected: 3 };
    found.sort((a, b) => (order[a.risk] ?? 9) - (order[b.risk] ?? 9));

    // Build verdict
    let verdict = `Found ${found.length} endpoint${found.length !== 1 ? "s" : ""} on ${clean}`;
    if (protectedEps.length > 0) verdict += ` — ${protectedEps.length} properly secured`;
    if (publicEps.length > 0) verdict += `, ${publicEps.length} public`;
    if (critical.length > 0) verdict = `⚠️ ALERT: ${critical.length} sensitive endpoint${critical.length > 1 ? "s" : ""} publicly accessible on ${clean}. ${verdict}`;

    return NextResponse.json({
      success: true,
      domain: clean,
      totalProbed: PROBE_PATHS.length,
      endpointsFound: found.length,
      criticalFindings: critical.length,
      publicEndpoints: publicEps.length,
      protectedEndpoints: protectedEps.length,
      redirectEndpoints: redirects.length,
      verdict,
      endpoints: found,
    });
  } catch (error) {
    console.error("Discovery error:", error);
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}

/* ── PUT: Add endpoints to monitoring ── */
export async function PUT(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const { endpoints } = await request.json();
    if (!Array.isArray(endpoints)) return NextResponse.json({ error: "Array required" }, { status: 400 });

    let added = 0;
    for (const ep of endpoints) {
      try {
        await database.queryOne(
          `INSERT INTO apis (tenant_id, name, url, method, description, status, discovered_via, created_at)
           VALUES ($1, $2, $3, 'GET', $4, 'active', 'api_discovery', NOW()) RETURNING id`,
          [tenantId, ep.path, ep.fullUrl || `https://${ep.domain}${ep.path}`, `Discovered — ${ep.risk}`],
        );
        added++;
      } catch { /* duplicate */ }
    }
    return NextResponse.json({ success: true, added });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

/* ── Probe a single endpoint ── */
async function probe(base: string, path: string) {
  const url = `${base}${path}`;
  const start = Date.now();
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, {
      method: "GET", signal: ctrl.signal, redirect: "manual",
      headers: {
        "User-Agent": "GovernAPI-Scanner/1.0",
        "Accept": "application/json, text/html, */*",
      },
    });
    clearTimeout(t);

    const status = res.status;
    const ms = Date.now() - start;
    const ct = res.headers.get("content-type") || "";

    // Only hide true 404s
    if (status === 404) {
      debugLog(`  ${path.padEnd(40)} → ${status}  FILTERED (404)  ${ms}ms  ct=${ct}`);
      return { path, status, risk: "not_found" as const };
    }

    debugLog(`  ${path.padEnd(40)} → ${status}  INCLUDED  ${ms}ms  ct=${ct}`);

    const loc = res.headers.get("location") || "";
    const server = res.headers.get("server") || null;
    const poweredBy = res.headers.get("x-powered-by") || null;
    const framework = res.headers.get("x-framework") || null;
    const cl = res.headers.get("content-length");
    const size = cl ? parseInt(cl) : null;

    // Classify
    let risk: "exposed" | "public" | "protected" | "redirect";
    let findings: string[] = [];

    if (status === 401 || status === 403 || status === 429) {
      risk = "protected";
    } else if (status >= 300 && status < 400) {
      risk = "redirect";
    } else if (status === 405) {
      // Method Not Allowed = endpoint exists
      risk = "protected";
    } else if (DANGEROUS.has(path) && status >= 200 && status < 300) {
      risk = "exposed";
      // Check body for sensitive content
      try {
        const body = (await res.text()).substring(0, 2000);
        for (const c of SENSITIVE_PATTERNS) {
          if (c.pattern.test(body)) findings.push(c.label);
        }
        if (findings.length === 0 && body.length > 10) {
          // Still exposed — dangerous path with real content
        }
      } catch {}
    } else if (status >= 200 && status < 300) {
      risk = "public";
    } else {
      // 5xx, other — still a valid finding
      risk = "public";
    }

    const notable: string[] = [];
    if (server) notable.push(`Server: ${server}`);
    if (poweredBy) notable.push(`X-Powered-By: ${poweredBy}`);
    if (framework) notable.push(`X-Framework: ${framework}`);

    return {
      path, status, risk,
      responseTime: ms,
      contentType: ct.split(";")[0].trim() || null,
      size,
      server,
      notableHeaders: notable.length > 0 ? notable : undefined,
      findings: findings.length > 0 ? findings : undefined,
      redirectsTo: loc || undefined,
    };
  } catch (err: any) {
    debugLog(`  ${path.padEnd(40)} → ERROR  ${err?.name || "Unknown"}: ${err?.message?.substring(0, 50) || "timeout/connection"}`);
    return { path, status: 0, risk: "not_found" as const };
  }
}
