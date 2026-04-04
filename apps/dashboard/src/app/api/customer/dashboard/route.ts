import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

type ScoreBreakdown = {
  baseScan: number;
  vulnPenalty: number;
  coveragePenalty: number;
  stalenessPenalty: number;
  incidentPenalty: number;
  controlBonus: number;
  postureScore: number;
  avgScanScore: number;
};

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

function timeDecayedAverage(
  scans: Array<{ score: number; date: string }>,
  halfLifeDays = 14
): number {
  if (!scans.length) return 0;
  const now = Date.now();
  let num = 0,
    den = 0;
  for (const s of scans) {
    const days = Math.max(
      0,
      (now - new Date(s.date).getTime()) / 86400000
    );
    const w = Math.exp(-days / halfLifeDays);
    num += s.score * w;
    den += w;
  }
  return den ? num / den : 0;
}

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const [
      apiStats,
      scanStats,
      recentScans,
      vulnStats,
      threatStats,
      recentActivity,
      upcomingScans,
      topVulnerabilities,
    ] = await Promise.all([
      // API statistics
      database.queryOne(
        `SELECT
           COUNT(*) as total_apis,
           COUNT(CASE WHEN status = 'active' THEN 1 END) as active_apis,
           COUNT(*) as monitored_apis
         FROM apis WHERE tenant_id = $1`,
        [tenantId]
      ),

      // Basic scan statistics
      database.queryOne(
        `SELECT
           COUNT(*) as total_scans,
           COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_scans,
           COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as scans_7d,
           AVG(security_score) as avg_security_score
         FROM security_scans WHERE tenant_id = $1`,
        [tenantId]
      ),

      // Recent scans for time-decay calculation (last 30 days)
      database.queryMany(
        `SELECT security_score as score, created_at as date
         FROM security_scans
         WHERE tenant_id = $1 AND created_at >= NOW() - INTERVAL '30 days'
         ORDER BY created_at DESC`,
        [tenantId]
      ),

      // Vulnerability statistics by severity
      database.queryOne(
        `SELECT
           COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical,
           COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high,
           COUNT(CASE WHEN severity = 'MEDIUM' THEN 1 END) as medium,
           COUNT(CASE WHEN severity = 'LOW' THEN 1 END) as low,
           COUNT(*) as total
         FROM vulnerabilities
         WHERE tenant_id = $1 AND status = 'open'`,
        [tenantId]
      ),

      // Threat statistics
      database.queryOne(
        `SELECT
           COUNT(*) as total_threats,
           COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_threats,
           COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_threats,
           COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as threats_24h,
           COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' AND severity = 'CRITICAL' THEN 1 END) as critical_incidents_7d
         FROM threat_events WHERE tenant_id = $1`,
        [tenantId]
      ),

      // Recent activity — scans with score + vuln count
      database.queryMany(
        `SELECT 'scan' as activity_type, s.url as subject, s.status,
                s.security_score as score,
                (SELECT COUNT(*) FROM vulnerabilities v WHERE v.scan_id = s.id) as vuln_count,
                s.created_at
         FROM security_scans s WHERE s.tenant_id = $1
         ORDER BY s.created_at DESC LIMIT 10`,
        [tenantId]
      ),

      // Upcoming scheduled scans
      database.queryMany(
        `SELECT id, name, target_url, scan_type, next_run
         FROM scheduled_scans
         WHERE tenant_id = $1 AND is_active = true AND next_run > NOW()
         ORDER BY next_run ASC LIMIT 5`,
        [tenantId]
      ),

      // Top vulnerabilities (most critical, most recent)
      database.queryMany(
        `SELECT v.id, v.title, v.severity, v.status, v.affected_url, v.vulnerability_type, v.created_at,
                s.url as scan_url
         FROM vulnerabilities v
         LEFT JOIN security_scans s ON v.scan_id = s.id
         WHERE v.tenant_id = $1 AND v.status = 'open'
         ORDER BY
           CASE v.severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
           v.created_at DESC
         LIMIT 5`,
        [tenantId]
      ),
    ]);

    // Calculate Average Scan Score (simple mean)
    const avgScanScore = scanStats?.avg_security_score
      ? Math.round(parseFloat(scanStats.avg_security_score))
      : 0;

    // Calculate Time-Decayed Base Score
    const baseScan = recentScans.length > 0
      ? Math.round(timeDecayedAverage(recentScans, 14))
      : avgScanScore;

    // Calculate Vulnerability Penalty (max 25)
    const critVulns = parseInt(vulnStats?.critical || "0");
    const highVulns = parseInt(vulnStats?.high || "0");
    const medVulns = parseInt(vulnStats?.medium || "0");
    const lowVulns = parseInt(vulnStats?.low || "0");
    const vulnPenalty = Math.min(
      critVulns * 6 + highVulns * 3 + medVulns * 1 + lowVulns * 0.5,
      25
    );

    // Calculate Coverage Penalty (max 15)
    const totalApis = parseInt(apiStats?.total_apis || "0");
    const monitoredApis = parseInt(apiStats?.monitored_apis || "0");
    const coveragePenalty =
      totalApis > 0
        ? Math.min((1 - monitoredApis / totalApis) * 15, 15)
        : 0;

    // Calculate Staleness Penalty (max 15)
    const scansLast7d = parseInt(scanStats?.scans_7d || "0");
    const stalenessPenalty = scansLast7d === 0 ? 15 : scansLast7d < 3 ? 10 : 0;

    // Calculate Incident Penalty (max 10)
    const criticalIncidents = parseInt(
      threatStats?.critical_incidents_7d || "0"
    );
    const incidentPenalty = Math.min(criticalIncidents * 5, 10);

    // Calculate Control Bonus (max 10)
    // For now, give basic credit for having active protections
    const hasActiveProtections = parseInt(threatStats?.blocked_threats || "0") > 0;
    const hasRecentScans = scansLast7d > 0;
    const controlBonus = (hasActiveProtections ? 5 : 0) + (hasRecentScans ? 5 : 0);

    // Calculate Security Posture Score
    const postureScore = clamp(
      baseScan -
        vulnPenalty -
        coveragePenalty -
        stalenessPenalty -
        incidentPenalty +
        controlBonus
    );

    const breakdown: ScoreBreakdown = {
      baseScan,
      vulnPenalty: Math.round(vulnPenalty),
      coveragePenalty: Math.round(coveragePenalty),
      stalenessPenalty,
      incidentPenalty,
      controlBonus,
      postureScore: Math.round(postureScore),
      avgScanScore,
    };

    // Determine risk level based on posture score
    const riskLevel =
      postureScore >= 80
        ? "Low"
        : postureScore >= 60
          ? "Medium"
          : postureScore >= 40
            ? "High"
            : "Critical";

    // Get alerts and recommendations
    const alerts = [];
    const recommendations = [];

    if (critVulns > 0) {
      alerts.push({
        type: "critical",
        message: `${critVulns} critical vulnerabilities require immediate attention`,
        action: "Review vulnerabilities",
      });
    }

    if (coveragePenalty > 10) {
      recommendations.push({
        type: "monitoring",
        message: "Enable monitoring for all your APIs",
        action: "Set up API monitoring",
      });
    }

    if (scansLast7d === 0) {
      recommendations.push({
        type: "scanning",
        message: "No security scans performed in the last 7 days",
        action: "Schedule regular scans",
      });
    }

    const res = NextResponse.json({
      success: true,
      stats: {
        totalEndpoints: parseInt(apiStats?.total_apis || "0"),
        activeEndpoints: parseInt(apiStats?.active_apis || "0"),
        totalScans: parseInt(scanStats?.total_scans || "0"),
        completedScans: parseInt(scanStats?.completed_scans || "0"),
        scansLast7Days: scansLast7d,
        avgSecurityScore: avgScanScore,
        postureScore: Math.round(postureScore),
        totalThreats: parseInt(threatStats?.total_threats || "0"),
        blockedThreats: parseInt(threatStats?.blocked_threats || "0"),
        criticalThreats: parseInt(threatStats?.critical_threats || "0"),
        totalRequests: 0,
      },
      scoreBreakdown: breakdown,
      vulnerabilities: {
        critical: critVulns,
        high: highVulns,
        medium: medVulns,
        low: lowVulns,
        total: parseInt(vulnStats?.total || "0"),
      },
      dashboard: {
        overview: {
          totalApis: parseInt(apiStats?.total_apis || "0"),
          activeApis: parseInt(apiStats?.active_apis || "0"),
          monitoredApis: monitoredApis,
          totalScans: parseInt(scanStats?.total_scans || "0"),
          completedScans: parseInt(scanStats?.completed_scans || "0"),
          scansLast7Days: scansLast7d,
          totalThreats: parseInt(threatStats?.total_threats || "0"),
          blockedThreats: parseInt(threatStats?.blocked_threats || "0"),
          criticalThreats: parseInt(threatStats?.critical_threats || "0"),
          threatsLast24Hours: parseInt(threatStats?.threats_24h || "0"),
        },
        security: {
          overallScore: avgScanScore,
          averageScanScore: avgScanScore,
          totalVulnerabilities: parseInt(vulnStats?.total || "0"),
          criticalVulnerabilities: critVulns,
          riskLevel,
        },
        recentActivity: recentActivity.map((activity: any) => ({
          type: activity.activity_type,
          subject: activity.subject,
          status: activity.status,
          score: activity.score ? parseInt(activity.score) : null,
          vulnCount: activity.vuln_count ? parseInt(activity.vuln_count) : 0,
          timestamp: activity.created_at,
          timeAgo: getTimeAgo(activity.created_at),
        })),
        topVulnerabilities: topVulnerabilities.map((v: any) => ({
          id: v.id,
          title: v.title,
          severity: v.severity,
          status: v.status,
          affectedUrl: v.affected_url || v.scan_url,
          type: v.vulnerability_type,
        })),
        upcomingScans: upcomingScans.map((scan: any) => ({
          id: scan.id,
          name: scan.name,
          target: scan.target_url,
          scanType: scan.scan_type,
          scheduledFor: scan.next_run,
        })),
        alerts,
        recommendations,
      },
    });
    res.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=30");
    return res;
  } catch (error) {
    logger.error("Dashboard API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} days ago`;
}
