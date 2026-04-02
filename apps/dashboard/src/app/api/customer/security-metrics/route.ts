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

    const [vulnsQuery, threatsQuery, scansQuery, incidentQuery, threatsBlockedQuery, complianceQuery, botQuery, lastScanQuery, criticalThreatsQuery] = await Promise.all([
      // Get vulnerability counts
      database.queryOne(
        `SELECT
          COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as critical_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as high_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'MEDIUM') as medium_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'LOW') as low_count,
          COUNT(*) FILTER (WHERE status = 'open') as open_count
        FROM vulnerabilities
        WHERE tenant_id = $1`,
        [tenantId]
      ),
      // Get active threats (last 24 hours)
      database.queryOne(
        `SELECT COUNT(*) as count
        FROM threat_events_enhanced
        WHERE tenant_id = $1
        AND detected_at > NOW() - INTERVAL '24 hours'`,
        [tenantId]
      ),
      // Get running scans
      database.queryOne(
        `SELECT COUNT(*) as count
        FROM security_scans
        WHERE tenant_id = $1
        AND status = 'running'`,
        [tenantId]
      ),
      // Get last critical incident
      database.queryOne(
        `SELECT MAX(detected_at) as last_incident
        FROM threat_events_enhanced
        WHERE tenant_id = $1
        AND risk_score >= 60`,
        [tenantId]
      ),
      // Get threats blocked today
      database.queryOne(
        `SELECT COUNT(*) as count
        FROM threat_events_enhanced
        WHERE tenant_id = $1
        AND DATE(detected_at) = CURRENT_DATE
        AND blocked = true`,
        [tenantId]
      ),
      // Get REAL compliance score
      database.queryOne(
        `SELECT AVG(compliance_percentage) as avg_score
        FROM compliance_check_results
        WHERE tenant_id = $1
        AND status = 'passed'`,
        [tenantId]
      ),
      // Get bot detection stats
      database.queryOne(
        `SELECT
          COUNT(*) as total_requests,
          COUNT(*) FILTER (WHERE event_type LIKE '%bot%' AND blocked = true) as blocked_bots,
          COUNT(*) FILTER (WHERE event_type LIKE '%bot%' AND blocked = false) as allowed_bots
        FROM threat_events_enhanced
        WHERE tenant_id = $1
        AND detected_at > NOW() - INTERVAL '24 hours'`,
        [tenantId]
      ),
      // Get last scan date for scan hygiene
      database.queryOne(
        `SELECT MAX(created_at) as last_scan
        FROM security_scans
        WHERE tenant_id = $1`,
        [tenantId]
      ),
      // Get critical threats (risk_score >= 80)
      database.queryOne(
        `SELECT COUNT(*) as count
        FROM threat_events_enhanced
        WHERE tenant_id = $1
        AND detected_at > NOW() - INTERVAL '24 hours'
        AND risk_score >= 80`,
        [tenantId]
      ),
    ]);

    const vulns = vulnsQuery || {};
    const activeThreats = parseInt(threatsQuery?.count || '0');
    const criticalThreats = parseInt(criticalThreatsQuery?.count || '0');
    const scansRunning = parseInt(scansQuery?.count || '0');
    const lastIncidentAt = incidentQuery?.last_incident || null;
    const threatsBlockedToday = parseInt(threatsBlockedQuery?.count || '0');

    // ============================================
    // FORTUNE 500 WEIGHTED COMPOSITE SCORE SYSTEM
    // ============================================

    // 1. VULNERABILITY SCORE (50% weight)
    const criticalPenalty = (parseInt(vulns.critical_count) || 0) * 10;
    const highPenalty = (parseInt(vulns.high_count) || 0) * 5;
    const mediumPenalty = (parseInt(vulns.medium_count) || 0) * 2;
    const lowPenalty = (parseInt(vulns.low_count) || 0) * 0.5;
    const vulnScore = Math.max(0, Math.min(100,
      100 - criticalPenalty - highPenalty - mediumPenalty - lowPenalty
    ));

    // 2. THREAT SCORE (25% weight)
    const threatPenalty = (activeThreats * 2) + (criticalThreats * 4);
    const threatScore = Math.max(0, Math.min(100, 100 - threatPenalty));

    // 3. COMPLIANCE SCORE (15% weight)
    const complianceScore = complianceQuery?.avg_score
      ? Math.round(parseFloat(complianceQuery.avg_score))
      : 0;

    // 4. SCAN HYGIENE SCORE (10% weight)
    let scanHygieneScore = 100;
    if (lastScanQuery?.last_scan) {
      const lastScan = new Date(lastScanQuery.last_scan);
      const now = new Date();
      const daysSinceLastScan = Math.floor((now.getTime() - lastScan.getTime()) / (1000 * 60 * 60 * 24));
      scanHygieneScore = Math.max(0, 100 - (daysSinceLastScan * 2));
    } else {
      scanHygieneScore = 0; // No scans ever
    }

    // FINAL WEIGHTED SCORE
    const finalScore = Math.round(
      (vulnScore * 0.5) +
      (threatScore * 0.25) +
      (complianceScore * 0.15) +
      (scanHygieneScore * 0.10)
    );

    // Real bot detection rate
    const botStats = botQuery || {};
    const totalBots = (parseInt(botStats.blocked_bots) || 0) + (parseInt(botStats.allowed_bots) || 0);
    const botDetectionRate = totalBots > 0
      ? Math.round(((parseInt(botStats.blocked_bots) || 0) / totalBots) * 100)
      : 0;

    // Calculate trend (compare with last week)
    const lastWeekQuery = await database.queryOne(
      `SELECT
        COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as critical_count,
        COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as high_count,
        COUNT(*) FILTER (WHERE UPPER(severity) = 'MEDIUM') as medium_count,
        COUNT(*) FILTER (WHERE UPPER(severity) = 'LOW') as low_count
      FROM vulnerabilities
      WHERE tenant_id = $1
      AND created_at < NOW() - INTERVAL '7 days'`,
      [tenantId]
    );

    const lastWeekVulns = lastWeekQuery || {};
    const lastWeekVulnScore = Math.max(0, Math.min(100,
      100
      - (parseInt(lastWeekVulns.critical_count) || 0) * 10
      - (parseInt(lastWeekVulns.high_count) || 0) * 5
      - (parseInt(lastWeekVulns.medium_count) || 0) * 2
      - (parseInt(lastWeekVulns.low_count) || 0) * 0.5
    ));

    // For now, use vuln score trend as overall trend (can enhance later with full composite)
    const securityScoreTrend = Math.round(vulnScore - lastWeekVulnScore);

    const metrics = {
      // Main score (Fortune 500 composite)
      securityScore: finalScore,
      securityScoreTrend,
      
      // Subscores for breakdown
      vulnScore: Math.round(vulnScore),
      threatScore: Math.round(threatScore),
      complianceScore,
      scanHygieneScore: Math.round(scanHygieneScore),
      
      // Original metrics
      activeThreats,
      openVulnerabilities: parseInt(vulns.open_count || '0'),
      scansRunning,
      lastIncidentAt,
      criticalVulns: parseInt(vulns.critical_count || '0'),
      highVulns: parseInt(vulns.high_count || '0'),
      mediumVulns: parseInt(vulns.medium_count || '0'),
      lowVulns: parseInt(vulns.low_count || '0'),
      threatsBlockedToday,
      botDetectionRate,
      goodBots: parseInt(botStats.allowed_bots || '0'),
      badBots: parseInt(botStats.blocked_bots || '0'),
    };

    return NextResponse.json({
      success: true,
      metrics,
    });
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}
