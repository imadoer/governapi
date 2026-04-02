import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const riskTier = searchParams.get('riskTier');
    const status = searchParams.get('status');

    let query = `
      SELECT 
        cv.*,
        (
          SELECT COUNT(*) 
          FROM compliance_vendor_assessments cva 
          WHERE cva.vendor_id = cv.id
        ) as assessment_count,
        (
          SELECT cva.risk_score 
          FROM compliance_vendor_assessments cva 
          WHERE cva.vendor_id = cv.id 
          ORDER BY cva.assessment_date DESC 
          LIMIT 1
        ) as latest_assessment_score
      FROM compliance_vendors cv
      WHERE cv.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (riskTier && riskTier !== 'all') {
      query += ` AND cv.risk_tier = $${paramIndex}`;
      params.push(riskTier);
      paramIndex++;
    }

    if (status && status !== 'all') {
      query += ` AND cv.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY 
      CASE cv.risk_tier 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      cv.risk_score DESC`;

    const vendors = await database.queryMany(query, params);

    // Get stats
    const stats = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE risk_tier = 'critical') as critical,
        COUNT(*) FILTER (WHERE risk_tier = 'high') as high,
        COUNT(*) FILTER (WHERE risk_tier = 'medium') as medium,
        COUNT(*) FILTER (WHERE risk_tier = 'low') as low,
        COUNT(*) FILTER (WHERE next_assessment_date < NOW()) as overdue_assessments,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) as total
      FROM compliance_vendors
      WHERE tenant_id = $1
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      vendors,
      stats: {
        critical: parseInt(stats?.critical || '0'),
        high: parseInt(stats?.high || '0'),
        medium: parseInt(stats?.medium || '0'),
        low: parseInt(stats?.low || '0'),
        overdueAssessments: parseInt(stats?.overdue_assessments || '0'),
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
      INSERT INTO compliance_vendors (
        tenant_id, vendor_name, vendor_type, description,
        contact_name, contact_email, contact_phone, website,
        risk_tier, risk_score, data_shared, data_classification,
        integration_type, api_endpoints,
        contract_start_date, contract_end_date, contract_value,
        soc2_certified, iso27001_certified, hipaa_compliant, pci_compliant, gdpr_compliant,
        assessment_frequency_days, next_assessment_date,
        status, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23,
        NOW() + INTERVAL '1 year', 'active', $24
      )
      RETURNING *
    `, [
      tenantId,
      body.vendorName,
      body.vendorType,
      body.description,
      body.contactName,
      body.contactEmail,
      body.contactPhone,
      body.website,
      body.riskTier || 'medium',
      body.riskScore || 50,
      JSON.stringify(body.dataShared || []),
      body.dataClassification,
      body.integrationType,
      JSON.stringify(body.apiEndpoints || []),
      body.contractStartDate,
      body.contractEndDate,
      body.contractValue,
      body.soc2Certified || false,
      body.iso27001Certified || false,
      body.hipaaCompliant || false,
      body.pciCompliant || false,
      body.gdprCompliant || false,
      body.assessmentFrequencyDays || 365,
      body.createdBy
    ]);

    return NextResponse.json({ success: true, vendor: result });
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
