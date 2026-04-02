import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

interface AlertConfig {
  email: string;
  severity_threshold: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  enabled: boolean;
}

export async function POST(req: NextRequest) {
  // Get tenant ID from middleware-injected headers
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { email, severity_threshold = "HIGH" } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    // Check if config exists for this tenant
    const existing = await database.queryOne(
      "SELECT id FROM alert_configurations WHERE tenant_id = $1 AND email = $2",
      [tenantId, email],
    );

    if (existing) {
      // Update existing config
      await database.query(
        `UPDATE alert_configurations 
         SET severity_threshold = $1, enabled = $2, updated_at = NOW()
         WHERE id = $3`,
        [severity_threshold, true, existing.id],
      );
    } else {
      // Create new config
      await database.query(
        `INSERT INTO alert_configurations (
          tenant_id, email, severity_threshold, enabled,
          alert_on_critical, alert_on_high, alert_on_medium, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          tenantId,
          email,
          severity_threshold,
          true,
          severity_threshold === "CRITICAL",
          ["CRITICAL", "HIGH"].includes(severity_threshold),
          ["CRITICAL", "HIGH", "MEDIUM"].includes(severity_threshold),
        ],
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alert configuration saved",
    });
  } catch (error: any) {
    logger.error("Alert config POST error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to save alert configuration",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  // Get tenant ID from middleware-injected headers
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const configs = await database.queryMany(
      "SELECT * FROM alert_configurations WHERE tenant_id = $1 ORDER BY created_at DESC",
      [tenantId],
    );

    return NextResponse.json({
      success: true,
      configs: configs || [],
    });
  } catch (error: any) {
    logger.error("Alert config GET error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to retrieve alert configurations",
        details: error.message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  // Get tenant ID from middleware-injected headers
  const tenantId = req.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Delete config only for authenticated tenant
    const result = await database.queryOne(
      "DELETE FROM alert_configurations WHERE tenant_id = $1 AND email = $2 RETURNING id",
      [tenantId, email],
    );

    if (!result) {
      return NextResponse.json(
        { error: "Alert configuration not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alert configuration deleted",
    });
  } catch (error: any) {
    logger.error("Alert config DELETE error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to delete alert configuration",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
