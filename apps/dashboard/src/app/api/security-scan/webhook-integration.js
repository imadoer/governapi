// Add this function call right before the return statement in your security scan
async function triggerWebhooks(target_url, scanResults) {
  try {
    await fetch(`${process.env.NEXTAUTH_URL || "https://governapi.com"}/api/webhooks/trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "security_scan",
        data: {
          target: target_url,
          vulnerability_count: scanResults.vulnerabilities?.length || 0,
          overall_risk: scanResults.overall_risk,
          severity: scanResults.overall_risk,
          timestamp: scanResults.timestamp
        }
      })
    })
  } catch (e) {
    console.log("Webhook trigger failed:", e)
  }
}
