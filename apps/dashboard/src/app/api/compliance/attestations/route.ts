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
    const frameworkId = searchParams.get('frameworkId');

    let query = `
      SELECT 
        ca.*,
        cf.framework_name,
        cc.control_id as control_code,
        cc.control_name
      FROM compliance_attestations ca
      LEFT JOIN compliance_frameworks cf ON ca.framework_id = cf.id
      LEFT JOIN compliance_controls cc ON ca.control_id = cc.id
      WHERE ca.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND ca.attestation_status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (frameworkId) {
      query += ` AND ca.framework_id = $${paramIndex}`;
      params.push(frameworkId);
      paramIndex++;
    }

    query += ` ORDER BY ca.due_date ASC`;

    const attestations = await database.queryMany(query, params);

    // Get summary stats
    const stats = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE attestation_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE attestation_status = 'attested') as attested,
        COUNT(*) FILTER (WHERE attestation_status = 'overdue') as overdue,
        COUNT(*) FILTER (WHERE attestation_status = 'expired') as expired,
        COUNT(*) as total
      FROM compliance_attestations
      WHERE tenant_id = $1
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      attestations,
      stats: {
        pending: parseInt(stats?.pending || '0'),
        attested: parseInt(stats?.attested || '0'),
        overdue: parseInt(stats?.overdue || '0'),
        expired: parseInt(stats?.expired || '0'),
        total: parseInt(stats?.total || '0'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching attestations:', error);
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
    const {
      frameworkId,
      controlId,
      attestationType,
      controlOwnerId,
      controlOwnerName,
      controlOwnerEmail,
      dueDate,
      createdBy,
    } = body;

    const result = await database.queryOne(`
      INSERT INTO compliance_attestations (
        tenant_id, framework_id, control_id, attestation_type,
        control_owner_id, control_owner_name, control_owner_email,
        due_date, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      tenantId, frameworkId, controlId, attestationType || 'quarterly',
      controlOwnerId, controlOwnerName, controlOwnerEmail,
      dueDate, createdBy
    ]);

    return NextResponse.json({ success: true, attestation: result });
  } catch (error: any) {
    console.error('Error creating attestation:', error);
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
    const {
      id,
      attestationStatus,
      attestationStatement,
      evidenceReviewed,
      comments,
    } = body;

    const attestedAt = attestationStatus === 'attested' ? 'NOW()' : 'NULL';
    const expiresAt = attestationStatus === 'attested' 
      ? "NOW() + INTERVAL '90 days'" 
      : 'NULL';

    const result = await database.queryOne(`
      UPDATE compliance_attestations
      SET 
        attestation_status = $2,
        attestation_statement = $3,
        evidence_reviewed = $4,
        comments = $5,
        attested_at = ${attestedAt},
        expires_at = ${expiresAt},
        updated_at = NOW()
      WHERE id = $1 AND tenant_id = $6
      RETURNING *
    `, [id, attestationStatus, attestationStatement, JSON.stringify(evidenceReviewed || []), comments, tenantId]);

    // Log to audit trail
    await database.query(`
      INSERT INTO compliance_audit_log (
        tenant_id, event_type, event_category, entity_type, entity_id,
        action, actor_id, actor_name, new_value
      ) VALUES ($1, 'attestation_update', 'compliance', 'attestation', $2, $3, $4, $5, $6)
    `, [tenantId, id, attestationStatus, body.actorId || 'system', body.actorName || 'System', JSON.stringify(body)]);

    return NextResponse.json({ success: true, attestation: result });
  } catch (error: any) {
    console.error('Error updating attestation:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
