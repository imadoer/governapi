import { NextRequest, NextResponse } from "next/server";
import { APIKeyService } from "@/services/api-key-service";
import { logger } from "@/utils/logging/logger";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const apiKeys = await APIKeyService.listAPIKeys(tenantId);

    return NextResponse.json({
      success: true,
      apiKeys: apiKeys.map((key) => ({
        id: key.id,
        name: key.name,
        keyPrefix: key.keyPrefix,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        ipWhitelist: key.ipWhitelist,
        expiresAt: key.expiresAt,
        isActive: key.isActive,
        lastUsed: key.lastUsed,
        usageCount: key.usageCount,
        createdAt: key.createdAt,
      })),
    });
  } catch (error) {
    logger.error("API keys fetch error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch API keys" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { name, permissions, rateLimit, ipWhitelist, expiresInDays } =
      await request.json();

    if (!name || !permissions || !Array.isArray(permissions)) {
      return NextResponse.json(
        { error: "Name and permissions array are required" },
        { status: 400 },
      );
    }

    // Validate permissions
    const validPermissions = ["read", "write", "admin", "scan", "monitor"];
    const invalidPerms = permissions.filter(
      (p) => !validPermissions.includes(p),
    );
    if (invalidPerms.length > 0) {
      return NextResponse.json(
        {
          error: `Invalid permissions: ${invalidPerms.join(", ")}. Valid: ${validPermissions.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate IP whitelist format
    if (ipWhitelist && Array.isArray(ipWhitelist)) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/\d{1,2})?$/;
      const invalidIPs = ipWhitelist.filter((ip) => !ipRegex.test(ip));
      if (invalidIPs.length > 0) {
        return NextResponse.json(
          {
            error: `Invalid IP addresses: ${invalidIPs.join(", ")}`,
          },
          { status: 400 },
        );
      }
    }

    const apiKey = await APIKeyService.generateAPIKey(
      tenantId,
      {
        name,
        permissions,
        rateLimit,
        ipWhitelist,
        expiresInDays,
      },
      userId,
    );

    logger.info("API key created", {
      tenantId,
      userId,
      keyName: name,
      permissions,
    });

    return NextResponse.json({
      success: true,
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        key: apiKey.fullKey, // Only shown once on creation
        keyPrefix: apiKey.keyPrefix,
        permissions: apiKey.permissions,
        rateLimit: apiKey.rateLimit,
        ipWhitelist: apiKey.ipWhitelist,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      message:
        "API key created successfully. Save this key securely - it will not be shown again.",
    });
  } catch (error) {
    logger.error("API key creation error", {
      tenantId,
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}
