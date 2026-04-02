import { database } from "../infrastructure/database";
import { logger } from "./logging/logger";

export async function safePost(
  tenantId: string,
  url: string,
  data: any,
  headers: Record<string, string> = {}
) {
  // Validate URL
  if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}/.test(url)) {
    logger.securityEvent("Blocked unsafe outbound URL", { tenantId, url });
    throw new Error(`Blocked unsafe outbound URL: ${url}`);
  }

  try {
    const startTime = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    const responseTime = Date.now() - startTime;
    
    // Log successful outbound request
    logger.info("Outbound API call", {
      tenantId,
      url,
      status: res.status,
      responseTime,
    });

    return await res.json();
  } catch (err: any) {
    // Log outbound failures as potential threats
    logger.error("Outbound request failed", {
      tenantId,
      url,
      error: err.message,
    });
    
    // Optionally log to threat_events_outbound table
    try {
      await database.query(
        `INSERT INTO threat_events_outbound 
         (tenant_id, target_url, error_message, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [tenantId, url, err.message]
      );
    } catch (dbErr) {
      // Ignore DB errors for outbound logging
    }

    throw err;
  }
}
