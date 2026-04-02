import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 401 }
      );
    }

    const alerts = [];

    // Check for critical vulnerabilities
    const vulnQuery = await database.queryOne(
      `SELECT COUNT(*) as count FROM vulnerabilities 
      WHERE tenant_id = $1 AND severity = 'critical' AND status = 'open'`,
      [tenantId]
    );
    const criticalVulns = parseInt(vulnQuery?.count || '0');
    if (criticalVulns > 0) {
      alerts.push({
        type: 'vulnerability',
        severity: 'critical',
        message: `${criticalVulns} critical vulnerabilities require immediate attention`,
        action: '/dashboard?tab=vulnerability-scanner',
      });
    }

    // Check for active threats
    const threatQuery = await database.queryOne(
      `SELECT COUNT(*) as count FROM threat_events_enhanced 
      WHERE tenant_id = $1 AND risk_score >= 80 
      AND detected_at > NOW() - INTERVAL '1 hour'`,
      [tenantId]
    );
    const recentThreats = parseInt(threatQuery?.count || '0');
    if (recentThreats > 5) {
      alerts.push({
        type: 'threat',
        severity: 'high',
        message: `${recentThreats} critical threats detected in the last hour`,
        action: '/dashboard?tab=threat-intelligence',
      });
    }

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('Error fetching critical alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}
