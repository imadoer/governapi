import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const limit = request.nextUrl.searchParams.get("limit") || "10";

    try {
      const logs = await database.query(
        `SELECT 
          id::text,
          ip_address::text,
          action,
          COALESCE(performed_by, 'System') as user,
          created_at as timestamp,
          reason as details
         FROM ip_block_audit
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [tenantId, parseInt(limit)]
      );

      return NextResponse.json({
        success: true,
        logs: logs.rows,
      });
    } catch (dbError) {
      console.log("Audit table not found, returning empty logs");
      return NextResponse.json({
        success: true,
        logs: [],
      });
    }
  } catch (error: any) {
    console.error("Audit log error:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
