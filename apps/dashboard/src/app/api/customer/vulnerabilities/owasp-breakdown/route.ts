import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: "Tenant ID required" },
      { status: 401 }
    );
  }

  try {
    // Use vulnerability_type instead of owasp_category
    const categories = await database.queryMany(
      `SELECT 
        vulnerability_type as category,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical,
        COUNT(*) FILTER (WHERE severity = 'high') as high,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium,
        COUNT(*) FILTER (WHERE severity = 'low') as low
      FROM vulnerabilities
      WHERE tenant_id = $1 AND status = 'open'
      GROUP BY vulnerability_type
      ORDER BY count DESC
      LIMIT 10`,
      [tenantId]
    );

    const breakdown = categories.map((cat: any) => ({
      category: cat.category,
      count: parseInt(cat.count),
      critical: parseInt(cat.critical || "0"),
      high: parseInt(cat.high || "0"),
      medium: parseInt(cat.medium || "0"),
      low: parseInt(cat.low || "0"),
    }));

    return NextResponse.json({
      success: true,
      breakdown,
    });
  } catch (error) {
    console.error("Error fetching vulnerability breakdown:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch breakdown" },
      { status: 500 }
    );
  }
}
