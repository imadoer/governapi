import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Get tenant ID from middleware-injected headers
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;

    // Get violation only if it belongs to authenticated tenant
    const violation = await database.queryOne(
      "SELECT * FROM violations WHERE id = $1 AND tenant_id = $2",
      [id, tenantId],
    );

    if (!violation) {
      return NextResponse.json(
        { error: "Violation not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ violation });
  } catch (error) {
    logger.error("Violation fetch error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch violation" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Get tenant ID from middleware-injected headers
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // Whitelist allowed fields to prevent SQL injection
    const allowedFields = [
      "status",
      "severity",
      "notes",
      "resolved_by",
      "resolution_date",
    ];
    const updates = {};

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 },
      );
    }

    // Build safe parameterized query
    const setClause = Object.keys(updates)
      .map((key, index) => `${key} = $${index + 3}`)
      .join(", ");
    const values = [id, tenantId, ...Object.values(updates)];

    const violation = await database.queryOne(
      `UPDATE violations 
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2
       RETURNING *`,
      values,
    );

    if (!violation) {
      return NextResponse.json(
        { error: "Violation not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ violation });
  } catch (error) {
    logger.error("Violation update error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to update violation" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Get tenant ID from middleware-injected headers
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { id } = await params;

    // Delete violation only if it belongs to authenticated tenant
    const result = await database.queryOne(
      "DELETE FROM violations WHERE id = $1 AND tenant_id = $2 RETURNING id",
      [id, tenantId],
    );

    if (!result) {
      return NextResponse.json(
        { error: "Violation not found or unauthorized" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "Violation deleted" });
  } catch (error) {
    logger.error("Violation deletion error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to delete violation" },
      { status: 500 },
    );
  }
}
