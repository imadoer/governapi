import { logger } from "../../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { UserAuthService } from "../../../../../services/auth/UserAuthService";

// In-memory rate limiter: max 5 login attempts per IP per 15 minutes
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; retryAfterSecs: number } {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_ATTEMPTS - 1, retryAfterSecs: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSecs: retryAfter };
  }

  entry.count++;
  return { allowed: true, remaining: MAX_ATTEMPTS - entry.count, retryAfterSecs: 0 };
}

// Clean up stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if (now > entry.resetAt) loginAttempts.delete(ip);
  }
}, 10 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || request.headers.get("x-client-ip")
      || "unknown";

    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      const res = NextResponse.json(
        { error: `Too many login attempts. Try again in ${Math.ceil(rateLimit.retryAfterSecs / 60)} minutes.` },
        { status: 429 },
      );
      res.headers.set("Retry-After", String(rateLimit.retryAfterSecs));
      return res;
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const loginResult = await UserAuthService.login(email, password);

    if (!loginResult.success) {
      return NextResponse.json(
        { error: loginResult.error || "Invalid credentials" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      user: loginResult.user,
      company: loginResult.company,
      sessionToken: loginResult.sessionToken,
    });

    if (loginResult.sessionToken) {
      response.cookies.set("session_token", loginResult.sessionToken, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
      });
    }

    return response;
  } catch (error) {
    logger.error("Login error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
