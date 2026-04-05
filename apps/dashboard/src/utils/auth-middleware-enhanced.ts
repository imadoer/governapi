import { NextRequest, NextResponse } from "next/server";
import { APIKeyService } from "../services/api-key-service";
import { UserAuthService } from "../services/auth/UserAuthService";

export async function validateApiRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  // Fall back to session cookie if no Authorization header
  const sessionCookie = request.cookies.get("session_token")?.value
    || request.cookies.get("next-auth.session-token")?.value
    || request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!authHeader && !sessionCookie) {
    return {
      valid: false,
      response: NextResponse.json(
        { error: "Missing authorization" },
        { status: 401 },
      ),
    };
  }

  // Check if it's an API key (starts with 'gapi_' or 'gov_live_')
  if (authHeader?.startsWith("Bearer gapi_") || authHeader?.startsWith("Bearer gov_live_")) {
    // API Key authentication
    const apiKey = authHeader.substring(7); // Remove 'Bearer '
    const validation = await APIKeyService.validateAPIKey(apiKey);

    if (!validation.valid) {
      return {
        valid: false,
        response: NextResponse.json(
          { error: "Invalid API key" },
          { status: 401 },
        ),
      };
    }

    // Check IP whitelist if configured
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown" || request.headers.get("x-forwarded-for");
    if (
      validation.keyInfo?.ipWhitelist &&
      validation.keyInfo.ipWhitelist.length > 0
    ) {
      const isWhitelisted = validation.keyInfo.ipWhitelist.some(
        (ip: string) => {
          return clientIP === ip || clientIP?.startsWith(ip.split("/")[0]);
        },
      );

      if (!isWhitelisted) {
        return {
          valid: false,
          response: NextResponse.json(
            { error: "IP not whitelisted for this API key" },
            { status: 403 },
          ),
        };
      }
    }

    return {
      valid: true,
      tenantId: validation.tenantId,
      authType: "api_key",
      keyInfo: validation.keyInfo,
    };
  }

  // Session token from Authorization header or cookie
  const sessionToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : sessionCookie;
  if (sessionToken) {
    const authResult = await UserAuthService.validateSession(sessionToken);

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
      authType: "session",
    };
  }

  return {
    valid: false,
    response: NextResponse.json(
      { error: "Invalid authorization format" },
      { status: 401 },
    ),
  };
}
