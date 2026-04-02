import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Token is required" },
        { status: 400 }
      );
    }

    // Check if token exists and is valid
    const resetToken = await database.queryOne(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW() AND used = false`,
      [token]
    );

    if (!resetToken) {
      return NextResponse.json({
        valid: false,
        error: "Invalid or expired reset link",
      });
    }

    return NextResponse.json({
      valid: true,
    });
  } catch (error) {
    console.error("Validate token error:", error);
    return NextResponse.json(
      { valid: false, error: "Failed to validate token" },
      { status: 500 }
    );
  }
}
