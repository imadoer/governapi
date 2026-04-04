import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    let query = `
      SELECT 
        cc.id,
        cc.framework_id as "frameworkId",
        cf.framework_name as "frameworkName",
        cc.control_id as "controlId",
        cc.control_name as "controlName",
        cc.description,
        cc.category,
        cc.risk_level as "riskLevel",
        COALESCE(ccr.status, 'pending') as status,
        ccr.last_assessment as "lastTested",
        ccr.assessed_by as owner,
        0 as "evidenceCount",
        'pending' as "evidenceFreshness"
      FROM compliance_controls cc
      JOIN compliance_frameworks cf ON cc.framework_id = cf.id
      LEFT JOIN compliance_check_results ccr ON cc.id = ccr.control_id AND ccr.tenant_id = $1
      WHERE 1=1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND COALESCE(ccr.status, 'pending') = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (category && category !== 'all') {
      query += ` AND cc.category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY cf.framework_name, cc.control_id`;

    const controls = await database.queryMany(query, params);

    const stats = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE COALESCE(ccr.status, 'pending') = 'passed') as passed,
        COUNT(*) FILTER (WHERE COALESCE(ccr.status, 'pending') = 'failed') as failed,
        COUNT(*) FILTER (WHERE COALESCE(ccr.status, 'pending') = 'pending') as pending,
        COUNT(*) as total
      FROM compliance_controls cc
      LEFT JOIN compliance_check_results ccr ON cc.id = ccr.control_id AND ccr.tenant_id = $1
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      controls,
      stats: {
        passed: parseInt(stats?.passed || '0'),
        failed: parseInt(stats?.failed || '0'),
        pending: parseInt(stats?.pending || '0'),
        total: parseInt(stats?.total || '0'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching controls:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const body = await request.json();
    const { controlId, frameworkId, status, assessedBy, notes } = body;

    const existing = await database.queryOne(`
      SELECT id FROM compliance_check_results
      WHERE tenant_id = $1 AND control_id = $2 AND framework_id = $3
    `, [tenantId, controlId, frameworkId]);

    let result;
    if (existing) {
      result = await database.queryOne(`
        UPDATE compliance_check_results
        SET status = $1, last_assessment = NOW(), assessed_by = $2, notes = $3, updated_at = NOW()
        WHERE tenant_id = $4 AND control_id = $5 AND framework_id = $6
        RETURNING *
      `, [status, assessedBy, notes, tenantId, controlId, frameworkId]);
    } else {
      result = await database.queryOne(`
        INSERT INTO compliance_check_results (tenant_id, control_id, framework_id, status, last_assessment, assessed_by, notes)
        VALUES ($1, $2, $3, $4, NOW(), $5, $6)
        RETURNING *
      `, [tenantId, controlId, frameworkId, status, assessedBy, notes]);
    }

    await database.query(`
      INSERT INTO compliance_audit_log (
        tenant_id, event_type, event_category, entity_type, entity_id,
        action, actor_id, actor_name, new_value
      ) VALUES ($1, 'control_assessment', 'compliance', 'control', $2, $3, $4, $5, $6)
    `, [tenantId, controlId, status, assessedBy || 'system', assessedBy || 'System', JSON.stringify({ status, notes })]);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Error updating control:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
