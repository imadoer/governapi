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

    // Analyze attack patterns from real data
    const result = await database.queryMany(
      `SELECT 
        event_type as pattern,
        CASE 
          WHEN MAX(risk_score) >= 80 THEN 'critical'
          WHEN MAX(risk_score) >= 60 THEN 'high'
          WHEN MAX(risk_score) >= 40 THEN 'medium'
          ELSE 'low'
        END as severity,
        COUNT(*) as count,
        MIN(detected_at) as first_seen,
        MAX(detected_at) as last_seen,
        COUNT(DISTINCT source_ip) as unique_ips,
        AVG(confidence_level) as avg_confidence
      FROM threat_events_enhanced
      WHERE tenant_id = $1
      AND detected_at > NOW() - INTERVAL '7 days'
      GROUP BY event_type
      HAVING COUNT(*) > 5
      ORDER BY count DESC
      LIMIT 10`,
      [tenantId]
    );

    const patterns = result.map((row: any) => {
      const uniqueIps = parseInt(row.unique_ips);
      const avgConfidence = parseFloat(row.avg_confidence || '0.7');
      const confidence = Math.min(95, Math.round(avgConfidence * 100));

      return {
        pattern: row.pattern,
        count: parseInt(row.count),
        severity: row.severity,
        confidence,
        description: `Detected ${row.count} ${row.pattern} attempts from ${uniqueIps} unique source${uniqueIps !== 1 ? 's' : ''}`,
        firstSeen: row.first_seen,
        lastSeen: row.last_seen,
      };
    });

    return NextResponse.json({
      success: true,
      patterns,
    });
  } catch (error) {
    console.error('Error fetching attack patterns:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch patterns' },
      { status: 500 }
    );
  }
}
