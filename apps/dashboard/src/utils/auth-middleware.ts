import { NextRequest, NextResponse } from "next/server";
import { UserAuthService } from "../services/auth/UserAuthService";

export async function validateApiRequest(request: NextRequest) {
  // Try Authorization header first
  const authHeader = request.headers.get("authorization");
  let sessionToken = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    sessionToken = authHeader.substring(7);
  } else {
    // Fall back to cookies
    sessionToken = request.cookies.get("session_token")?.value ||
                   request.cookies.get("next-auth.session-token")?.value ||
                   request.cookies.get("__Secure-next-auth.session-token")?.value;
  }

  if (!sessionToken) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 },
      ),
    };
  }

  const authResult = await UserAuthService.validateSession(sessionToken);
  console.log("Auth validation result:", authResult);

  if (!authResult.success) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      ),
    };
  }

  return {
    valid: true,
    user: authResult.user,
    company: authResult.company,
    tenantId: authResult.company?.id,
  };
}
