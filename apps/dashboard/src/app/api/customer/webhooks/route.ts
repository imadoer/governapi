import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

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
    const { name, url, events, webhookType } = await request.json();

    if (!name || !url || !events) {
      return NextResponse.json(
        { error: "Name, URL, and events are required" },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid webhook URL format" },
        { status: 400 },
      );
    }

    // Create webhook with proper error handling
    const webhook = await database.queryOne(
      `INSERT INTO webhooks (tenant_id, name, url, events, type, enabled, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [
        tenantId,
        name,
        url,
        JSON.stringify(events),
        webhookType || "generic",
        true,
        userId || "system",
      ],
    );

    if (!webhook) {
      return NextResponse.json(
        { error: "Failed to create webhook" },
        { status: 500 },
      );
    }

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
        type: webhook.type,
        enabled: webhook.enabled,
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

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    // Get all webhooks for the tenant
    const webhooks = await database.queryMany(
      `SELECT w.*, 
              COUNT(wd.id) as delivery_count,
              COUNT(CASE WHEN wd.status = 'success' THEN 1 END) as success_count,
              COUNT(CASE WHEN wd.status = 'failed' THEN 1 END) as failure_count,
              MAX(wd.created_at) as last_delivery
       FROM webhooks w
       LEFT JOIN webhook_deliveries wd ON w.id = wd.webhook_id
       WHERE w.tenant_id = $1
       GROUP BY w.id
       ORDER BY w.created_at DESC`,
      [tenantId],
    );

    // Get recent webhook deliveries
    const recentDeliveries = await database.queryMany(
      `SELECT wd.*, w.name as webhook_name
       FROM webhook_deliveries wd
       JOIN webhooks w ON wd.webhook_id = w.id
       WHERE w.tenant_id = $1
       ORDER BY wd.created_at DESC
       LIMIT 10`,
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
        type: webhook.type,
        enabled: webhook.enabled,
        deliveryCount: parseInt(webhook.delivery_count || "0"),
        successCount: parseInt(webhook.success_count || "0"),
        failureCount: parseInt(webhook.failure_count || "0"),
        lastDelivery: webhook.last_delivery,
        createdAt: webhook.created_at,
      })),
      recentDeliveries: recentDeliveries.map((delivery) => ({
        id: delivery.id,
        webhookName: delivery.webhook_name,
        event: delivery.event,
        status: delivery.status,
        responseCode: delivery.response_code,
        createdAt: delivery.created_at,
      })),
    });
  } catch (error) {
    logger.error("Webhook fetch error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 },
    );
  }
}
