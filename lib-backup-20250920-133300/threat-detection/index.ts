interface ThreatPattern {
  name: string
  pattern: RegExp
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
}

interface ThreatScore {
  total: number
  botConfidence: number
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  threats: string[]
  shouldBlock: boolean
  blockDuration: number
}

// Global in-memory blocking for immediate protection
declare global {
  var __BLOCKED_IPS__: Map<string, { until: number; reason: string }> | undefined
}

if (!globalThis.__BLOCKED_IPS__) {
  globalThis.__BLOCKED_IPS__ = new Map()
}

class ThreatDetector {
  private threatPatterns: ThreatPattern[] = [
    {
      name: 'SQL_INJECTION',
      pattern: /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\'\s*or\s*\d+\s*=\s*\d+|admin\'\s*--)/i,
      severity: 'CRITICAL',
      description: 'SQL injection attempt detected'
    },
    {
      name: 'XSS_ATTEMPT',
      pattern: /<script|javascript:|onload=|onerror=|eval\(|alert\(/i,
      severity: 'HIGH',
      description: 'Cross-site scripting attempt'
    },
    {
      name: 'PATH_TRAVERSAL',
      pattern: /(\.\.[\/\\]){2,}|\/etc\/passwd|\/windows\/system32/i,
      severity: 'HIGH',
      description: 'Path traversal attack attempt'
    },
    {
      name: 'COMMAND_INJECTION',
      pattern: /[\s;|&`$(){}[\]<>]*(cat|ls|pwd|whoami|id|uname|wget|curl)\s/i,
      severity: 'HIGH',
      description: 'Command injection attempt'
    },
    {
      name: 'MALICIOUS_USER_AGENT',
      pattern: /(sqlmap|nmap|nikto|w3af|masscan|gobuster|dirb|wpscan|nuclei)/i,
      severity: 'HIGH',
      description: 'Known attack tool detected'
    },
    {
      name: 'SUSPICIOUS_EXTENSIONS',
      pattern: /\.(php|asp|jsp|cgi|pl|py|sh|bat|cmd|exe|dll)(\?|$)/i,
      severity: 'MEDIUM',
      description: 'Suspicious file extension access'
    },
    {
      name: 'ADMIN_PROBING',
      pattern: /(\/admin|\/administrator|\/wp-admin|\/login|\/dashboard|\/console|\/manager)/i,
      severity: 'MEDIUM',
      description: 'Administrative interface probing'
    },
    {
      name: 'SCANNING_BEHAVIOR',
      pattern: /\/(\.env|\.git|\.svn|backup|config|database|db|dump)/i,
      severity: 'MEDIUM',
      description: 'Sensitive file scanning'
    }
  ]

  analyzeThreat(url: string, userAgent: string, ip: string, requestCount = 1): ThreatScore {
    let totalScore = 0
    const threats: string[] = []
    const decodedUrl = decodeURIComponent(url)
    const fullRequest = `${decodedUrl} ${userAgent}`

    for (const threat of this.threatPatterns) {
      if (threat.pattern.test(fullRequest)) {
        const score = this.getSeverityScore(threat.severity)
        totalScore += score
        threats.push(threat.name)
      }
    }

    const botConfidence = this.calculateBotConfidence(userAgent, requestCount, url)
    const threatLevel = this.calculateThreatLevel(totalScore, botConfidence)
    const shouldBlock = this.shouldBlockRequest(totalScore, botConfidence, threats, requestCount)
    const blockDuration = this.calculateBlockDuration(totalScore, botConfidence, threats)

    return {
      total: Math.min(totalScore + botConfidence, 100),
      botConfidence,
      threatLevel,
      threats,
      shouldBlock,
      blockDuration
    }
  }

  private calculateBotConfidence(userAgent: string, requestCount: number, url: string): number {
    let confidence = 0
    if (!userAgent || userAgent.length < 10) confidence += 30
    if (/bot|crawler|spider|scraper/i.test(userAgent)) confidence += 20
    if (/curl|wget|python|postman/i.test(userAgent)) confidence += 40
    if (userAgent === 'Mozilla/5.0') confidence += 25
    if (requestCount > 10) confidence += Math.min(requestCount * 2, 40)
    if (/\.(xml|txt|log|conf)$/i.test(url)) confidence += 15
    if (url.includes('robots.txt') || url.includes('sitemap')) confidence += 20
    return Math.min(confidence, 100)
  }

  private getSeverityScore(severity: string): number {
    switch (severity) {
      case 'CRITICAL': return 50
      case 'HIGH': return 30
      case 'MEDIUM': return 15
      case 'LOW': return 5
      default: return 0
    }
  }

  private calculateThreatLevel(score: number, botConfidence: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const combined = score + (botConfidence * 0.3)
    if (combined >= 70) return 'CRITICAL'
    if (combined >= 50) return 'HIGH'
    if (combined >= 25) return 'MEDIUM'
    return 'LOW'
  }

  private shouldBlockRequest(score: number, botConfidence: number, threats: string[], requestCount: number): boolean {
    if (score >= 50) return true
    if (botConfidence >= 80 && (score > 15 || requestCount > 20)) return true
    if (threats.some(t => ['SQL_INJECTION', 'XSS_ATTEMPT', 'COMMAND_INJECTION', 'MALICIOUS_USER_AGENT'].includes(t))) return true
    if (requestCount > 50 && botConfidence > 60) return true
    return false
  }

  private calculateBlockDuration(score: number, botConfidence: number, threats: string[]): number {
    const baseTime = 5 * 60 * 1000
    if (score >= 50) return 60 * 60 * 1000
    if (botConfidence >= 90) return 30 * 60 * 1000
    if (threats.length > 2) return 15 * 60 * 1000
    return baseTime
  }

  blockIPInMemory(ip: string, reason: string, duration: number) {
    globalThis.__BLOCKED_IPS__.set(ip, {
      until: Date.now() + duration,
      reason
    })
    
    // Use external webhook call to bypass Edge Runtime limitations
    this.saveToDatabaseViaWebhook(ip, reason, duration)
  }

  private saveToDatabaseViaWebhook(ip: string, reason: string, duration: number) {
    const threats = reason.replace('Threat detected: ', '').split(', ')
    const threatLevel = this.determineThreatLevel(threats)
    
    // Use external webhook URL to bypass Edge Runtime fetch limitations
    fetch('https://governapi.com/api/webhooks/threat-block', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'ThreatDetector/1.0'
      },
      body: JSON.stringify({
        ip,
        reason,
        duration,
        threatLevel,
        threats
      })
    }).then(response => {
      if (response.ok) {
        console.log('THREAT: Successfully saved to database via webhook:', ip)
      } else {
        console.error('THREAT: Webhook save failed with status:', response.status)
      }
    }).catch(error => {
      console.error('THREAT: Webhook call failed:', error.message)
    })
  }

  private determineThreatLevel(threats: string[]): string {
    if (threats.some(t => ['SQL_INJECTION', 'COMMAND_INJECTION'].includes(t))) return 'CRITICAL'
    if (threats.some(t => ['XSS_ATTEMPT', 'MALICIOUS_USER_AGENT'].includes(t))) return 'HIGH'
    return 'MEDIUM'
  }

  isBlocked(ip: string): boolean {
    const blocked = globalThis.__BLOCKED_IPS__.get(ip)
    if (!blocked) return false
    
    if (Date.now() >= blocked.until) {
      globalThis.__BLOCKED_IPS__.delete(ip)
      return false
    }
    
    return true
  }

  getStats() {
    return {
      totalThreatPatterns: this.threatPatterns.length,
      blockedIPs: globalThis.__BLOCKED_IPS__.size,
      reputationEntries: 0
    }
  }
}

export const threatDetector = new ThreatDetector()
