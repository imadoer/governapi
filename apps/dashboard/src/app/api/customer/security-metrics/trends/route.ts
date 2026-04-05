import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    // Only return dates where real scans occurred — no fake/interpolated data
    const rows = await database.queryMany(
      `SELECT
         created_at::date as date,
         ROUND(AVG(security_score)) as avg_score,
         COUNT(*) as scan_count
       FROM security_scans
       WHERE tenant_id = $1
         AND status = 'completed'
         AND security_score IS NOT NULL
         AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY created_at::date
       ORDER BY date ASC`,
      [tenantId],
    );

    // For each date with scans, compute the weighted score (same formula as security-metrics)
    const trends = [];
    for (const row of rows) {
      // Get vuln state as of that date
      const vulns = await database.queryOne(
        `SELECT
           COUNT(*) FILTER (WHERE UPPER(severity) = 'CRITICAL') as c,
           COUNT(*) FILTER (WHERE UPPER(severity) = 'HIGH') as h,
           COUNT(*) FILTER (WHERE UPPER(severity) = 'MEDIUM') as m,
           COUNT(*) FILTER (WHERE UPPER(severity) = 'LOW') as l
         FROM vulnerabilities
         WHERE tenant_id = $1 AND created_at <= ($2::date + INTERVAL '1 day')
           AND (resolved_at IS NULL OR resolved_at > $2::date)`,
        [tenantId, row.date],
      );

      const vulnScore = Math.max(0, Math.min(100,
        100 - (parseInt(vulns?.c || '0') * 10) - (parseInt(vulns?.h || '0') * 5) -
        (parseInt(vulns?.m || '0') * 2) - (parseInt(vulns?.l || '0') * 0.5)
      ));

      // Weighted score: vuln 50% + threat 25% (0 for now) + compliance 15% (0) + scan hygiene 10% (100 since they scanned)
      const score = Math.round((vulnScore * 0.5) + (100 * 0.25) + (0 * 0.15) + (100 * 0.10));

      trends.push({
        date: row.date,
        securityScore: score,
        activeThreats: 0,
        scanCount: parseInt(row.scan_count || '0'),
      });
    }

    const res = NextResponse.json({ success: true, trends });
    res.headers.set("Cache-Control", "private, max-age=30, stale-while-revalidate=60");
    return res;
  } catch (error) {
    console.error('Error fetching security trends:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch security trends' }, { status: 500 });
  }
}
