import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import * as bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Verify token is valid
    const resetToken = await database.queryOne(
      `SELECT * FROM password_reset_tokens 
       WHERE token = $1 AND expires_at > NOW() AND used = false`,
      [token]
    );

    if (!resetToken) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    // Update user's password
    await database.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [passwordHash, resetToken.user_id]
    );

    // Mark token as used
    await database.query(
      "UPDATE password_reset_tokens SET used = true WHERE token = $1",
      [token]
    );

    // Invalidate all existing sessions for this user (force re-login)
    await database.query(
      "DELETE FROM user_sessions WHERE user_id = $1",
      [resetToken.user_id]
    );

    return NextResponse.json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
