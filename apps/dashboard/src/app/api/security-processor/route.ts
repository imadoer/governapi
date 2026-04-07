import { NextRequest, NextResponse } from "next/server";
import { validateApiRequest } from "../../../utils/auth-middleware-enhanced";
import { logger } from "../../../utils/logging/logger";
import { checkRateLimit, logRequest } from "../../../utils/rate-limiting";
import { isIPBlocked, blockIP } from "../../../utils/ip-blocking";
import { validateStripeSignature } from "../../../utils/webhook-validation";
import { ENV } from "../../../utils/env-validation";

export async function GET(request: NextRequest) {
  return processRequest(request);
}

export async function POST(request: NextRequest) {
  return processRequest(request);
}

export async function PUT(request: NextRequest) {
  return processRequest(request);
}

export async function DELETE(request: NextRequest) {
  return processRequest(request);
}

async function processRequest(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetPath = searchParams.get("target") || request.nextUrl.pathname;
  const targetQuery = searchParams.get("targetQuery") || "";
  const target = targetPath + targetQuery;
  const requiresAuth = request.headers.get("x-requires-auth") === "true";
  const requiresRateLimit = request.headers.get("x-requires-rate-limit") === "true";
  const requestId = searchParams.get("rid") || crypto.randomUUID();
  const ip = request.headers.get("x-client-ip") || "127.0.0.1";

  try {
    // IP blocking check
    if (requiresAuth) {
      const blocked = await isIPBlocked(1, ip);
      if (blocked) {
        logger.securityEvent("Blocked IP attempted access", { target, ip });
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const authHeaders: Record<string, string> = {};

    // Authentication validation
    if (requiresAuth) {
      const authCheck = await validateApiRequest(request);
      if (!authCheck.valid) {
        logger.securityEvent("Authentication failed", { target, ip });
        return authCheck.response;
      }

      if (authCheck.tenantId) authHeaders["x-tenant-id"] = authCheck.tenantId.toString();
      if (authCheck.user?.id) authHeaders["x-user-id"] = authCheck.user.id.toString();

      // Rate limiting
      if (requiresRateLimit && authCheck.tenantId) {
        const rateLimit = await checkRateLimit(authCheck.company?.apiKey || "", ip);
        if (!rateLimit.allowed) {
          logger.securityEvent("Rate limit exceeded", { target, ip });
          return NextResponse.json(
            {
              error: "Rate limit exceeded",
              resetTime: rateLimit.resetTime,
            },
            { status: 429 },
          );
        }
        await logRequest(authCheck.company?.apiKey || "", ip, target, request.method);
      }

      // Threat detection
      const threatResult = await AdvancedThreatDetector.detectThreats({
        tenantId: authCheck.tenantId?.toString() || "unknown",
        sourceIp: ip,
        requestPath: target,
        method: request.method,
        userAgent: request.headers.get("user-agent") || undefined,
        headers: Object.fromEntries(request.headers.entries()),
      });

      if (threatResult.shouldBlock) {
        logger.warn("Threat blocked", {
          ip,
          path: target,
          riskScore: threatResult.riskScore,
          pattern: threatResult.patternMatched,
        });
        return NextResponse.json(
          { error: "Request blocked due to security threat" },
          { status: 403 }
        );
      }
    }

    // Forward authenticated request to target route (target includes query string)
    const targetUrl = `http://localhost:3000${target}`;
    // Read body if present
    let bodyContent: string | undefined;
    if (["POST", "PUT", "PATCH"].includes(request.method)) {
      try {
        bodyContent = await request.text();
      } catch (e) {
        bodyContent = undefined;
      }
    }

    // Extract query params from target to pass as headers (Next.js internal fetch loses query strings)
    const queryStart = target.indexOf('?');
    const targetQueryString = queryStart >= 0 ? target.substring(queryStart + 1) : '';

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        "x-internal-request": "true",
        authorization: request.headers.get("authorization") || "",
        "content-type":
          request.headers.get("content-type") || "application/json",
        "x-request-id": requestId,
        "x-original-url": target,
        "x-original-query": targetQueryString,
        ...authHeaders,
      },
      body: bodyContent,
    });

    const data = await response.text();
    logger.apiRequest(request.method, target, { requestId, ip });

    const respHeaders: Record<string, string> = {
      "x-internal-request": "true",
      "content-type": response.headers.get("content-type") || "application/json",
      "x-request-id": requestId,
    };
    const disposition = response.headers.get("content-disposition");
    if (disposition) respHeaders["content-disposition"] = disposition;

    return new NextResponse(data, { status: response.status, headers: respHeaders });
  } catch (error) {
    logger.error("Security processor error", {
      requestId,
      target,
      ip,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// Import at top if not already there
import { AdvancedThreatDetector } from "../../../services/advanced-threat-detector";
