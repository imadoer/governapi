import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');

  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Tenant ID required' },
      { status: 401 }
    );
  }

  try {
    const { query, context, history } = await request.json();

    interface ContextData {
      totalVulnerabilities?: number;
      criticalVulnerabilities?: number;
      threatsBlockedToday?: number;
    }

    let contextData: ContextData = {};

    if (context === 'security-center') {
      const vulnsQuery = await database.queryOne(
        `SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE severity = 'critical') as critical
        FROM vulnerabilities 
        WHERE tenant_id = $1 
        AND status = 'open'`,
        [tenantId]
      );

      const threatsQuery = await database.queryOne(
        `SELECT COUNT(*) as count 
        FROM threat_events_enhanced 
        WHERE tenant_id = $1 
        AND detected_at > NOW() - INTERVAL '24 hours'`,
        [tenantId]
      );

      contextData = {
        totalVulnerabilities: parseInt(vulnsQuery?.total || '0'),
        criticalVulnerabilities: parseInt(vulnsQuery?.critical || '0'),
        threatsBlockedToday: parseInt(threatsQuery?.count || '0'),
      };
    }

    let response = '';

    if (query.toLowerCase().includes('security score')) {
      response = `Your current security score is calculated based on active vulnerabilities. You have ${contextData.criticalVulnerabilities || 0} critical vulnerabilities that are significantly impacting your score. I recommend addressing these high-priority issues first to improve your overall security posture.`;
    } else if (query.toLowerCase().includes('threat') || query.toLowerCase().includes('attack')) {
      response = `Today, we've blocked ${contextData.threatsBlockedToday || 0} potential threats. The most common attack vectors include SQL injection attempts and DDoS patterns. Your security systems are actively monitoring and blocking suspicious activities in real-time.`;
    } else if (query.toLowerCase().includes('vulnerabilities') || query.toLowerCase().includes('vuln')) {
      response = `You currently have ${contextData.totalVulnerabilities || 0} open vulnerabilities, with ${contextData.criticalVulnerabilities || 0} marked as critical. Critical vulnerabilities should be addressed within 24-48 hours. I can help you prioritize remediation based on CVSS scores and affected endpoints.`;
    } else if (query.toLowerCase().includes('improve') || query.toLowerCase().includes('better')) {
      response = `To improve your security score, I recommend: 1) Address all critical vulnerabilities first, 2) Enable automated security scanning on a weekly basis, 3) Implement rate limiting on sensitive endpoints, 4) Review and update your compliance controls regularly. Would you like specific guidance on any of these areas?`;
    } else {
      response = `I'm here to help you understand your security posture. You can ask me about:
- Your security score and how to improve it
- Recent threats and attack patterns
- Vulnerability priorities and remediation
- Compliance status and requirements
- Best practices for API security

What would you like to know more about?`;
    }

    return NextResponse.json({
      success: true,
      response,
      context: contextData,
    });
  } catch (error) {
    console.error('Error processing Copilot query:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process query' },
      { status: 500 }
    );
  }
}
