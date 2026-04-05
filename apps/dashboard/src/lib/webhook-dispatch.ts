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

    console.log(`[Webhook] Found ${integrations.length} active integration(s) for tenant ${tenantId}`);
    if (integrations.length === 0) return;

    const promises = integrations.map(async (integration) => {
      try {
        const creds = typeof integration.credentials === "string"
          ? JSON.parse(integration.credentials)
          : integration.credentials;

        const url = creds.webhook_url || creds.integration_key;
        if (!url) {
          console.log(`[Webhook] Integration ${integration.id}: no URL found in credentials`);
          return;
        }

        const body = buildPayload(integration.integration_type, event, payload);
        console.log(`[Webhook] Sending ${integration.integration_type} to ${url.substring(0, 50)}...`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });

        clearTimeout(timeout);
        console.log(`[Webhook] ${integration.integration_type} response: ${response.status}`);

        // Update last_used
        await database.query(
          `UPDATE external_integrations SET last_used = NOW() WHERE id = $1`,
          [integration.id],
        );
      } catch (err: any) {
        console.error(`[Webhook] FAILED integration ${integration.id} (${integration.integration_type}):`, err?.message || err);
      }
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error("Webhook dispatch error:", err);
  }
}

function buildPayload(type: string, event: string, data: Record<string, any>) {
  if (type === "slack") {
    return buildSlackPayload(event, data);
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

function buildSlackPayload(event: string, data: Record<string, any>) {
  const score = data.securityScore ?? 0;
  const vulns = data.vulnerabilityCount ?? 0;
  const url = data.url || data.target || "Unknown";
  const sevs = data.severities || {};
  const criticals = data.criticalVulns || [];
  const date = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const emoji = score >= 80 ? ":white_check_mark:" : score >= 50 ? ":warning:" : ":red_circle:";

  // Build severity breakdown string
  const sevParts: string[] = [];
  if (sevs.CRITICAL) sevParts.push(`${sevs.CRITICAL} CRITICAL`);
  if (sevs.HIGH) sevParts.push(`${sevs.HIGH} HIGH`);
  if (sevs.MEDIUM) sevParts.push(`${sevs.MEDIUM} MEDIUM`);
  if (sevs.LOW) sevParts.push(`${sevs.LOW} LOW`);
  const sevText = sevParts.length > 0 ? ` (${sevParts.join(", ")})` : "";

  const blocks: any[] = [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*:lock: GovernAPI Security Scan Complete*\n*Endpoint:* ${url}\n*Score:* ${score}/100\n*Vulnerabilities Found:* ${vulns}${sevText}\n*Scan Date:* ${date}`,
      },
    },
  ];

  // Add critical vulnerability alerts
  if (criticals.length > 0) {
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:rotating_light: *CRITICAL vulnerabilities found:*\n${criticals.map((c: string) => `• ${c}`).join("\n")}`,
      },
    });
  }

  return {
    text: `${emoji} Security Scan Complete — ${url} scored ${score}/100`,
    blocks,
  };
}
