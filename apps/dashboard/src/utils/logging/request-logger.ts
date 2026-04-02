import { NextRequest } from "next/server";
import { logger } from "./logger";

export function logRequest(
  request: NextRequest,
  tenantId?: string,
  userId?: string,
) {
  const requestId = crypto.randomUUID();

  logger.apiRequest(request.method, request.nextUrl.pathname, {
    requestId,
    tenantId,
    userId,
    userAgent: request.headers.get("user-agent"),
    ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown" || request.headers.get("x-forwarded-for"),
    timestamp: new Date().toISOString(),
  });

  return requestId;
}

export function logResponse(
  requestId: string,
  status: number,
  duration: number,
  context?: any,
) {
  logger.info("API Response", {
    type: "api_response",
    requestId,
    status,
    duration: `${duration}ms`,
    ...context,
  });
}
