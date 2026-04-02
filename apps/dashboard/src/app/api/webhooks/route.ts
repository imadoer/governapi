import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    // Get webhooks with optional status filter
    let query = `SELECT * FROM webhooks WHERE tenant_id = $1`;
    const params = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit.toString());

    const webhooks = await database.queryMany(query, params);

    // Get webhook statistics
    const stats = await database.queryOne(
      `SELECT 
         COUNT(*) as total_webhooks,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_webhooks,
         COUNT(CASE WHEN last_triggered IS NOT NULL THEN 1 END) as triggered_webhooks
       FROM webhooks WHERE tenant_id = $1`,
      [tenantId],
    );

    return NextResponse.json({
      success: true,
      webhooks: webhooks.map((webhook) => ({
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events:
          typeof webhook.events === "string"
            ? JSON.parse(webhook.events)
            : webhook.events,
        status: webhook.status,
        secret: webhook.secret,
        lastTriggered: webhook.last_triggered,
        successCount: webhook.success_count || 0,
        failureCount: webhook.failure_count || 0,
        createdAt: webhook.created_at,
      })),
      statistics: {
        total: parseInt(stats?.total_webhooks || "0"),
        active: parseInt(stats?.active_webhooks || "0"),
        triggered: parseInt(stats?.triggered_webhooks || "0"),
      },
    });
  } catch (error) {
    logger.error("Webhooks fetch error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { name, url, events, secret } = await request.json();

    if (!name || !url || !events || !Array.isArray(events)) {
      return NextResponse.json(
        { error: "Name, URL, and events array are required" },
        { status: 400 },
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook URL" },
        { status: 400 },
      );
    }

    // Validate events
    const validEvents = [
      "vulnerability_detected",
      "scan_completed",
      "threat_blocked",
      "compliance_failed",
    ];
    const invalidEvents = events.filter(
      (event: string) => !validEvents.includes(event),
    );
    if (invalidEvents.length > 0) {
      return NextResponse.json(
        { error: "Invalid events: " + invalidEvents.join(", ") },
        { status: 400 },
      );
    }

    // Generate webhook secret if not provided
    const webhookSecret = secret || generateWebhookSecret();

    const webhook = await database.queryOne(
      `INSERT INTO webhooks (tenant_id, name, url, events, secret, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [
        tenantId,
        name,
        url,
        JSON.stringify(events),
        webhookSecret,
        "active",
        userId || "system",
      ],
    );

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        name: webhook.name,
        url: webhook.url,
        events:
          typeof webhook.events === "string"
            ? JSON.parse(webhook.events)
            : webhook.events,
        secret: webhook.secret,
        status: webhook.status,
        createdAt: webhook.created_at,
      },
    });
  } catch (error) {
    logger.error("Webhook creation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 },
    );
  }
}

function generateWebhookSecret(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "whsec_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(
      crypto.getRandomValues(new Uint32Array(1))[0] % chars.length,
    );
  }
  return result;
}
