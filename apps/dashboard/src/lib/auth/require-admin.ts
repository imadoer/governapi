import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "./admin-auth";

/**
 * Validates admin_session cookie on an API request.
 * Returns the admin user on success, or a 401 NextResponse on failure.
 */
export async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get("admin_session")?.value;

  if (!token) {
    return NextResponse.json(
      { error: "Admin authentication required" },
      { status: 401 },
    );
  }

  const admin = await verifyAdminSession(token);

  if (!admin) {
    return NextResponse.json(
      { error: "Invalid or expired admin session" },
      { status: 401 },
    );
  }

  return admin;
}

/**
 * Type guard: returns true when requireAdmin returned a NextResponse (error).
 */
export function isAuthError(
  result: Awaited<ReturnType<typeof requireAdmin>>,
): result is NextResponse {
  return result instanceof NextResponse;
}
