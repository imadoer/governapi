import { database } from "../infrastructure/database";

const SCAN_INTERVAL_MS = 60 * 60 * 1000; // Check every hour
let schedulerStarted = false;

/**
 * Starts the background scan scheduler.
 * Runs every hour, picks up APIs that haven't been scanned in 24h,
 * and triggers quick scans for them.
 */
export function startScanScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;

  // Run first check after 30 seconds (let server finish starting)
  setTimeout(() => {
    runScheduledScans();
    setInterval(runScheduledScans, SCAN_INTERVAL_MS);
  }, 30_000);
}

async function runScheduledScans() {
  try {
    // Find all active APIs that haven't been scanned in the last 24 hours
    const staleApis = await database.queryMany(
      `SELECT a.id, a.tenant_id, a.url, a.name
       FROM apis a
       WHERE a.status = 'active'
         AND a.url LIKE 'http%'
         AND NOT EXISTS (
           SELECT 1 FROM security_scans s
           WHERE s.tenant_id = a.tenant_id
             AND s.url = a.url
             AND s.created_at >= NOW() - INTERVAL '24 hours'
         )
       ORDER BY a.created_at ASC
       LIMIT 20`,
      [],
    );

    if (staleApis.length === 0) return;

    for (const api of staleApis) {
      // Check there's no pending/running scan already
      const active = await database.queryOne(
        `SELECT id FROM security_scans
         WHERE tenant_id = $1 AND url = $2 AND status IN ('pending', 'running')`,
        [api.tenant_id, api.url],
      );
      if (active) continue;

      // Trigger scan via internal HTTP call
      try {
        await fetch("http://localhost:3000/api/customer/security-scans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": api.tenant_id,
            "x-internal-request": "true",
            "x-request-id": `scheduled-${api.id}-${Date.now()}`,
          },
          body: JSON.stringify({ url: api.url, scanType: "quick" }),
        });
      } catch {
        // Individual scan failure shouldn't stop the scheduler
      }

      // Brief pause between scans to avoid overloading
      await new Promise((r) => setTimeout(r, 5000));
    }
  } catch {
    // Scheduler errors shouldn't crash the server
  }
}
