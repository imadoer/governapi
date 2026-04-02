import { supabase } from '../db/supabase'

export async function runMockScan(scanId: string, target: string, scanType: string) {
  try {
    // Update status to running
    await supabase
      .from('scans')
      .update({ status: 'running' })
      .eq('id', scanId)

    // Simulate scan delay (2-5 seconds)
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

    // Generate realistic mock results based on scan type
    let results: any = {}

    if (scanType === 'discovery' || scanType === 'full') {
      results.discoveredEndpoints = Math.floor(Math.random() * 20) + 5
      results.endpoints = Array.from({ length: results.discoveredEndpoints }, (_, i) => ({
        path: `/api/v${Math.floor(Math.random() * 3) + 1}/${['users', 'products', 'orders', 'auth', 'payments'][Math.floor(Math.random() * 5)]}`,
        method: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        authenticated: Math.random() > 0.3
      }))
    }

    if (scanType === 'security' || scanType === 'full') {
      const criticalCount = Math.floor(Math.random() * 3)
      const highCount = Math.floor(Math.random() * 10)
      const mediumCount = Math.floor(Math.random() * 20)
      const lowCount = Math.floor(Math.random() * 30)

      results.vulnerabilities = {
        critical: criticalCount,
        high: highCount,
        medium: mediumCount,
        low: lowCount,
        total: criticalCount + highCount + mediumCount + lowCount,
        details: [
          criticalCount > 0 && { type: 'SQL Injection', severity: 'critical', endpoint: '/api/v1/users', cwe: 'CWE-89' },
          highCount > 0 && { type: 'Missing Authentication', severity: 'high', endpoint: '/api/v2/admin', cwe: 'CWE-306' },
          mediumCount > 0 && { type: 'Weak Encryption', severity: 'medium', endpoint: '/api/v1/payments', cwe: 'CWE-326' },
          lowCount > 0 && { type: 'Information Disclosure', severity: 'low', endpoint: '/api/v1/status', cwe: 'CWE-200' }
        ].filter(Boolean)
      }
    }

    if (scanType === 'compliance' || scanType === 'full') {
      results.compliance = {
        passed: Math.floor(Math.random() * 20) + 10,
        failed: Math.floor(Math.random() * 10),
        frameworks: {
          'OWASP API Top 10': Math.floor(Math.random() * 30) + 70,
          'PCI-DSS': Math.floor(Math.random() * 20) + 60,
          'GDPR': Math.floor(Math.random() * 15) + 75
        }
      }
    }

    // Update scan with results
    await supabase
      .from('scans')
      .update({
        status: 'completed',
        results: results,
        completed_at: new Date().toISOString()
      })
      .eq('id', scanId)

    // If vulnerabilities found, create violations
    if (results.vulnerabilities?.details) {
      for (const vuln of results.vulnerabilities.details) {
        await supabase
          .from('violations')
          .insert({
            api_id: (await supabase.from('scans').select('api_id').eq('id', scanId).single()).data.api_id,
            policy_name: vuln.type,
            severity: vuln.severity,
            details: vuln
          })
      }
    }

    return results
  } catch (error) {
    await supabase
      .from('scans')
      .update({
        status: 'failed',
        results: { error: error.message },
        completed_at: new Date().toISOString()
      })
      .eq('id', scanId)
    
    throw error
  }
}
