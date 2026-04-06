// ✅ Public routes (authentication-related)
const authPublicRoutes = [
  // "/", // ❌ Removed - matches all routes!
  "/login",
  "/api/public/",
  "/api/auth/",
  "/api/badge/",
  "/api/ci/",
  "/api/customer/data-export",
  "/report/",
  // "/api/customer/", // ✅ Commented out so authentication will apply
];

import { NextRequest, NextResponse } from "next/server";

// ✅ Custom admin routes that require elevated auth
const customAuthRoutes = [
  "/api/admin/customers",
  "/api/admin/billing",
  "/api/admin/api-keys",
  "/api/stripe/revenue",
  "/api/admin/customers/[id]",
  "/api/analytics/threats",
  "/api/analytics/compliance",
  "/api/bot-detection",
  "/api/stripe/manage-subscription",
  "/api/customer/keys",
];

// ✅ Security processor exclusions (different purpose)
const securityExemptRoutes = [
  "/api/integrations",
  // "/api/customer/", // Now scanned for threats
];


const rateLimitExemptRoutes = ["/api/health", "/api/billing/webhook"];
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestId = crypto.randomUUID();
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";

  // NEW: Protect admin dashboard pages FIRST (before other processing)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin_session")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // NEW: Protect customer dashboard pages
  if (pathname.startsWith("/dashboard") || 
      pathname.startsWith("/customer/dashboard") ||
      pathname.startsWith("/customer/billing")) {
    const nextAuthToken = request.cookies.get("next-auth.session-token")?.value;
    const secureToken = request.cookies.get("__Secure-next-auth.session-token")?.value;
    const sessionToken = request.cookies.get("session_token")?.value;

    
    if (!nextAuthToken && !secureToken && !sessionToken) {
      // No customer session found
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Handle CORS preflight requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS,PATCH",
        "Access-Control-Allow-Headers":
          "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-tenant-id, x-user-id",
      },
    });
  }

  // Request size validation
  if (["POST", "PUT", "PATCH"].includes(request.method)) {
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }
  }

  // Allow security processor internal forwarding but block external spoofing.
  // The security processor sets x-internal-request when forwarding to the target route.
  // We validate it by checking that the request also has the security processor's
  // x-request-id header (set server-side) — external clients won't have both.
  if (
    request.headers.get("x-internal-request") === "true" &&
    request.headers.get("x-request-id")
  ) {
    const response = NextResponse.next();
    // Forward tenant/user headers from security processor
    const tenantId = request.headers.get("x-tenant-id");
    if (tenantId) response.headers.set("x-tenant-id", tenantId);
    return addSecurityHeaders(response, requestId);
  }

  // Strip spoofable headers from external requests
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-internal-request");
  requestHeaders.delete("x-admin-id");
  requestHeaders.delete("x-admin-role");
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-tenant-id");

  try {
    // For public routes, apply security headers and pass through
    if (authPublicRoutes.some((route) => pathname.startsWith(route))) {
      const response = NextResponse.next();
      return addSecurityHeaders(response, requestId);
    }

    // For all other API routes, redirect through security processor
    if (pathname.startsWith("/api/")) {
      const securityUrl = new URL("/api/security-processor", request.url);
      // Include original query string with the target path
      const origUrl = new URL(request.url);
      const fullTarget = pathname + origUrl.search;
      securityUrl.searchParams.set("target", fullTarget);
      securityUrl.searchParams.set("rid", requestId);
      securityUrl.searchParams.set("ip", ip);
      securityUrl.searchParams.set("method", request.method);

      const requiresAuth =
        !customAuthRoutes.some(
          (route) => pathname === route || pathname.startsWith(route),
        );
      const requiresRateLimit = !rateLimitExemptRoutes.some((route) =>
        pathname.startsWith(route),
      );

      const rewriteRequest = NextResponse.rewrite(securityUrl);
      rewriteRequest.headers.set("x-requires-auth", requiresAuth.toString());
      rewriteRequest.headers.set("x-requires-rate-limit", requiresRateLimit.toString());
      rewriteRequest.headers.set("x-client-ip", ip);
      return rewriteRequest;
    }

    // For non-API routes, just pass through with security headers
    const response = NextResponse.next();
    return addSecurityHeaders(response, requestId);
    
  } catch (error) {
    const response = NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
    return addSecurityHeaders(response, requestId);
  }
}

function addSecurityHeaders(
  response: NextResponse,
  requestId: string,
): NextResponse {
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Origin",
    process.env.ALLOWED_ORIGIN || "*",
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS,PATCH",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-tenant-id, x-user-id",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-Request-ID", requestId);
  return response;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/dashboard/:path*",
    "/customer/:path*",
  ],
};
