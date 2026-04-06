import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: "Only HTTP/HTTPS URLs are supported" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Check if user is logged in (Bearer token or cookie)
    const authHeader = request.headers.get("authorization");
    const sessionCookie = request.cookies.get("session_token")?.value;
    const isLoggedIn = !!(authHeader?.startsWith("Bearer ") || sessionCookie);

    // IP-based rate limit for anonymous users (1 scan per 30 days)
    if (!isLoggedIn) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || request.headers.get("x-real-ip")
        || request.headers.get("x-client-ip")
        || "unknown";

      try {
        const existing = await database.queryOne(
          `SELECT id FROM free_scans WHERE ip_address = $1 AND created_at > NOW() - INTERVAL '30 days' LIMIT 1`,
          [ip],
        );
        if (existing) {
          return NextResponse.json({
            error: "free_scan_limit",
            message: "You've used your free scan. Sign up for a free account to scan more APIs — no credit card required.",
          }, { status: 429 });
        }

        // Record this scan
        await database.query(
          `INSERT INTO free_scans (ip_address, url_scanned, created_at) VALUES ($1, $2, NOW())`,
          [ip, url],
        );
      } catch {
        // If DB fails, allow the scan (don't block on tracking errors)
      }
    }

    // Run the scan
    const isHttps = parsedUrl.protocol === "https:";
    const vulnerabilities: Array<{ title: string; severity: string; type: string }> = [];

    const start = Date.now();
    let headerScore = 0;
    const missingHeaders: string[] = [];
    let corsUnsafe = false;
    let serverExposed = false;
    let serverValue: string | null = null;
    let responseTime: number | null = null;
    let fetchError: string | null = null;
    let rateLimitDetected = false;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, { method: "HEAD", signal: controller.signal, redirect: "follow" });
      clearTimeout(timeout);
      responseTime = Date.now() - start;

      const h = res.headers;
      const checks = [
        { name: "strict-transport-security", label: "HSTS", weight: 25, vulnTitle: "HTTP Strict Transport Security Not Enabled", severity: "HIGH" },
        { name: "content-security-policy", label: "CSP", weight: 20, vulnTitle: "No Content Security Policy", severity: "MEDIUM" },
        { name: "x-frame-options", label: "X-Frame-Options", weight: 15, vulnTitle: "Clickjacking Protection Missing", severity: "MEDIUM" },
        { name: "x-content-type-options", label: "X-Content-Type-Options", weight: 15, vulnTitle: "MIME Sniffing Not Prevented", severity: "LOW" },
        { name: "referrer-policy", label: "Referrer-Policy", weight: 10, vulnTitle: "Missing Referrer Policy", severity: "LOW" },
        { name: "permissions-policy", label: "Permissions-Policy", weight: 10, vulnTitle: "Missing Permissions Policy", severity: "LOW" },
      ];

      for (const c of checks) {
        if (h.get(c.name)) {
          headerScore += c.weight;
        } else {
          missingHeaders.push(c.label);
          vulnerabilities.push({ title: c.vulnTitle, severity: c.severity, type: "missing_header" });
        }
      }

      // CORS check
      const corsOrigin = h.get("access-control-allow-origin");
      if (corsOrigin === "*") {
        corsUnsafe = true;
        vulnerabilities.push({ title: "Overly Permissive CORS Policy", severity: "HIGH", type: "cors" });
      }

      // Server info
      const server = h.get("server");
      const powered = h.get("x-powered-by");
      if (server || powered) {
        serverExposed = true;
        serverValue = server || powered || null;
        vulnerabilities.push({ title: "Server Version Disclosure", severity: "LOW", type: "info_disclosure" });
      }

      // Rate limiting
      const rlHeaders = ["x-ratelimit-limit", "ratelimit-limit", "retry-after"];
      rateLimitDetected = rlHeaders.some((rl) => h.get(rl));
      if (!rateLimitDetected) {
        vulnerabilities.push({ title: "No Rate Limiting Detected", severity: "MEDIUM", type: "missing_rate_limit" });
      }

      // HTTPS check
      if (!isHttps) {
        vulnerabilities.push({ title: "HTTP Instead of HTTPS", severity: "HIGH", type: "insecure_protocol" });
      }
    } catch (err: any) {
      responseTime = Date.now() - start;
      fetchError = err?.message || "Connection failed";
      vulnerabilities.push({ title: "Cannot Connect to Target", severity: "HIGH", type: "unreachable" });
    }

    // Calculate score
    let score = 0;
    if (isHttps) score += 25;
    score += Math.round((headerScore / 100) * 35);
    if (!corsUnsafe) score += 15;
    if (!serverExposed) score += 10;
    if (responseTime !== null && responseTime < 500) score += 15;
    else if (responseTime !== null && responseTime < 2000) score += 8;
    score = Math.min(100, score);

    return NextResponse.json({
      success: true,
      results: {
        overallScore: score,
        https: isHttps,
        securityHeaders: { score: headerScore, missing: missingHeaders },
        cors: { safe: !corsUnsafe },
        serverInfo: { exposed: serverExposed, value: serverValue },
        rateLimiting: { detected: rateLimitDetected },
        responseTime,
        fetchError,
        // Vulnerability names and severity only — no fix guides for anonymous users
        vulnerabilities: vulnerabilities.map((v) => ({ title: v.title, severity: v.severity })),
        vulnerabilityCount: vulnerabilities.length,
        // Severity breakdown
        critical: vulnerabilities.filter((v) => v.severity === "CRITICAL").length,
        high: vulnerabilities.filter((v) => v.severity === "HIGH").length,
        medium: vulnerabilities.filter((v) => v.severity === "MEDIUM").length,
        low: vulnerabilities.filter((v) => v.severity === "LOW").length,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Scan failed", details: err?.message }, { status: 500 });
  }
}
