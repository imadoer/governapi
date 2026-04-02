import { logger } from "../../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { UserAuthService } from "../../../../../services/auth/UserAuthService";

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get("session_token")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "No session found" },
        { status: 401 },
      );
    }

    // Use real session validation instead of mock data
    const sessionResult = await UserAuthService.validateSession(sessionToken);

    if (!sessionResult.success) {
      return NextResponse.json(
        { success: false, error: sessionResult.error || "Invalid session" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      user: sessionResult.user,
      company: sessionResult.company,
      sessionToken,
    });
  } catch (error) {
    logger.error("Session validation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Session validation failed" },
      { status: 500 },
    );
  }
}
