import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function POST(req: NextRequest) {
  const tenantId = req.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const startTime = Date.now();
  let integrationId = null;

  try {
    const body = await req.json();
    const { webhook_url, message, channel, integrationId: reqIntegrationId, event_type } = body;

    integrationId = reqIntegrationId;

    if (!webhook_url) {
      return NextResponse.json(
        { error: "webhook_url is required" },
        { status: 400 },
      );
    }

    // Build the Slack message payload
    const slackPayload = {
      channel: channel || "#security-alerts",
      username: "GovernAPI Security",
      icon_emoji: ":shield:",
      text: message || "🧪 Test from GovernAPI - Integration successful!",
      attachments: [
        {
          color: "good",
          fields: [
            {
              title: event_type || "Test Message",
              value: message || "This is a test message to verify your integration is working correctly.",
              short: false,
            },
            {
              title: "Timestamp",
              value: new Date().toISOString(),
              short: true,
            },
          ],
        },
      ],
    };

    // Send to webhook
    const response = await fetch(webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    });

    const responseTime = Date.now() - startTime;
    const responseText = await response.text();
    const success = response.ok;

    // Log to database
    await database.query(
      `INSERT INTO webhook_logs 
       (tenant_id, integration_id, integration_type, webhook_url, event_type, payload, 
        response_status, response_body, response_time_ms, success, error_message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        tenantId,
        integrationId,
        'slack',
        webhook_url,
        event_type || 'test',
        JSON.stringify(slackPayload),
        response.status,
        responseText.substring(0, 1000),
        responseTime,
        success,
        success ? null : responseText.substring(0, 500),
      ]
    );

    logger.info("Slack webhook sent", { 
      tenantId, 
      status: response.status,
      responseTime,
      success 
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: "✅ Webhook sent successfully!",
        details: {
          status: response.status,
          statusText: response.statusText,
          responseTime: `${responseTime}ms`,
          response: responseText.substring(0, 200),
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "❌ Webhook failed",
          details: {
            status: response.status,
            statusText: response.statusText,
            responseTime: `${responseTime}ms`,
            error: responseText.substring(0, 500),
          }
        },
        { status: 400 },
      );
    }

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error to database
    if (integrationId) {
      try {
        await database.query(
          `INSERT INTO webhook_logs 
           (tenant_id, integration_id, integration_type, webhook_url, event_type, payload, 
            response_status, response_time_ms, success, error_message, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [
            tenantId,
            integrationId,
            'slack',
            'unknown',
            'error',
            JSON.stringify({ error: 'Request failed' }),
            500,
            responseTime,
            false,
            error instanceof Error ? error.message : String(error),
          ]
        );
      } catch (logError) {
        logger.error("Failed to log webhook error", { error: logError });
      }
    }

    logger.error("Slack integration error:", {
      error: error instanceof Error ? error.message : String(error),
      tenantId,
    });
    
    return NextResponse.json(
      {
        success: false,
        message: "❌ Failed to send webhook",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
