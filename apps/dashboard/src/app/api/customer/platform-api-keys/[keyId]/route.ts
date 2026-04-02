import { NextRequest, NextResponse } from "next/server";
import { APIKeyService } from "@/services/api-key-service";
import { logger } from "@/utils/logging/logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> },
) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { keyId } = await params;
  try {
    await APIKeyService.revokeAPIKey(keyId, parseInt(tenantId));

    logger.info("API key revoked", {
      tenantId,
      userId,
      keyId: keyId,
    });

    return NextResponse.json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (error) {
    logger.error("API key revocation error", {
      tenantId,
      userId,
      keyId: keyId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to revoke API key" },
      { status: 500 },
    );
  }
}
