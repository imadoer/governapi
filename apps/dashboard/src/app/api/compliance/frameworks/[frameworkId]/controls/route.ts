import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../../../infrastructure/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ frameworkId: string }> }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { frameworkId } = await params;

    const controls = await database.queryMany(`
      SELECT 
        cc.id,
        cc.framework_id as "frameworkId",
        cc.control_id as "controlId",
        cc.control_name as "controlName",
        cc.description,
        cc.category,
        cc.risk_level as "riskLevel",
        cc.testing_frequency as "testingFrequency",
        COALESCE(ccr.status, 'pending') as status,
        ccr.last_assessment as "lastTested",
        ccr.assessed_by as owner,
        (
          SELECT COUNT(*) 
          FROM compliance_evidence_enhanced cee 
          WHERE cee.control_id = cc.id AND cee.tenant_id = $1
        ) as "evidenceCount",
        (
          SELECT 
            CASE 
              WHEN COUNT(*) = 0 THEN 'missing'
              WHEN COUNT(*) FILTER (WHERE freshness_status = 'fresh') = COUNT(*) THEN 'fresh'
              WHEN COUNT(*) FILTER (WHERE freshness_status = 'stale') > 0 THEN 'stale'
              ELSE 'missing'
            END
          FROM compliance_evidence_enhanced cee 
          WHERE cee.control_id = cc.id AND cee.tenant_id = $1
        ) as "evidenceFreshness",
        CASE WHEN cc.control_id LIKE '%AUTO%' OR cc.category IN ('Technical', 'Security') THEN true ELSE false END as automatable
      FROM compliance_controls cc
      LEFT JOIN compliance_check_results ccr ON cc.id = ccr.control_id AND ccr.tenant_id = $1
      WHERE cc.framework_id = $2
      ORDER BY cc.control_id
    `, [tenantId, frameworkId]);

    return NextResponse.json({
      success: true,
      controls,
      frameworkId,
    });
  } catch (error: any) {
    console.error('Error fetching controls:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
