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

    // Get frameworks with gaps (< 80% compliance)
    const gaps = await database.queryMany(
      `SELECT 
        cf.id as framework_id,
        cf.framework_name as framework,
        ccr.compliance_percentage,
        (SELECT COUNT(*) FROM compliance_controls cc WHERE cc.framework_id = cf.id) as total_controls,
        (SELECT COUNT(*) FROM compliance_check_results 
         WHERE framework_id = cf.id AND tenant_id = $1 AND status = 'failed') as failed_controls,
        (SELECT COUNT(*) FROM compliance_findings 
         WHERE framework_name = cf.framework_name AND tenant_id = $1 AND status = 'open') as missing_controls
      FROM compliance_frameworks cf
      LEFT JOIN compliance_check_results ccr ON cf.id = ccr.framework_id AND ccr.tenant_id = $1
      WHERE ccr.compliance_percentage < 80 OR ccr.compliance_percentage IS NULL
      ORDER BY ccr.compliance_percentage ASC NULLS LAST`,
      [tenantId]
    );

    const formattedGaps = gaps.map((gap: any) => {
      const score = gap.compliance_percentage ? parseFloat(gap.compliance_percentage) : 0;
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'medium';
      
      if (score < 50) priority = 'critical';
      else if (score < 70) priority = 'high';
      else priority = 'medium';

      const missingControls = parseInt(gap.missing_controls || '0');
      const failedControls = parseInt(gap.failed_controls || '0');

      return {
        frameworkId: gap.framework_id.toString(),
        framework: gap.framework,
        missingControls,
        failedControls,
        priority,
        estimatedEffort: missingControls > 20 ? '3-6 months' : missingControls > 10 ? '1-3 months' : '2-4 weeks',
        recommendations: [
          `Address ${failedControls} failing control${failedControls !== 1 ? 's' : ''}`,
          `Implement ${missingControls} missing control${missingControls !== 1 ? 's' : ''}`,
          `Target ${Math.min(90, score + 20)}% compliance in next assessment`,
        ],
      };
    });

    return NextResponse.json({
      success: true,
      gaps: formattedGaps,
    });
  } catch (error) {
    console.error('Error fetching gaps:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch gaps' },
      { status: 500 }
    );
  }
}
