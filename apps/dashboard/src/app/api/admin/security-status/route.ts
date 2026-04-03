import { NextRequest, NextResponse } from "next/server";
import { SecurityValidator } from "../../../../utils/security-validator";
import { requireAdmin, isAuthError } from "@/lib/auth/require-admin";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const checks = await SecurityValidator.validateSecurityConfiguration();
    const critical = checks.filter((c) => c.severity === "critical").length;
    const high = checks.filter((c) => c.severity === "high").length;

    const securityScore = Math.max(0, 100 - critical * 40 - high * 20);

    return NextResponse.json({
      success: true,
      securityScore,
      checks,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Security check failed" },
      { status: 500 },
    );
  }
}
