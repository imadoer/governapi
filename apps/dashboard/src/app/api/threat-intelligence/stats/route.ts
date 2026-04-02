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

    const [totalQuery, todayQuery, criticalQuery, uniqueIPsQuery, topTypeQuery, blockRateQuery] = await Promise.all([
      database.queryOne(
        `SELECT COUNT(*) as count FROM threat_events_enhanced WHERE tenant_id = $1`,
        [tenantId]
      ),
      database.queryOne(
        `SELECT COUNT(*) as count FROM threat_events_enhanced 
        WHERE tenant_id = $1 AND DATE(detected_at) = CURRENT_DATE`,
        [tenantId]
      ),
      database.queryOne(
        `SELECT COUNT(*) as count FROM threat_events_enhanced 
        WHERE tenant_id = $1 AND risk_score >= 80`,
        [tenantId]
      ),
      database.queryOne(
        `SELECT COUNT(DISTINCT source_ip) as count FROM threat_events_enhanced 
        WHERE tenant_id = $1`,
        [tenantId]
      ),
      database.queryOne(
        `SELECT event_type, COUNT(*) as count FROM threat_events_enhanced 
        WHERE tenant_id = $1 
        GROUP BY event_type 
        ORDER BY count DESC 
        LIMIT 1`,
        [tenantId]
      ),
      database.queryOne(
        `SELECT 
          COUNT(*) FILTER (WHERE blocked = true)::float / NULLIF(COUNT(*), 0)::float * 100 as rate
        FROM threat_events_enhanced 
        WHERE tenant_id = $1`,
        [tenantId]
      ),
    ]);

    const stats = {
      totalThreats: parseInt(totalQuery?.count || '0'),
      blockedToday: parseInt(todayQuery?.count || '0'),
      criticalThreats: parseInt(criticalQuery?.count || '0'),
      uniqueIPs: parseInt(uniqueIPsQuery?.count || '0'),
      topAttackType: topTypeQuery?.event_type || 'None',
      blockRate: Math.round(parseFloat(blockRateQuery?.rate || '0')),
    };

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error fetching threat stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
