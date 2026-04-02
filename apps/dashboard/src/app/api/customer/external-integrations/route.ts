import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { integrationType, integrationName, credentials } =
      await request.json();

    // Validate required fields
    if (!integrationType || !integrationName || !credentials) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Store credentials (TODO: Add encryption in production)
    const integration = await database.queryOne(
      `INSERT INTO external_integrations (tenant_id, integration_type, integration_name, credentials, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, integration_type, integration_name, is_active, created_at`,
      [tenantId, integrationType, integrationName, JSON.stringify(credentials)],
    );

    logger.info("External integration created", {
      tenantId,
      integrationType,
      integrationName,
      integrationId: integration.id,
    });

    return NextResponse.json({
      success: true,
      integration: {
        id: integration.id,
        type: integration.integration_type,
        name: integration.integration_name,
        isActive: integration.is_active,
        createdAt: integration.created_at,
      },
    });
  } catch (error) {
    logger.error("External integration creation failed", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    return NextResponse.json(
      { error: "Failed to add integration" },
      { status: 500 },
    );
  }
}

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
      `SELECT id, integration_type, integration_name, credentials, is_active, last_used, created_at 
       FROM external_integrations 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [tenantId],
    );

    const formattedIntegrations = integrations.map((integration) => ({
      id: integration.id,
      type: integration.integration_type,
      name: integration.integration_name,
      credentials: typeof integration.credentials === 'string' 
        ? JSON.parse(integration.credentials) 
        : integration.credentials || {},
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
