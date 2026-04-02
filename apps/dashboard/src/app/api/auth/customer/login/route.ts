import { logger } from "../../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { UserAuthService } from "../../../../../services/auth/UserAuthService";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    console.log("Login attempt:", { email });

    // Use the real UserAuthService for consistent authentication
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

    // Set session cookie
    if (loginResult.sessionToken) {
      response.cookies.set("session_token", loginResult.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
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
