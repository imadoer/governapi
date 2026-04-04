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
    const severity = searchParams.get('severity');
    const violationType = searchParams.get('type');

    let query = `
      SELECT
        cav.*,
        NULL as remediation_status,
        NULL as remediation_assignee
      FROM compliance_api_violations cav
      WHERE cav.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND cav.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (severity && severity !== 'all') {
      query += ` AND cav.severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (violationType && violationType !== 'all') {
      query += ` AND cav.violation_type = $${paramIndex}`;
      params.push(violationType);
      paramIndex++;
    }

    query += ` ORDER BY
      CASE cav.severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        WHEN 'low' THEN 4
      END,
      cav.created_at DESC`;

    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const violations = await database.queryMany(query, params);

    // Get stats by type
    const stats = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'open') as critical,
        COUNT(*) FILTER (WHERE severity = 'high' AND status = 'open') as high,
        COUNT(*) FILTER (WHERE severity = 'medium' AND status = 'open') as medium,
        COUNT(*) FILTER (WHERE severity = 'low' AND status = 'open') as low,
        COUNT(*) as total
      FROM compliance_api_violations
      WHERE tenant_id = $1
    `, [tenantId]);

    // Get violation types breakdown
    const typeBreakdown = await database.queryMany(`
      SELECT 
        violation_type,
        COUNT(*) as count,
        COUNT(*) FILTER (WHERE status = 'open') as open_count
      FROM compliance_api_violations
      WHERE tenant_id = $1
      GROUP BY violation_type
      ORDER BY count DESC
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      violations,
      stats: {
        open: parseInt(stats?.open || '0'),
        resolved: parseInt(stats?.resolved || '0'),
        bySeverity: {
          critical: parseInt(stats?.critical || '0'),
          high: parseInt(stats?.high || '0'),
          medium: parseInt(stats?.medium || '0'),
          low: parseInt(stats?.low || '0'),
        },
        total: parseInt(stats?.total || '0'),
      },
      typeBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching violations:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const body = await request.json();
    
    const result = await database.queryOne(`
      INSERT INTO compliance_api_violations (
        tenant_id, endpoint_id, endpoint_path, endpoint_method,
        violation_type, violation_category, title, description,
        severity, risk_score, detection_source, auto_detected, evidence
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `, [
      tenantId,
      body.endpointId,
      body.endpointPath,
      body.endpointMethod,
      body.violationType,
      body.violationCategory,
      body.title,
      body.description,
      body.severity || 'medium',
      body.riskScore || 50,
      body.detectionSource || 'manual',
      body.autoDetected || false,
      JSON.stringify(body.evidence || {})
    ]);

    return NextResponse.json({ success: true, violation: result });
  } catch (error: any) {
    console.error('Error creating violation:', error);
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
    const { id, status, resolvedBy, resolutionNotes, remediationTaskId } = body;

    const result = await database.queryOne(`
      UPDATE compliance_api_violations
      SET 
        status = $2,
        resolved_by = $3,
        resolution_notes = $4,
        remediation_task_id = $5,
        resolved_at = CASE WHEN $2 = 'resolved' THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $6
      RETURNING *
    `, [id, status, resolvedBy, resolutionNotes, remediationTaskId, tenantId]);

    return NextResponse.json({ success: true, violation: result });
  } catch (error: any) {
    console.error('Error updating violation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
