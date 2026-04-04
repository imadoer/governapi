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

    // Get all frameworks with pre-aggregated counts (no correlated subqueries)
    const frameworks = await database.queryMany(
      `SELECT
        fw.id,
        fw.framework_name as name,
        fw.description,
        fw.version,
        fw.category,
        COALESCE(latest.compliance_percentage, 0) as score,
        latest.last_assessment as "lastAssessed",
        latest.next_assessment as "nextAssessment",
        latest.status,
        COALESCE(ctrl.total, 0) as total_controls,
        COALESCE(cr.passed, 0) as passed_controls,
        COALESCE(cr.failed, 0) as failed_controls,
        COALESCE(fn.open_count, 0) as pending_controls
      FROM compliance_frameworks fw
      LEFT JOIN LATERAL (
        SELECT compliance_percentage, last_assessment, next_assessment, status
        FROM compliance_check_results
        WHERE framework_id = fw.id AND tenant_id = $1
        ORDER BY last_assessment DESC NULLS LAST
        LIMIT 1
      ) latest ON true
      LEFT JOIN (
        SELECT framework_id, COUNT(*) as total
        FROM compliance_controls
        GROUP BY framework_id
      ) ctrl ON ctrl.framework_id = fw.id
      LEFT JOIN (
        SELECT framework_id,
          COUNT(*) FILTER (WHERE status = 'passed') as passed,
          COUNT(*) FILTER (WHERE status = 'failed') as failed
        FROM compliance_check_results
        WHERE tenant_id = $1
        GROUP BY framework_id
      ) cr ON cr.framework_id = fw.id
      LEFT JOIN (
        SELECT framework_name, COUNT(*) as open_count
        FROM compliance_findings
        WHERE tenant_id = $1 AND status = 'open'
        GROUP BY framework_name
      ) fn ON fn.framework_name = fw.framework_name
      ORDER BY fw.framework_name`,
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
