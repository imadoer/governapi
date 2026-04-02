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

    query += ` ORDER BY policy_name ASC`;

    const policies = await database.queryMany(query, params);

    // Get stats
    const stats = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'draft') as draft,
        COUNT(*) FILTER (WHERE status = 'expired' OR expiration_date < NOW()) as expired,
        COUNT(*) FILTER (WHERE review_date < NOW() AND status = 'active') as needs_review,
        COUNT(*) as total
      FROM compliance_policies
      WHERE tenant_id = $1
    `, [tenantId]);

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
        tenant_id, policy_name, policy_type, description,
        content, content_url, version, status,
        owner_id, owner_name, framework_mappings, control_mappings,
        effective_date, review_date, expiration_date, review_frequency_days,
        acknowledgment_required, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *
    `, [
      tenantId,
      body.policyName,
      body.policyType,
      body.description,
      body.content,
      body.contentUrl,
      body.version || '1.0',
      body.status || 'draft',
      body.ownerId,
      body.ownerName,
      JSON.stringify(body.frameworkMappings || []),
      JSON.stringify(body.controlMappings || []),
      body.effectiveDate,
      body.reviewDate,
      body.expirationDate,
      body.reviewFrequencyDays || 365,
      body.acknowledgmentRequired || false,
      body.createdBy
    ]);

    return NextResponse.json({ success: true, policy: result });
  } catch (error: any) {
    console.error('Error creating policy:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
