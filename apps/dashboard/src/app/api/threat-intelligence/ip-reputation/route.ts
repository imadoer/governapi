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

    // Get IP reputation from real threat events
    const ipData = await database.queryMany(
      `SELECT 
        source_ip as ip,
        COUNT(*) as attack_count,
        MAX(risk_score) as max_risk_score,
        MAX(detected_at) as last_seen,
        COUNT(CASE WHEN blocked = true THEN 1 END) as blocked_count,
        ARRAY_AGG(DISTINCT event_type) as threat_types
      FROM threat_events_enhanced
      WHERE tenant_id = $1 AND detected_at > NOW() - INTERVAL '30 days'
      GROUP BY source_ip
      HAVING COUNT(*) > 2
      ORDER BY attack_count DESC
      LIMIT 50`,
      [tenantId]
    );

    const ips = ipData.map((row: any) => {
      const attackCount = parseInt(row.attack_count);
      const maxRiskScore = parseInt(row.max_risk_score || '0');
      const threatScore = Math.min(100, maxRiskScore);
      
      let reputation: 'malicious' | 'suspicious' | 'unknown' | 'trusted';
      if (threatScore > 70 || attackCount > 10) reputation = 'malicious';
      else if (threatScore > 40 || attackCount > 5) reputation = 'suspicious';
      else reputation = 'unknown';

      return {
        ip: row.ip,
        reputation,
        threatScore,
        attackCount,
        country: 'Unknown', // Add GeoIP lookup if you have it
        lastSeen: row.last_seen,
        blocklisted: parseInt(row.blocked_count) > 0,
      };
    });

    return NextResponse.json({
      success: true,
      ips,
    });
  } catch (error) {
    console.error('Error fetching IP reputation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch IP reputation' },
      { status: 500 }
    );
  }
}
