import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../../../infrastructure/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ view: string }> }
) {
  try {
    const { view: viewParam } = await params;
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const interval = '30 days';

    // Get total scan count for auto-selection
    const countRow = await database.queryOne(
      `SELECT COUNT(*) as total FROM security_scans
       WHERE tenant_id = $1 AND status = 'completed' AND security_score IS NOT NULL
         AND created_at >= NOW() - INTERVAL '30 days'`,
      [tenantId],
    );
    const totalScans = parseInt(countRow?.total || '0');

    let effectiveView = viewParam || 'auto';
    if (effectiveView === 'auto') {
      if (totalScans < 7) effectiveView = 'per-scan';
      else if (totalScans < 30) effectiveView = 'daily';
      else effectiveView = 'weekly';
    }

    let trends: any[] = [];

    if (effectiveView === 'per-scan') {
      const rows = await database.queryMany(
        `SELECT ss.id, ss.created_at as date, ss.security_score, ss.url as target,
           (SELECT COUNT(*) FROM vulnerabilities v WHERE v.scan_id = ss.id AND v.status = 'open') as vuln_count
         FROM security_scans ss
         WHERE ss.tenant_id = $1 AND ss.status = 'completed' AND ss.security_score IS NOT NULL
           AND ss.created_at >= NOW() - INTERVAL '${interval}'
         ORDER BY ss.created_at ASC`,
        [tenantId],
      );
      let cumulativeVulns = 0;
      for (const row of rows) {
        cumulativeVulns += parseInt(row.vuln_count || '0');
        trends.push({
          date: row.date,
          securityScore: parseInt(row.security_score),
          activeThreats: cumulativeVulns,
          target: row.target,
          scanId: row.id,
        });
      }
    } else {
      const groupExpr = effectiveView === 'weekly'
        ? `date_trunc('week', created_at)::date`
        : `created_at::date`;
      const rows = await database.queryMany(
        `SELECT ${groupExpr} as date, ROUND(AVG(security_score)) as avg_score, COUNT(*) as scan_count
         FROM security_scans
         WHERE tenant_id = $1 AND status = 'completed' AND security_score IS NOT NULL
           AND created_at >= NOW() - INTERVAL '${interval}'
         GROUP BY ${groupExpr} ORDER BY date ASC`,
        [tenantId],
      );
      for (const row of rows) {
        const vulns = await database.queryOne(
          `SELECT COUNT(*) as total FROM vulnerabilities
           WHERE tenant_id = $1 AND created_at <= ($2::date + INTERVAL '1 day')
             AND (resolved_at IS NULL OR resolved_at > $2::date) AND status = 'open'`,
          [tenantId, row.date],
        );
        trends.push({
          date: row.date,
          securityScore: parseInt(row.avg_score || '0'),
          activeThreats: parseInt(vulns?.total || '0'),
          scanCount: parseInt(row.scan_count || '0'),
        });
      }
    }

    const res = NextResponse.json({ success: true, trends, view: effectiveView, totalScans });
    res.headers.set("Cache-Control", "private, max-age=15, stale-while-revalidate=30");
    return res;
  } catch (error) {
    console.error('Error fetching security trends:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch security trends' }, { status: 500 });
  }
}
