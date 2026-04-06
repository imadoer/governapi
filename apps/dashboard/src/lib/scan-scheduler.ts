import { database } from "../infrastructure/database";
import { dispatchWebhooks } from "./webhook-dispatch";

const FREQUENCIES: Record<string, number> = {
  "6h": 6 * 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
};

/** Compute the next run time from now for a given frequency */
export function nextRunTime(frequency: string, fromDate?: Date): Date {
  const base = fromDate || new Date();
  const ms = FREQUENCIES[frequency];
  if (!ms) return new Date(0); // manual — never
  const next = new Date(base.getTime() + ms);
  // Snap daily/weekly to 02:00 UTC
  if (frequency === "daily" || frequency === "weekly") {
    next.setUTCHours(2, 0, 0, 0);
    if (next.getTime() <= Date.now()) {
      next.setTime(next.getTime() + (frequency === "daily" ? 86400000 : 604800000));
    }
  }
  return next;
}

/**
 * Check for scheduled scans that are due and trigger them.
 * Called every 60 seconds from the startup hook.
 */
async function runScheduledScans() {
  try {
    const due = await database.queryMany(
      `SELECT id, tenant_id, url, frequency, last_score
       FROM scan_schedules
       WHERE is_active = true
         AND frequency != 'manual'
         AND next_run_at <= NOW()
       LIMIT 10`,
      [],
    );

    if (due.length === 0) return;
    console.log(`[Scheduler] ${due.length} scheduled scan(s) due`);

    for (const schedule of due) {
      try {
        const running = await database.queryOne(
          `SELECT id FROM security_scans WHERE tenant_id = $1 AND url = $2 AND status IN ('pending', 'running')`,
          [schedule.tenant_id, schedule.url],
        );
        if (running) {
          console.log(`[Scheduler] Skipping ${schedule.url} — scan already running`);
          continue;
        }

        console.log(`[Scheduler] Triggering scan for ${schedule.url} (${schedule.frequency})`);

        const resp = await fetch("http://localhost:3000/api/customer/security-scans", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tenant-id": schedule.tenant_id,
            "x-internal-request": "true",
          },
          body: JSON.stringify({ url: schedule.url, scanType: "comprehensive" }),
        });
        const result = await resp.json();

        if (result.success) {
          const next = nextRunTime(schedule.frequency);
          await database.query(
            `UPDATE scan_schedules SET last_run_at = NOW(), next_run_at = $1, updated_at = NOW() WHERE id = $2`,
            [next, schedule.id],
          );

          monitorScanCompletion(result.securityScan.id, schedule).catch((err) =>
            console.error("[Scheduler] Monitor failed:", err?.message),
          );
        } else {
          console.error(`[Scheduler] Failed to start scan for ${schedule.url}:`, result.error);
        }
      } catch (err: any) {
        console.error(`[Scheduler] Error processing schedule ${schedule.id}:`, err?.message);
      }

      // Brief pause between scans
      await new Promise((r) => setTimeout(r, 5000));
    }
  } catch (err: any) {
    console.error("[Scheduler] Error checking schedules:", err?.message);
  }
}

/**
 * Poll for scan completion, then compare results to previous scan.
 * Sends alerts for new vulns and score improvements.
 */
async function monitorScanCompletion(scanId: number, schedule: any) {
  const maxWait = 120;
  let elapsed = 0;

  while (elapsed < maxWait) {
    await new Promise((r) => setTimeout(r, 5000));
    elapsed += 5;

    const scan = await database.queryOne(
      `SELECT status, security_score, vulnerability_count FROM security_scans WHERE id = $1`,
      [scanId],
    );

    if (!scan || scan.status === "failed") return;
    if (scan.status !== "completed") continue;

    const newScore = parseInt(scan.security_score || "0");
    const oldScore = schedule.last_score != null ? parseInt(schedule.last_score) : null;

    await database.query(
      `UPDATE scan_schedules SET last_score = $1, updated_at = NOW() WHERE id = $2`,
      [newScore, schedule.id],
    );

    // New vulns: created_at equals last_seen means first time seen
    const newVulns = await database.queryMany(
      `SELECT title, severity, affected_url
       FROM vulnerabilities
       WHERE scan_id = $1 AND tenant_id = $2 AND created_at = last_seen`,
      [scanId, schedule.tenant_id],
    );

    if (newVulns.length > 0) {
      const vulnNames = newVulns.map((v) => `${v.severity}: ${v.title}`).join(", ");
      dispatchWebhooks(schedule.tenant_id, "policy.triggered", {
        url: schedule.url,
        securityScore: newScore,
        vulnerabilityCount: newVulns.length,
        policyName: "Scheduled Scan — New Vulnerability",
        details: `New vulnerability found on ${schedule.url} during scheduled scan: ${vulnNames}`,
      }).catch(() => {});
      console.log(`[Scheduler] Alert: ${newVulns.length} new vuln(s) on ${schedule.url}`);
    }

    if (oldScore != null && newScore > oldScore) {
      dispatchWebhooks(schedule.tenant_id, "policy.triggered", {
        url: schedule.url,
        securityScore: newScore,
        vulnerabilityCount: 0,
        policyName: "Score Improvement",
        details: `Score improved on ${schedule.url}: ${oldScore} → ${newScore}. Keep it up!`,
      }).catch(() => {});
      console.log(`[Scheduler] Score improved on ${schedule.url}: ${oldScore} → ${newScore}`);
    } else if (oldScore != null && newScore < oldScore) {
      dispatchWebhooks(schedule.tenant_id, "policy.triggered", {
        url: schedule.url,
        securityScore: newScore,
        vulnerabilityCount: 0,
        policyName: "Score Drop Alert",
        details: `Score dropped on ${schedule.url}: ${oldScore} → ${newScore}`,
      }).catch(() => {});
    }

    return;
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

/** Start the scheduler — call once at server startup */
export function startScanScheduler() {
  if (intervalId) return;
  console.log("[Scheduler] Started — checking every 60s");
  setTimeout(() => {
    runScheduledScans();
    intervalId = setInterval(runScheduledScans, 60_000);
  }, 10_000); // Wait 10s for server to be ready
}
