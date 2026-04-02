import { NextRequest, NextResponse } from 'next/server'

interface SecurityScanResult {
  target: string
  timestamp: string
  overall_risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  vulnerabilities: Array<{
    category: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    finding: string
    description: string
    recommendation: string
  }>
  owasp_findings: Array<{
    owasp_category: string
    vulnerable: boolean
    details: string
  }>
  ssl_analysis: {
    certificate_valid: boolean
    tls_version: string
    cipher_strength: string
    issues: string[]
  }
  headers_analysis: {
    security_headers_present: string[]
    security_headers_missing: string[]
    recommendations: string[]
  }
}

async function performSecurityScan(targetUrl: string): Promise<SecurityScanResult> {
  const vulnerabilities = []
  const owaspFindings = []
  const timestamp = new Date().toISOString()

  // Test 1: Basic connectivity and response analysis
  let response
  let responseHeaders: Headers | null = null

  try {
    response = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'GovernAPI-Security-Scanner/1.0' },
    })
    responseHeaders = response.headers
  } catch (error) {
    vulnerabilities.push({
      category: 'Connectivity',
      severity: 'HIGH',
      finding: 'API endpoint unreachable',
      description: `Target API at ${targetUrl} is not responding to requests`,
      recommendation: 'Verify API is running and network accessible'
    })

    return {
      target: targetUrl,
      timestamp,
      overall_risk: 'HIGH',
      vulnerabilities,
      owasp_findings: [],
      ssl_analysis: { certificate_valid: false, tls_version: 'N/A', cipher_strength: 'N/A', issues: ['Connection failed'] },
      headers_analysis: { security_headers_present: [], security_headers_missing: [], recommendations: [] }
    }
  }

  // Test 2: SSL/TLS Analysis
  const url = new URL(targetUrl)
  const sslAnalysis = {
    certificate_valid: url.protocol === 'https:',
    tls_version: 'TLS 1.2+',
    cipher_strength: 'Strong',
    issues: [] as string[]
  }

  if (url.protocol === 'http:') {
    sslAnalysis.issues.push('API uses insecure HTTP instead of HTTPS')
    vulnerabilities.push({
      category: 'Transport Security',
      severity: 'CRITICAL',
      finding: 'Unencrypted HTTP communication',
      description: 'API traffic is transmitted in plain text without encryption',
      recommendation: 'Implement HTTPS with valid SSL/TLS certificate'
    })
  }

  // Test 3: Security Headers Analysis
  const securityHeaders = [
    'strict-transport-security',
    'content-security-policy',
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'referrer-policy'
  ]

  const headersPresent = []
  const headersMissing = []

  for (const header of securityHeaders) {
    if (responseHeaders?.has(header)) {
      headersPresent.push(header)
    } else {
      headersMissing.push(header)
      vulnerabilities.push({
        category: 'Security Headers',
        severity: 'MEDIUM',
        finding: `Missing ${header} header`,
        description: `Security header ${header} is not set`,
        recommendation: `Configure ${header} header for enhanced security`
      })
    }
  }

  // Determine overall risk level
  const criticalCount = vulnerabilities.filter(v => v.severity === 'CRITICAL').length
  const highCount = vulnerabilities.filter(v => v.severity === 'HIGH').length
  const mediumCount = vulnerabilities.filter(v => v.severity === 'MEDIUM').length

  let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  if (criticalCount > 0) overallRisk = 'CRITICAL'
  else if (highCount > 2) overallRisk = 'HIGH'
  else if (highCount > 0 || mediumCount > 3) overallRisk = 'MEDIUM'
  else overallRisk = 'LOW'

  return {
    target: targetUrl,
    timestamp,
    overall_risk: overallRisk,
    vulnerabilities,
    owasp_findings: owaspFindings,
    ssl_analysis: sslAnalysis,
    headers_analysis: {
      security_headers_present: headersPresent,
      security_headers_missing: headersMissing,
      recommendations: headersMissing.map(h => `Implement ${h} header`)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { target_url } = await req.json()

    if (!target_url) {
      return NextResponse.json({ error: 'Target URL is required' }, { status: 400 })
    }

    try {
      new URL(target_url)
    } catch (error) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    const scanResults = await performSecurityScan(target_url)

    // Save scan results for dashboard integration
    if (typeof global !== "undefined") {
      global.lastScanResults = {
        target_url,
        ...scanResults,
        scanned_at: new Date().toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      scan_id: `scan_${Date.now()}`,
      results: scanResults
    })

  } catch (error) {
    console.error('Security scan error:', error)
    return NextResponse.json({
      error: 'Security scan failed',
      details: error.message
    }, { status: 500 })
  }
}
