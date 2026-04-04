import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const policyType = searchParams.get('type');
    const status = searchParams.get('status');

    let query = `
      SELECT *
      FROM compliance_policies
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (policyType && policyType !== 'all') {
      query += ` AND policy_type = $${paramIndex}`;
      params.push(policyType);
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY name ASC`;

    const policies = await database.queryMany(query, params);

    // Get stats
    let stats: any;
    try {
      stats = await database.queryOne(`
        SELECT
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE is_active = false) as draft,
          0 as expired,
          0 as needs_review,
          COUNT(*) as total
        FROM compliance_policies
        WHERE tenant_id = $1
      `, [tenantId]);
    } catch { stats = { active: '0', draft: '0', expired: '0', needs_review: '0', total: '0' }; }

    // Get policy types breakdown
    const typeBreakdown = await database.queryMany(`
      SELECT policy_type, COUNT(*) as count
      FROM compliance_policies
      WHERE tenant_id = $1
      GROUP BY policy_type
      ORDER BY count DESC
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      policies,
      stats: {
        active: parseInt(stats?.active || '0'),
        draft: parseInt(stats?.draft || '0'),
        expired: parseInt(stats?.expired || '0'),
        needsReview: parseInt(stats?.needs_review || '0'),
        total: parseInt(stats?.total || '0'),
      },
      typeBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching policies:', error);
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
      INSERT INTO compliance_policies (
        tenant_id, name, policy_type, description,
        rules, is_active, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7
      )
      RETURNING *
    `, [
      tenantId,
      body.policyName || body.name,
      body.policyType || 'general',
      body.description || '',
      JSON.stringify(body.rules || {}),
      body.isActive !== false,
      body.createdBy || 'system',
    ]);

    return NextResponse.json({ success: true, policy: result });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
