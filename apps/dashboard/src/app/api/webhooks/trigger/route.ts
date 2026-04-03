import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

async function sendWebhook(webhook: any, payload: any) {
  try {
    let formattedPayload = payload;

    // Format payload based on webhook type
    if (webhook.type === "slack") {
      formattedPayload = {
        text: `🚨 GovernAPI Security Alert`,
        attachments: [
          {
            color:
              payload.severity === "CRITICAL"
                ? "danger"
                : payload.severity === "HIGH"
                  ? "warning"
                  : "good",
            fields: [
              { title: "Target", value: payload.target, short: true },
              {
                title: "Vulnerabilities",
                value: payload.vulnerability_count,
                short: true,
              },
              { title: "Risk Level", value: payload.overall_risk, short: true },
              {
                title: "Timestamp",
                value: new Date(payload.timestamp).toLocaleString(),
                short: true,
              },
            ],
          },
        ],
      };
    } else if (webhook.type === "discord") {
      formattedPayload = {
        embeds: [
          {
            title: "🚨 GovernAPI Security Alert",
            color:
              payload.severity === "CRITICAL"
                ? 15158332
                : payload.severity === "HIGH"
                  ? 15844367
                  : 3066993,
            fields: [
              { name: "Target", value: payload.target, inline: true },
              {
                name: "Vulnerabilities",
                value: payload.vulnerability_count.toString(),
                inline: true,
              },
              { name: "Risk Level", value: payload.overall_risk, inline: true },
            ],
            timestamp: payload.timestamp,
          },
        ],
      };
    } else if (webhook.type === "teams") {
      formattedPayload = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor:
          payload.severity === "CRITICAL"
            ? "FF0000"
            : payload.severity === "HIGH"
              ? "FFA500"
              : "00FF00",
        summary: "GovernAPI Security Alert",
        sections: [
          {
            activityTitle: "🚨 Security Alert",
            facts: [
              { name: "Target", value: payload.target },
              { name: "Vulnerabilities", value: payload.vulnerability_count },
              { name: "Risk Level", value: payload.overall_risk },
            ],
          },
        ],
      };
    }

    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...webhook.headers,
      },
      body: JSON.stringify(formattedPayload),
    });

    return response.ok;
  } catch (error) {
    logger.error(`Webhook ${webhook.id} failed:`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
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
    const { event_type, data } = await req.json();

    if (!event_type || !data) {
      return NextResponse.json(
        { error: "event_type and data are required" },
        { status: 400 },
      );
    }

    // Get active webhooks for this tenant and event type
    const webhooks = await database.queryMany(
      "SELECT * FROM webhooks WHERE tenant_id = $1 AND enabled = true AND $2 = ANY(events)",
      [tenantId, event_type],
    );

    if (webhooks.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active webhooks configured for this event type",
        webhooks_triggered: 0,
        total_webhooks: 0,
      });
    }

    let successCount = 0;
    const results = [];

    for (const webhook of webhooks) {
      const success = await sendWebhook(webhook, data);
      if (success) successCount++;

      results.push({
        webhook_id: webhook.id,
        webhook_name: webhook.name,
        success,
      });

      // Log webhook execution (store summary only, never full payload)
      const payloadSummary = JSON.stringify(data).substring(0, 500);
      await database.query(
        `INSERT INTO webhook_logs (tenant_id, webhook_id, event_type, payload_summary, success, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [tenantId, webhook.id, event_type, payloadSummary, success],
      );
    }

    return NextResponse.json({
      success: true,
      webhooks_triggered: successCount,
      total_webhooks: webhooks.length,
      results,
    });
  } catch (error) {
    logger.error("Webhook trigger error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to trigger webhooks",
        details: error.message,
      },
      { status: 500 },
    );
  }
}
