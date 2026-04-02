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
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');

    let query = `
      SELECT 
        crt.*,
        cf.framework_name,
        cfi.control_name as finding_control,
        cfi.severity as finding_severity
      FROM compliance_remediation_tasks crt
      LEFT JOIN compliance_frameworks cf ON crt.framework_id = cf.id
      LEFT JOIN compliance_findings cfi ON crt.finding_id = cfi.id
      WHERE crt.tenant_id = $1
    `;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status && status !== 'all') {
      query += ` AND crt.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (priority && priority !== 'all') {
      query += ` AND crt.priority = $${paramIndex}`;
      params.push(priority);
      paramIndex++;
    }

    if (assignedTo) {
      query += ` AND crt.assigned_to = $${paramIndex}`;
      params.push(assignedTo);
      paramIndex++;
    }

    query += ` ORDER BY 
      CASE crt.priority 
        WHEN 'critical' THEN 1 
        WHEN 'high' THEN 2 
        WHEN 'medium' THEN 3 
        WHEN 'low' THEN 4 
      END,
      crt.sla_deadline ASC NULLS LAST`;

    const tasks = await database.queryMany(query, params);

    // Check for SLA breaches
    await database.query(`
      UPDATE compliance_remediation_tasks
      SET sla_breached = true, updated_at = NOW()
      WHERE tenant_id = $1 
        AND sla_deadline < NOW()
        AND status NOT IN ('completed', 'cancelled', 'closed')
        AND sla_breached = false
    `, [tenantId]);

    // Get stats
    const stats = await database.queryOne(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') as open,
        COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'blocked') as blocked,
        COUNT(*) FILTER (WHERE sla_breached = true AND status NOT IN ('completed', 'cancelled')) as sla_breached,
        COUNT(*) FILTER (WHERE priority = 'critical' AND status NOT IN ('completed', 'cancelled')) as critical_open,
        COUNT(*) as total
      FROM compliance_remediation_tasks
      WHERE tenant_id = $1
    `, [tenantId]);

    return NextResponse.json({
      success: true,
      tasks,
      stats: {
        open: parseInt(stats?.open || '0'),
        inProgress: parseInt(stats?.in_progress || '0'),
        completed: parseInt(stats?.completed || '0'),
        blocked: parseInt(stats?.blocked || '0'),
        slaBreached: parseInt(stats?.sla_breached || '0'),
        criticalOpen: parseInt(stats?.critical_open || '0'),
        total: parseInt(stats?.total || '0'),
      },
    });
  } catch (error: any) {
    console.error('Error fetching remediation tasks:', error);
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
      findingId,
      controlId,
      frameworkId,
      violationId,
      title,
      description,
      remediationSteps,
      priority,
      severity,
      assignedTo,
      assignedToName,
      assignedToEmail,
      escalationContact,
      slaHours,
      dueDate,
      externalTicketId,
      externalTicketUrl,
      externalSystem,
      createdBy,
    } = body;

    const slaDeadline = slaHours 
      ? `NOW() + INTERVAL '${parseInt(slaHours)} hours'`
      : 'NULL';

    const result = await database.queryOne(`
      INSERT INTO compliance_remediation_tasks (
        tenant_id, finding_id, control_id, framework_id, violation_id,
        title, description, remediation_steps, priority, severity,
        assigned_to, assigned_to_name, assigned_to_email, escalation_contact,
        sla_hours, sla_deadline, due_date,
        external_ticket_id, external_ticket_url, external_system,
        created_by, status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, ${slaDeadline}, $16, $17, $18, $19, $20, 'open'
      )
      RETURNING *
    `, [
      tenantId, findingId, controlId, frameworkId, violationId,
      title, description, remediationSteps, priority || 'medium', severity || 'medium',
      assignedTo, assignedToName, assignedToEmail, escalationContact,
      slaHours || 72, dueDate,
      externalTicketId, externalTicketUrl, externalSystem,
      createdBy
    ]);

    return NextResponse.json({ success: true, task: result });
  } catch (error: any) {
    console.error('Error creating remediation task:', error);
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
    const { id, ...updates } = body;

    const setClauses: string[] = ['updated_at = NOW()'];
    const params: any[] = [id, tenantId];
    let paramIndex = 3;

    const allowedFields = [
      'status', 'priority', 'assigned_to', 'assigned_to_name', 'assigned_to_email',
      'progress_percentage', 'verification_notes', 'verified_by', 'resolution_notes'
    ];

    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(snakeKey)) {
        setClauses.push(`${snakeKey} = $${paramIndex}`);
        params.push(value);
        paramIndex++;
      }
    }

    // Handle status transitions
    if (updates.status === 'in_progress' && !updates.startedAt) {
      setClauses.push('started_at = NOW()');
    }
    if (updates.status === 'completed') {
      setClauses.push('completed_at = NOW()');
    }
    if (updates.verifiedBy) {
      setClauses.push('verified_at = NOW()');
    }

    const result = await database.queryOne(`
      UPDATE compliance_remediation_tasks
      SET ${setClauses.join(', ')}
      WHERE id = $1 AND tenant_id = $2
      RETURNING *
    `, params);

    return NextResponse.json({ success: true, task: result });
  } catch (error: any) {
    console.error('Error updating remediation task:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
