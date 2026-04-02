import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../infrastructure/database";
import { logger } from "../../../../../utils/logging/logger";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const integrationId = id;

    await database.query(
      "DELETE FROM external_integrations WHERE id = $1 AND tenant_id = $2",
      [integrationId, tenantId],
    );

    logger.info("External integration deleted", { tenantId, integrationId });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Failed to delete integration", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    return NextResponse.json(
      { error: "Failed to delete integration" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const { id } = await params;
  try {
    const integrationId = id;
    const { integrationName, credentials, isActive } = await request.json();

    const integration = await database.queryOne(
      `UPDATE external_integrations 
       SET integration_name = COALESCE($1, integration_name),
           credentials = COALESCE($2, credentials),
           is_active = COALESCE($3, is_active),
           updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5
       RETURNING id, integration_type, integration_name, is_active`,
      [
        integrationName,
        credentials ? JSON.stringify(credentials) : null,
        isActive,
        integrationId,
        tenantId,
      ],
    );

    if (!integration) {
      return NextResponse.json(
        { error: "Integration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, integration });
  } catch (error) {
    logger.error("Failed to update integration", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    return NextResponse.json(
      { error: "Failed to update integration" },
      { status: 500 },
    );
  }
}
