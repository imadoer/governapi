import { database } from "../infrastructure/database";

/**
 * Dispatches webhook notifications to all active integrations for a tenant.
 * Fire-and-forget — errors are logged but don't block the caller.
 */
export async function dispatchWebhooks(
  tenantId: string,
  event: string,
  payload: Record<string, any>,
) {
  try {
    const integrations = await database.queryMany(
      `SELECT id, integration_type, credentials
       FROM external_integrations
       WHERE tenant_id = $1 AND is_active = true`,
      [tenantId],
    );

    if (integrations.length === 0) return;

    const promises = integrations.map(async (integration) => {
      try {
        const creds = typeof integration.credentials === "string"
          ? JSON.parse(integration.credentials)
          : integration.credentials;

        const url = creds.webhook_url || creds.integration_key;
        if (!url) return;

        const body = buildPayload(integration.integration_type, event, payload);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        // Update last_used
        await database.query(
          `UPDATE external_integrations SET last_used = NOW() WHERE id = $1`,
          [integration.id],
        );
      } catch (err) {
        console.error(`Webhook dispatch failed for integration ${integration.id}:`, err);
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error("Webhook dispatch error:", err);
  }
}

function buildPayload(type: string, event: string, data: Record<string, any>) {
  if (type === "slack") {
    // Slack incoming webhook format
    const score = data.securityScore ?? "N/A";
    const vulns = data.vulnerabilityCount ?? 0;
    const url = data.url || data.target || "Unknown";
    const emoji = score >= 80 ? ":white_check_mark:" : score >= 50 ? ":warning:" : ":red_circle:";

    return {
      text: `${emoji} *Security Scan Complete*`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${emoji} *Security Scan Complete*\n*Target:* ${url}\n*Score:* ${score}/100\n*Issues found:* ${vulns}`,
          },
        },
      ],
    };
  }

  if (type === "pagerduty") {
    const severity = (data.securityScore ?? 100) < 40 ? "critical"
      : (data.securityScore ?? 100) < 70 ? "warning" : "info";
    return {
      routing_key: data.integration_key,
      event_action: "trigger",
      payload: {
        summary: `GovernAPI: Scan complete for ${data.url || "endpoint"} — Score: ${data.securityScore}`,
        severity,
        source: "GovernAPI",
      },
    };
  }

  // Generic webhook
  return { event, timestamp: new Date().toISOString(), data };
}
