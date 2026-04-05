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
      // Placeholder for compliance — computed after Promise.all
      Promise.resolve({ avg_score: "0" }),
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

    // 3. COMPLIANCE SCORE (15% weight) — from scan-based assessment, matches Compliance Hub
    let complianceScore = 0;
    try {
      const { assessCompliance } = await import("../../../../lib/compliance-mapper");
      const vulnSums = await database.queryMany(
        `SELECT vulnerability_type as type, severity, title, COUNT(*) as count
         FROM vulnerabilities WHERE tenant_id = $1 AND status = 'open'
         GROUP BY vulnerability_type, severity, title`, [tenantId]);
      const publicEps = await database.queryMany(
        `SELECT DISTINCT url FROM security_scans WHERE tenant_id = $1 AND status = 'completed' AND security_score IS NOT NULL`, [tenantId]);
      if (publicEps.length > 0) {
        vulnSums.push({ type: "No Authentication", severity: "HIGH", title: "Public endpoints", count: String(publicEps.length) });
      }
      const hasSc = lastScanQuery?.last_scan != null;
      const fws = assessCompliance(
        vulnSums.map((v: any) => ({ type: v.type, severity: v.severity, title: v.title, count: parseInt(v.count) })), hasSc);
      complianceScore = fws.length > 0 ? Math.round(fws.reduce((s: number, f: any) => s + f.score, 0) / fws.length) : 0;
    } catch {}

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

    // FINAL WEIGHTED SCORE — 0 if no scans performed yet
    const hasScans = lastScanQuery?.last_scan != null;
    const finalScore = !hasScans ? 0 : Math.round(
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

    // Calculate trend — only if there were scans more than 7 days ago
    let securityScoreTrend: number | null = null;
    const oldScanCheck = await database.queryOne(
      `SELECT COUNT(*) as c FROM security_scans
       WHERE tenant_id = $1 AND status = 'completed' AND created_at < NOW() - INTERVAL '7 days'`,
      [tenantId],
    );

    if (parseInt(oldScanCheck?.c || "0") > 0) {
      const lastWeekQuery = await database.queryOne(
        `SELECT
          COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as critical_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as high_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'MEDIUM') as medium_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'LOW') as low_count
        FROM vulnerabilities
        WHERE tenant_id = $1 AND created_at < NOW() - INTERVAL '7 days'`,
        [tenantId],
      );
      const lw = lastWeekQuery || {};
      const lastWeekVulnScore = Math.max(0, Math.min(100,
        100 - (parseInt(lw.critical_count) || 0) * 10 - (parseInt(lw.high_count) || 0) * 5
        - (parseInt(lw.medium_count) || 0) * 2 - (parseInt(lw.low_count) || 0) * 0.5
      ));
      securityScoreTrend = Math.round(vulnScore - lastWeekVulnScore);
    }

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

    const res = NextResponse.json({
      success: true,
      metrics,
    });
    res.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=30");
    return res;
  } catch (error) {
    console.error('Error fetching security metrics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security metrics' },
      { status: 500 }
    );
  }
}
