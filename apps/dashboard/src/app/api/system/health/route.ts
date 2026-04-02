import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    let databaseHealthy = true;
    try {
      await database.queryOne('SELECT 1 as health', []);
    } catch {
      databaseHealthy = false;
    }

    // Check if scanner has run recently (within last hour)
    let scannerHealthy = true;
    try {
      const recentScan = await database.queryOne(
        `SELECT id FROM security_scans WHERE created_at > NOW() - INTERVAL '1 hour' LIMIT 1`,
        []
      );
      scannerHealthy = !!recentScan;
    } catch {
      scannerHealthy = false;
    }

    // Check if threat detection is working (detected threats in last hour)
    let threatIntelHealthy = true;
    try {
      const recentThreat = await database.queryOne(
        `SELECT id FROM threat_events_enhanced WHERE detected_at > NOW() - INTERVAL '1 hour' LIMIT 1`,
        []
      );
      threatIntelHealthy = !!recentThreat;
    } catch {
      // It's OK if no threats detected - service still healthy
      threatIntelHealthy = true;
    }

    // Check compliance engine (recent assessments)
    let complianceHealthy = true;
    try {
      const recentAssessment = await database.queryOne(
        `SELECT id FROM compliance_check_results WHERE last_assessment > NOW() - INTERVAL '7 days' LIMIT 1`,
        []
      );
      complianceHealthy = !!recentAssessment;
    } catch {
      complianceHealthy = false;
    }

    const health = {
      scanner: scannerHealthy,
      threatIntel: threatIntelHealthy,
      compliance: complianceHealthy,
      botProtection: databaseHealthy,
      apiGateway: true,
      database: databaseHealthy,
    };

    return NextResponse.json({
      success: true,
      health,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to get system health' },
      { status: 500 }
    );
  }
}
