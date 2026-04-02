import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const controlId = searchParams.get('controlId');
    const frameworkId = searchParams.get('frameworkId');

    let query = `
      SELECT 
        id,
        control_id as "controlId",
        framework_id as "frameworkId",
        evidence_type as "evidenceType",
        title,
        description,
        source_type as "sourceType",
        source_name as "sourceName",
        source_integration as "sourceIntegration",
        file_url as "fileUrl",
        file_name as "fileName",
        automated,
        freshness_status as "freshnessStatus",
        collected_at as "collectedAt",
        expires_at as "expiresAt",
        validated,
        validated_by as "validatedBy",
        validated_at as "validatedAt",
        metadata,
        tags,
        created_at as "createdAt"
      FROM compliance_evidence_enhanced
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (controlId) {
      query += ` AND control_id = $${paramIndex}`;
      params.push(controlId);
      paramIndex++;
    }

    if (frameworkId) {
      query += ` AND framework_id = $${paramIndex}`;
      params.push(frameworkId);
      paramIndex++;
    }

    query += ` ORDER BY collected_at DESC`;

    const evidence = await database.queryMany(query, params);

    const stats = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE freshness_status = 'fresh') as fresh,
        COUNT(*) FILTER (WHERE freshness_status = 'stale') as stale,
        COUNT(*) FILTER (WHERE freshness_status = 'missing') as missing,
        COUNT(*) FILTER (WHERE automated = true) as automated,
        COUNT(*) as total
      FROM compliance_evidence_enhanced
      WHERE tenant_id = $1
      ${controlId ? `AND control_id = ${controlId}` : ''}
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      evidence,
      stats: {
        fresh: parseInt(stats?.fresh || '0'),
        stale: parseInt(stats?.stale || '0'),
        missing: parseInt(stats?.missing || '0'),
        automated: parseInt(stats?.automated || '0'),
        total: parseInt(stats?.total || '0'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching evidence:', error);
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
      controlId,
      frameworkId,
      evidenceType,
      title,
      description,
      sourceType,
      sourceName,
      sourceIntegration,
      fileUrl,
      fileName,
      fileSize,
      fileHash,
      automated,
      freshnessDays,
      metadata,
      tags,
      createdBy,
    } = body;

    const expiresAt = freshnessDays 
      ? `NOW() + INTERVAL '${parseInt(freshnessDays)} days'`
      : `NOW() + INTERVAL '90 days'`;

    const result = await database.queryOne(`
      INSERT INTO compliance_evidence_enhanced (
        tenant_id, control_id, framework_id, evidence_type, title, description,
        source_type, source_name, source_integration,
        file_url, file_name, file_size, file_hash,
        automated, freshness_status, freshness_days, expires_at,
        metadata, tags, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'fresh', $15, ${expiresAt}, $16, $17, $18
      )
      RETURNING *
    `, [
      tenantId, controlId, frameworkId, evidenceType, title, description,
      sourceType || 'manual', sourceName, sourceIntegration,
      fileUrl, fileName, fileSize, fileHash,
      automated || false, freshnessDays || 90,
      JSON.stringify(metadata || {}), JSON.stringify(tags || []), createdBy
    ]);

    return NextResponse.json({ success: true, evidence: result });
  } catch (error: any) {
    console.error('Error creating evidence:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
