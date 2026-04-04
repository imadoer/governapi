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

    // Get the last 30 days of security metrics
    // We'll generate daily snapshots based on vulnerability and threat data
    const trendsData = [];
    
    for (let i = 29; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - i);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Get vulnerability counts for this date
      const vulnsQuery = await database.queryOne(
        `SELECT
          COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as critical_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as high_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'MEDIUM') as medium_count,
          COUNT(*) FILTER (WHERE UPPER(severity) = 'LOW') as low_count
        FROM vulnerabilities
        WHERE tenant_id = $1
        AND created_at <= $2
        AND (resolved_at IS NULL OR resolved_at > $2)`,
        [tenantId, targetDate]
      );

      // Get active threats for this date
      const threatsQuery = await database.queryOne(
        `SELECT COUNT(*) as count
        FROM threat_events_enhanced
        WHERE tenant_id = $1
        AND DATE(detected_at) = $2`,
        [tenantId, dateStr]
      );

      const vulns = vulnsQuery || {};
      const criticalPenalty = (parseInt(vulns.critical_count) || 0) * 10;
      const highPenalty = (parseInt(vulns.high_count) || 0) * 5;
      const mediumPenalty = (parseInt(vulns.medium_count) || 0) * 2;
      const lowPenalty = (parseInt(vulns.low_count) || 0) * 0.5;
      
      const vulnScore = Math.max(0, Math.min(100,
        100 - criticalPenalty - highPenalty - mediumPenalty - lowPenalty
      ));

      // Simple security score for trend (just using vuln score for now)
      const securityScore = Math.round(vulnScore);
      const activeThreats = parseInt(threatsQuery?.count || '0');

      trendsData.push({
        date: dateStr,
        securityScore,
        activeThreats
      });
    }

    const res = NextResponse.json({
      success: true,
      trends: trendsData
    });
    res.headers.set("Cache-Control", "private, max-age=5, stale-while-revalidate=30");
    return res;
  } catch (error) {
    console.error('Error fetching security trends:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security trends' },
      { status: 500 }
    );
  }
}
