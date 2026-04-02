import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../../infrastructure/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: "Tenant ID required" },
      { status: 401 }
    );
  }

  try {
    const { status } = await request.json();
    const resolvedParams = await params;
    const vulnerabilityId = resolvedParams.id;

    await database.queryOne(
      `UPDATE vulnerabilities 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND tenant_id = $3`,
      [status, vulnerabilityId, tenantId]
    );

    return NextResponse.json({
      success: true,
      message: "Vulnerability status updated",
    });
  } catch (error) {
    console.error("Error updating vulnerability status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update status" },
      { status: 500 }
    );
  }
}
