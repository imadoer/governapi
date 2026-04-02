import { NextResponse } from "next/server";
import { SecurityValidator } from "../../../../utils/security-validator";

export async function GET() {
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
