import { NextRequest, NextResponse } from "next/server";

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

    const isHttps = parsedUrl.protocol === "https:";
    const results: Record<string, any> = {
      https: isHttps,
      securityHeaders: { score: 0, missing: [] as string[] },
      cors: { safe: true },
      serverInfo: { exposed: false, value: null },
      responseTime: null,
      overallScore: 0,
    };

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);

      results.responseTime = Date.now() - start;

      const h = res.headers;
      let headerScore = 0;
      const checked = [
        { name: "strict-transport-security", weight: 25 },
        { name: "content-security-policy", weight: 20 },
        { name: "x-frame-options", weight: 15 },
        { name: "x-content-type-options", weight: 15 },
        { name: "referrer-policy", weight: 10 },
        { name: "permissions-policy", weight: 10 },
        { name: "x-xss-protection", weight: 5 },
      ];
      for (const c of checked) {
        if (h.get(c.name)) {
          headerScore += c.weight;
        } else {
          results.securityHeaders.missing.push(c.name);
        }
      }
      results.securityHeaders.score = headerScore;

      const corsOrigin = h.get("access-control-allow-origin");
      results.cors = { safe: corsOrigin !== "*", value: corsOrigin };

      const server = h.get("server");
      const powered = h.get("x-powered-by");
      results.serverInfo = {
        exposed: !!(server || powered),
        value: server || powered || null,
      };
    } catch (fetchErr: any) {
      results.responseTime = Date.now() - start;
      results.fetchError = fetchErr?.message || "Connection failed";
    }

    // Calculate overall score
    let score = 0;
    if (results.https) score += 25;
    score += Math.round((results.securityHeaders.score / 100) * 35);
    if (results.cors.safe) score += 15;
    if (!results.serverInfo.exposed) score += 10;
    if (results.responseTime !== null && results.responseTime < 500) score += 15;
    else if (results.responseTime !== null && results.responseTime < 2000) score += 8;
    results.overallScore = Math.min(100, score);

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Scan failed", details: err?.message },
      { status: 500 },
    );
  }
}
