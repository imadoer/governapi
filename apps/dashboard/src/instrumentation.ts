export async function register() {
  // Only run schedulers on the server side (not during build or edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startScanScheduler } = await import("./lib/scan-scheduler");
      startScanScheduler();
    } catch (err) {
      console.error("[Instrumentation] Failed to start scan scheduler:", err);
    }
    try {
      const { startWeeklyReportScheduler } = await import("./lib/weekly-report");
      startWeeklyReportScheduler();
    } catch (err) {
      console.error("[Instrumentation] Failed to start weekly report scheduler:", err);
    }
  }
}
