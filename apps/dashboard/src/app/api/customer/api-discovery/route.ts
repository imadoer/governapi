import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

const PROBE_PATHS = [
  "/api", "/api/v1", "/api/v2", "/api/v3", "/graphql", "/graphiql",
  "/swagger", "/swagger-ui", "/docs", "/api-docs", "/openapi.json", "/swagger.json",
  "/.env", "/.git", "/.git/config",
  "/admin", "/admin/api", "/console", "/dashboard", "/wp-admin", "/wp-json",
  "/health", "/healthz", "/metrics", "/prometheus", "/debug", "/status", "/info", "/config",
  "/actuator", "/actuator/health",
  "/robots.txt", "/sitemap.xml", "/server-info", "/server-status",
  "/phpinfo.php", "/test", "/staging", "/backup", "/db", "/database",
  "/login", "/register", "/auth", "/oauth", "/token",
  "/api/users", "/api/admin", "/api/config", "/api/debug", "/api/internal",
];

const DANGEROUS = new Set([
  "/.env", "/.git", "/.git/config", "/admin", "/admin/api", "/console",
  "/debug", "/config", "/phpinfo.php", "/server-info", "/server-status",
  "/actuator", "/metrics", "/prometheus", "/api/debug", "/api/internal",
  "/api/config", "/api/admin", "/graphiql", "/backup", "/db", "/database",
  "/staging", "/test", "/wp-admin",
]);

const SENSITIVE_PATTERNS = [
  { pattern: /DB_PASSWORD|DATABASE_URL|API_KEY|SECRET_KEY/i, label: "Credentials exposed" },
  { pattern: /\[core\]|bare\s*=|repositoryformatversion/i, label: "Git config exposed" },
  { pattern: /phpinfo\(\)/i, label: "PHP info exposed" },
];

/* POST — Run discovery scan */
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) return NextResponse.json({ error: "Auth required" }, { status: 401 });

  try {
    const { domain } = await request.json();
    if (!domain) return NextResponse.json({ error: "Domain required" }, { status: 400 });

    const clean = domain.replace(/^https?:\/\//, "").replace(/\/+$/, "");
    const base = `https://${clean}`;
    const results: any[] = [];

    // Probe in batches of 10
    for (let i = 0; i < PROBE_PATHS.length; i += 10) {
      const batch = PROBE_PATHS.slice(i, i + 10);
      const settled = await Promise.allSettled(batch.map((p) => probe(base, p)));
      for (const r of settled) {
        if (r.status === "fulfilled" && r.value && r.value.risk !== "not_found") {
          results.push(r.value);
        }
      }
    }

    // Sort: exposed first, then public, then authenticated
    const order: Record<string, number> = { exposed: 0, public: 1, authenticated: 2 };
    results.sort((a, b) => (order[a.risk] ?? 9) - (order[b.risk] ?? 9));

    return NextResponse.json({
      success: true,
      domain: clean,
      totalProbed: PROBE_PATHS.length,
      endpointsFound: results.length,
      criticalFindings: results.filter((r) => r.risk === "exposed").length,
      endpoints: results,
    });
  } catch (error) {
    console.error("Discovery error:", error);
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}

/* POST /add — Add endpoints to monitoring */
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
          [tenantId, `${ep.path}`, ep.fullUrl || `https://${ep.domain}${ep.path}`, `Discovered endpoint — ${ep.risk}`],
        );
        added++;
      } catch { /* duplicate or error */ }
    }

    return NextResponse.json({ success: true, added });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

async function probe(base: string, path: string) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(`${base}${path}`, {
      method: "GET", signal: ctrl.signal, redirect: "manual",
      headers: { "User-Agent": "GovernAPI-Scanner/1.0" },
    });
    clearTimeout(t);

    const status = res.status;
    if (status === 404 || status === 405 || status === 0) return { path, risk: "not_found" };

    const ct = res.headers.get("content-type") || "";
    const loc = res.headers.get("location") || "";
    const auth = status === 401 || status === 403 || (status >= 300 && status < 400 && /login|auth|signin/i.test(loc));

    let findings: string[] = [];
    if (DANGEROUS.has(path) && status === 200) {
      try {
        const body = (await res.text()).substring(0, 2000);
        for (const c of SENSITIVE_PATTERNS) {
          if (c.pattern.test(body)) findings.push(c.label);
        }
      } catch {}
    }

    const risk = auth ? "authenticated" : (DANGEROUS.has(path) && status === 200) || findings.length > 0 ? "exposed" : "public";

    return {
      path, status,
      contentType: ct.split(";")[0].trim() || null,
      requiresAuth: auth,
      risk,
      findings: findings.length > 0 ? findings : undefined,
      redirectsTo: loc || undefined,
    };
  } catch { return { path, risk: "not_found" as const }; }
}
