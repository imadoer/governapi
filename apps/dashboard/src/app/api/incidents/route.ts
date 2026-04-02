import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../infrastructure/database';

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  
  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Tenant ID required' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    const query = `
      SELECT 
        id,
        event_type as title,
        CASE 
          WHEN risk_score >= 80 THEN 'critical'
          WHEN risk_score >= 60 THEN 'high'
          WHEN risk_score >= 40 THEN 'medium'
          ELSE 'low'
        END as severity,
        detected_at as "startedAt",
        'active' as status,
        source_ip
      FROM threat_events_enhanced
      WHERE tenant_id = $1
      AND risk_score >= 60
      ${activeOnly ? "AND detected_at > NOW() - INTERVAL '1 hour'" : 'AND detected_at > NOW() - INTERVAL \'24 hours\''}
      ORDER BY detected_at DESC
      LIMIT 10
    `;

    const result = await database.queryMany(query, [tenantId]);

    const incidents = result.map((row: any) => ({
      id: row.id.toString(),
      title: `${row.severity.toUpperCase()}: ${row.title} from ${row.source_ip}`,
      severity: row.severity,
      startedAt: row.startedAt,
      status: row.status,
    }));

    return NextResponse.json({
      success: true,
      incidents,
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch incidents' },
      { status: 500 }
    );
  }
}
