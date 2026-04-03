export async function register() {
  // Only run on the server, not during build or in Edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScanScheduler } = await import("./lib/scan-scheduler");
    startScanScheduler();
  }
}
