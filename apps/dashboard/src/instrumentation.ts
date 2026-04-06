export async function register() {
  // Only run scheduler on the server side (not during build or edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startScanScheduler } = await import("./lib/scan-scheduler");
      startScanScheduler();
    } catch (err) {
      console.error("[Instrumentation] Failed to start scheduler:", err);
    }
  }
}
