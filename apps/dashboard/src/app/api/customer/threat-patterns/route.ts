import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    // Get global threat patterns (available to all customers)
    const patterns = await database.queryMany(
      `SELECT 
         id, pattern_name, pattern_type, severity, is_active, created_at
       FROM threat_patterns 
       WHERE is_active = true
       ORDER BY severity DESC, pattern_name`,
    );

    return NextResponse.json({
      success: true,
      threatPatterns: patterns.map((pattern) => ({
        id: pattern.id,
        name: pattern.pattern_name,
        type: pattern.pattern_type,
        severity: pattern.severity,
        isActive: pattern.is_active,
        createdAt: pattern.created_at,
      })),
    });
  } catch (error) {
    logger.error("Threat patterns API error", {
      tenantId,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch threat patterns" },
      { status: 500 },
    );
  }
}
