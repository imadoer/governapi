import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

// POST - Credential storage disabled until encryption is implemented
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: "Coming soon",
      message:
        "External integration credential storage is temporarily disabled while we implement end-to-end encryption. Use webhook-based integrations in the meantime.",
    },
    { status: 501 },
  );

  // TODO: Re-enable once field-level encryption is implemented for the
  // credentials column. The code below stores credentials as plaintext JSON
  // which is a data-breach liability.
  //
  // const tenantId = request.headers.get("x-tenant-id");
  // if (!tenantId) {
  //   return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  // }
  // const { integrationType, integrationName, credentials } = await request.json();
  // if (!integrationType || !integrationName || !credentials) {
  //   return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  // }
  // const integration = await database.queryOne(
  //   `INSERT INTO external_integrations (tenant_id, integration_type, integration_name, credentials, created_at)
  //    VALUES ($1, $2, $3, $4, NOW()) RETURNING id, integration_type, integration_name, is_active, created_at`,
  //   [tenantId, integrationType, integrationName, JSON.stringify(credentials)],
  // );
  // return NextResponse.json({ success: true, integration });
}

// GET - List integrations (without exposing credentials)
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const integrations = await database.queryMany(
      `SELECT id, integration_type, integration_name, is_active, last_used, created_at
       FROM external_integrations
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId],
    );

    const formattedIntegrations = integrations.map((integration) => ({
      id: integration.id,
      type: integration.integration_type,
      name: integration.integration_name,
      isActive: integration.is_active,
      lastUsed: integration.last_used,
      createdAt: integration.created_at,
    }));

    return NextResponse.json({
      success: true,
      integrations: formattedIntegrations,
    });
  } catch (error) {
    logger.error("Failed to fetch integrations", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    return NextResponse.json(
      { error: "Failed to fetch integrations" },
      { status: 500 },
    );
  }
}
