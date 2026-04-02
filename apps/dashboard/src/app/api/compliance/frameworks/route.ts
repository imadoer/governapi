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

    // Get all frameworks with their latest assessment results for this tenant
    const frameworks = await database.queryMany(
      `SELECT DISTINCT ON (cf.id)
        cf.id,
        cf.framework_name as name,
        cf.description,
        cf.version,
        cf.category,
        COALESCE(ccr.compliance_percentage, 0) as score,
        ccr.last_assessment as "lastAssessed",
        ccr.next_assessment as "nextAssessment",
        ccr.status,
        (SELECT COUNT(*) FROM compliance_controls WHERE framework_id = cf.id) as total_controls,
        (SELECT COUNT(*) FROM compliance_check_results 
         WHERE framework_id = cf.id AND tenant_id = $1 AND status = 'passed') as passed_controls,
        (SELECT COUNT(*) FROM compliance_check_results 
         WHERE framework_id = cf.id AND tenant_id = $1 AND status = 'failed') as failed_controls,
        (SELECT COUNT(*) FROM compliance_findings 
         WHERE framework_name = cf.framework_name AND tenant_id = $1 AND status = 'open') as pending_controls
      FROM compliance_frameworks cf
      LEFT JOIN compliance_check_results ccr ON cf.id = ccr.framework_id AND ccr.tenant_id = $1
      ORDER BY cf.id, ccr.last_assessment DESC NULLS LAST`,
      [tenantId]
    );

    const formattedFrameworks = frameworks.map((fw: any) => {
      const score = fw.score ? Math.round(parseFloat(fw.score)) : 0;
      let status: 'compliant' | 'partial' | 'non-compliant' = 'non-compliant';
      if (score >= 90) status = 'compliant';
      else if (score >= 70) status = 'partial';

      return {
        id: fw.id.toString(),
        name: fw.name,
        description: fw.description,
        score,
        totalControls: parseInt(fw.total_controls || '0'),
        passedControls: parseInt(fw.passed_controls || '0'),
        failedControls: parseInt(fw.failed_controls || '0'),
        pendingControls: parseInt(fw.pending_controls || '0'),
        status,
        lastAssessed: fw.lastAssessed || new Date().toISOString(),
        nextAssessment: fw.nextAssessment || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        category: fw.category
      };
    });

    // Sort by name after deduplication
    formattedFrameworks.sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      frameworks: formattedFrameworks,
    });
  } catch (error) {
    console.error('Error fetching frameworks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch frameworks' },
      { status: 500 }
    );
  }
}
