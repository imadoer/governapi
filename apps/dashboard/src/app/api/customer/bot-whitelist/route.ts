import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";
import { logger } from "../../../../utils/logging/logger";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const whitelist = await database.queryMany(
      `SELECT id, bot_name, category, user_agent_pattern, enabled, created_at
       FROM bot_whitelist
       WHERE tenant_id = $1
       ORDER BY category, bot_name`,
      [tenantId]
    );

    return NextResponse.json({
      success: true,
      whitelist: whitelist || [],
    });
  } catch (error: any) {
    logger.error("Bot whitelist fetch error:", { error: error.message });
    return NextResponse.json({ error: "Failed to fetch whitelist" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { action, id, botName, userAgentPattern, category } = await request.json();

    if (action === "add") {
      await database.query(
        `INSERT INTO bot_whitelist (tenant_id, bot_name, user_agent_pattern, category, enabled)
         VALUES ($1, $2, $3, $4, true)`,
        [tenantId, botName, userAgentPattern, category || "Custom"]
      );
      
      return NextResponse.json({
        success: true,
        message: `${botName} added to whitelist`,
      });
    }

    if (action === "remove") {
      await database.query(
        `DELETE FROM bot_whitelist WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      
      return NextResponse.json({
        success: true,
        message: "Bot removed from whitelist",
      });
    }

    if (action === "toggle") {
      await database.query(
        `UPDATE bot_whitelist SET enabled = NOT enabled WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      
      return NextResponse.json({
        success: true,
        message: "Bot whitelist status updated",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    logger.error("Bot whitelist update error:", { error: error.message });
    return NextResponse.json({ error: "Failed to update whitelist" }, { status: 500 });
  }
}
