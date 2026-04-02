import { NextRequest, NextResponse } from "next/server";
import { APIKeyService } from "@/services/api-key-service";
import { logger } from "@/utils/logging/logger";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  const { keyId } = await params;
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { reason } = await request.json();

    const newApiKey = await APIKeyService.rotateAPIKey(
      keyId,
      parseInt(tenantId),
      reason || "Manual rotation",
      userId
    );

    logger.info("API key rotated", {
      tenantId,
      userId,
      oldKeyId: keyId,
      newKeyId: newApiKey.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: newApiKey.id,
        name: newApiKey.name,
        key: newApiKey.fullKey, // Only shown once on rotation
        keyPrefix: newApiKey.keyPrefix,
        permissions: newApiKey.permissions,
        rateLimit: newApiKey.rateLimit,
        ipWhitelist: newApiKey.ipWhitelist,
        expiresAt: newApiKey.expiresAt,
        createdAt: newApiKey.createdAt,
      },
      message:
        "API key rotated successfully. Save the new key securely - it will not be shown again.",
    });
  } catch (error) {
    logger.error("API key rotation error", {
      tenantId,
      userId,
      keyId: keyId,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Failed to rotate API key" },
      { status: 500 }
    );
  }
}
