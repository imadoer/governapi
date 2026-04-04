import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await database.queryOne(
      "SELECT id, email, first_name FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an account exists, a reset link has been sent",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in database
    await database.query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at, used, created_at)
       VALUES ($1, $2, $3, false, NOW())`,
      [user.id, resetToken, expiresAt.toISOString()]
    );

    // Send email
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "GovernAPI <noreply@governapi.com>",
      to: user.email,
      subject: "Reset Your GovernAPI Password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #06b6d4 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔒 GovernAPI</h1>
            </div>
            <div class="content">
              <h2>Reset Your Password</h2>
              <p>Hi ${user.first_name},</p>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #06b6d4;">${resetLink}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, you can safely ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} GovernAPI. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "If an account exists, a reset link has been sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process request" },
      { status: 500 }
    );
  }
}
