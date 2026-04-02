import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  
  if (!tenantId) {
    return NextResponse.json(
      { success: false, error: 'Tenant ID required' },
      { status: 401 }
    );
  }

  try {
    // Get current security score
    const currentQuery = await database.queryOne(
      `SELECT 
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE severity = 'high') as high_count,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium_count,
        COUNT(*) FILTER (WHERE severity = 'low') as low_count
      FROM vulnerabilities 
      WHERE tenant_id = $1
      AND status = 'open'`,
      [tenantId]
    );

    const vulns = currentQuery || {};
    const currentScore = Math.max(0, Math.min(100,
      100 
      - (parseInt(vulns.critical_count) || 0) * 10
      - (parseInt(vulns.high_count) || 0) * 5
      - (parseInt(vulns.medium_count) || 0) * 2
      - (parseInt(vulns.low_count) || 0) * 0.5
    ));

    // Calculate trend from historical data
    const trendQuery = await database.queryMany(
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM vulnerabilities
      WHERE tenant_id = $1
      AND created_at > NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7`,
      [tenantId]
    );

    const recentVulnCounts = trendQuery.map((r: any) => parseInt(r.count));
    const avgDailyVulns = recentVulnCounts.length > 0 
      ? recentVulnCounts.reduce((a, b) => a + b, 0) / recentVulnCounts.length 
      : 0;

    const totalCurrentVulns = (parseInt(vulns.critical_count) || 0) + 
                              (parseInt(vulns.high_count) || 0) + 
                              (parseInt(vulns.medium_count) || 0) + 
                              (parseInt(vulns.low_count) || 0);
    
    const predictedVulnCount = Math.round(totalCurrentVulns + (avgDailyVulns * 7));
    const predictedScore = Math.max(0, Math.min(100, 100 - (predictedVulnCount * 3)));

    let scoreTrend: 'up' | 'down' | 'stable';
    const scoreDiff = predictedScore - currentScore;
    if (scoreDiff > 2) scoreTrend = 'up';
    else if (scoreDiff < -2) scoreTrend = 'down';
    else scoreTrend = 'stable';

    let vulnTrend: 'up' | 'down' | 'stable';
    const vulnDiff = predictedVulnCount - totalCurrentVulns;
    if (vulnDiff > 3) vulnTrend = 'up';
    else if (vulnDiff < -3) vulnTrend = 'down';
    else vulnTrend = 'stable';

    const confidence = Math.min(95, 60 + (recentVulnCounts.length * 5));

    const forecast = {
      securityScore: {
        current: Math.round(currentScore),
        predicted: Math.round(predictedScore),
        confidence,
        trend: scoreTrend,
      },
      vulnerabilities: {
        current: totalCurrentVulns,
        predicted: predictedVulnCount,
        confidence,
        trend: vulnTrend,
      },
    };

    return NextResponse.json({
      success: true,
      forecast,
    });
  } catch (error) {
    console.error('Error generating security forecast:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}
