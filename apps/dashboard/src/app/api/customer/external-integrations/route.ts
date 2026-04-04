import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

// Webhook-only integration types (outbound URLs only, no stored credentials)
const WEBHOOK_TYPES = ["slack", "pagerduty", "webhook"];

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const integrationType = body.type || body.integrationType;
    const integrationName = body.name || body.integrationName;
    const credentials = body.credentials || {};

    if (!integrationType || !integrationName) {
      return NextResponse.json({ error: "Type and name are required" }, { status: 400 });
    }

    // Only allow webhook-based integrations (outbound URLs)
    if (!WEBHOOK_TYPES.includes(integrationType)) {
      return NextResponse.json(
        { error: "Coming soon", message: `${integrationType} integration requires OAuth and is not yet available.` },
        { status: 501 },
      );
    }

    // Validate webhook URL is present
    const webhookUrl = credentials.webhook_url || credentials.integration_key;
    if (!webhookUrl) {
      return NextResponse.json({ error: "Webhook URL or integration key is required" }, { status: 400 });
    }

    const integration = await database.queryOne(
      `INSERT INTO external_integrations (tenant_id, integration_type, integration_name, credentials, is_active, created_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       RETURNING id, integration_type, integration_name, is_active, created_at`,
      [tenantId, integrationType, integrationName, JSON.stringify(credentials)],
    );

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
    logger.error("Failed to create integration", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "Failed to create integration" }, { status: 500 });
  }
}

// DELETE - Remove integration
export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }
  try {
    const { id } = await request.json();
    await database.query(
      `DELETE FROM external_integrations WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId],
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
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
