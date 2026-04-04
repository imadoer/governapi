import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const riskLevel = searchParams.get('riskTier') || searchParams.get('riskLevel');
    const status = searchParams.get('status');

    let query = `SELECT * FROM compliance_vendors WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let idx = 2;

    if (riskLevel && riskLevel !== 'all') {
      query += ` AND risk_level = $${idx}`;
      params.push(riskLevel);
      idx++;
    }
    if (status && status !== 'all') {
      query += ` AND status = $${idx}`;
      params.push(status);
      idx++;
    }

    query += ` ORDER BY name ASC`;
    const vendors = await database.queryMany(query, params);

    const stats = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE risk_level = 'critical') as critical,
        COUNT(*) FILTER (WHERE risk_level = 'high') as high,
        COUNT(*) FILTER (WHERE risk_level = 'medium') as medium,
        COUNT(*) FILTER (WHERE risk_level = 'low') as low,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) as total
      FROM compliance_vendors WHERE tenant_id = $1
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      vendors,
      stats: {
        critical: parseInt(stats?.critical || '0'),
        high: parseInt(stats?.high || '0'),
        medium: parseInt(stats?.medium || '0'),
        low: parseInt(stats?.low || '0'),
        overdueAssessments: 0,
        active: parseInt(stats?.active || '0'),
        total: parseInt(stats?.total || '0'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching vendors:', error);
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
      INSERT INTO compliance_vendors (tenant_id, name, category, risk_level, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      tenantId,
      body.vendorName || body.name,
      body.category || body.vendorType || 'other',
      body.riskLevel || body.riskTier || 'medium',
      'active',
    ]);

    return NextResponse.json({ success: true, vendor: result });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
