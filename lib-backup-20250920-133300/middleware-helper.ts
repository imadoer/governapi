// Helper to call threat detection from application routes instead of middleware
export async function checkThreat(ip: string, userAgent: string, url: string) {
  try {
    const response = await fetch('/api/middleware/threat-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, userAgent, url })
    })
    return await response.json()
  } catch (error) {
    console.error('Threat check failed:', error)
    return { blocked: false }
  }
}
