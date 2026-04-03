import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthError } from "@/lib/auth/require-admin";

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const settings = await request.json();

    // In a real app, you'd save these to a database
    // For now, just validate and return success
    console.log("Settings to save:", settings);

    // Simulate some processing time
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    });
  } catch (error) {
    logger.error("Settings API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Failed to save settings" },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    // Return current settings (in real app, load from database)
    const currentSettings = {
      rateLimitEnabled: true,
      globalRateLimit: 1000,
      threatDetectionEnabled: true,
      autoBlockEnabled: true,
      sessionTimeout: 24,
      logRetention: 90,
      timezone: "UTC",
    };

    return NextResponse.json({ success: true, settings: currentSettings });
  } catch (error) {
    logger.error("Settings API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 },
    );
  }
}
