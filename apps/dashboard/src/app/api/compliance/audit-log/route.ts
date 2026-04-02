import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../infrastructure/database';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('eventType');
    const entityType = searchParams.get('entityType');
    const actorId = searchParams.get('actorId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = `
      SELECT *
      FROM compliance_audit_log
      WHERE tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (eventType) {
      query += ` AND event_type = $${paramIndex}`;
      params.push(eventType);
      paramIndex++;
    }

    if (entityType) {
      query += ` AND entity_type = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }

    if (actorId) {
      query += ` AND actor_id = $${paramIndex}`;
      params.push(actorId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const logs = await database.queryMany(query, params);

    // Get total count
    const countResult = await database.queryOne(`
      SELECT COUNT(*) as total
      FROM compliance_audit_log
      WHERE tenant_id = $1
    `, [tenantId]);

    // Get event type breakdown
    const eventTypes = await database.queryMany(`
      SELECT event_type, COUNT(*) as count
      FROM compliance_audit_log
      WHERE tenant_id = $1
      GROUP BY event_type
      ORDER BY count DESC
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total: parseInt(countResult?.total || '0'),
        limit,
        offset,
      },
      eventTypes,
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
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
      eventType,
      eventCategory,
      entityType,
      entityId,
      action,
      actorId,
      actorName,
      actorEmail,
      actorIp,
      oldValue,
      newValue,
      metadata,
    } = body;

    // Generate hash for integrity
    const crypto = require('crypto');
    const eventData = JSON.stringify({ eventType, entityType, entityId, action, actorId, newValue });
    const eventHash = crypto.createHash('sha256').update(eventData).digest('hex');

    // Get previous hash for chain
    const lastLog = await database.queryOne(`
      SELECT event_hash FROM compliance_audit_log
      WHERE tenant_id = $1
      ORDER BY id DESC LIMIT 1
    `, [tenantId]);

    const result = await database.queryOne(`
      INSERT INTO compliance_audit_log (
        tenant_id, event_type, event_category, entity_type, entity_id,
        action, actor_id, actor_name, actor_email, actor_ip,
        old_value, new_value, metadata, event_hash, previous_hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      tenantId, eventType, eventCategory, entityType, entityId,
      action, actorId, actorName, actorEmail, actorIp,
      oldValue ? JSON.stringify(oldValue) : null,
      newValue ? JSON.stringify(newValue) : null,
      JSON.stringify(metadata || {}),
      eventHash,
      lastLog?.event_hash || null
    ]);

    return NextResponse.json({ success: true, log: result });
  } catch (error: any) {
    console.error('Error creating audit log:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
