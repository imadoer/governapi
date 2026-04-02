import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 401 }
      );
    }

    // Get all the security metrics
    const [metricsData, vulnsData, threatsData, scansData] = await Promise.all([
      // Security metrics
      fetch(`${request.nextUrl.origin}/api/customer/security-metrics`, {
        headers: { 'x-tenant-id': tenantId }
      }).then(res => res.json()),
      
      // Vulnerabilities
      database.queryMany(
        `SELECT severity, COUNT(*) as count
         FROM vulnerabilities
         WHERE tenant_id = $1 AND status = 'open'
         GROUP BY severity`,
        [tenantId]
      ),
      
      // Recent threats
      database.queryMany(
        `SELECT event_type as threat_type, COUNT(*) as count
         FROM threat_events_enhanced
         WHERE tenant_id = $1
         AND detected_at > NOW() - INTERVAL '7 days'
         GROUP BY threat_type
         ORDER BY count DESC
         LIMIT 5`,
        [tenantId]
      ),
      
      // Recent scans
      database.queryMany(
        `SELECT scan_type, status, created_at
         FROM security_scans
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT 5`,
        [tenantId]
      ),
    ]);

    const metrics = metricsData?.metrics || {};
    
    // Build the PDF data structure
    const reportData = {
      generatedAt: new Date().toISOString(),
      metrics: {
        securityScore: metrics.securityScore || 0,
        vulnScore: metrics.vulnScore || 0,
        threatScore: metrics.threatScore || 0,
        complianceScore: metrics.complianceScore || 0,
        scanHygieneScore: metrics.scanHygieneScore || 0,
      },
      vulnerabilities: {
        total: metrics.openVulnerabilities || 0,
        critical: metrics.criticalVulns || 0,
        high: metrics.highVulns || 0,
        medium: metrics.mediumVulns || 0,
        low: metrics.lowVulns || 0,
      },
      threats: {
        active: metrics.activeThreats || 0,
        blockedToday: metrics.threatsBlockedToday || 0,
        recentTypes: threatsData?.map((t: any) => ({ type: t.threat_type, count: t.count })) || [],
      },
      scans: {
        running: metrics.scansRunning || 0,
        recent: scansData?.map((s: any) => ({
          type: s.scan_type,
          status: s.status,
          date: s.created_at
        })) || [],
      },
    };

    return NextResponse.json({
      success: true,
      reportData,
    });
  } catch (error) {
    console.error('Error generating security report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate security report' },
      { status: 500 }
    );
  }
}
