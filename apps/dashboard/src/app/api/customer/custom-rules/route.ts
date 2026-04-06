import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const customRules = await database.queryMany(
      `SELECT id, name, rule_type, description, priority, action, conditions,
              is_active, triggered_count, last_triggered_at, created_at, updated_at
       FROM custom_rules
       WHERE tenant_id = $1
       ORDER BY created_at DESC`,
      [tenantId],
    );

    // Get recent triggers per policy
    const triggers = await database.queryMany(
      `SELECT policy_id, endpoint_url, details, action_taken, triggered_at
       FROM policy_triggers
       WHERE tenant_id = $1
       ORDER BY triggered_at DESC
       LIMIT 50`,
      [tenantId],
    );

    const triggersByPolicy: Record<number, any[]> = {};
    for (const t of triggers) {
      const pid = t.policy_id;
      if (!triggersByPolicy[pid]) triggersByPolicy[pid] = [];
      triggersByPolicy[pid].push({
        endpointUrl: t.endpoint_url,
        details: t.details,
        actionTaken: t.action_taken,
        triggeredAt: t.triggered_at,
      });
    }

    const formattedRules = customRules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      ruleType: rule.rule_type,
      description: rule.description,
      priority: rule.priority,
      action: rule.action,
      conditions:
        typeof rule.conditions === "string"
          ? JSON.parse(rule.conditions)
          : rule.conditions,
      isActive: rule.is_active,
      triggeredCount: rule.triggered_count || 0,
      lastTriggeredAt: rule.last_triggered_at,
      createdAt: rule.created_at,
      updatedAt: rule.updated_at,
      recentTriggers: triggersByPolicy[rule.id] || [],
    }));

    return NextResponse.json({
      success: true,
      rules: formattedRules,
    });
  } catch (error) {
    logger.error("Custom rules API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to get custom rules" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { name, ruleType, description, action, conditions } = await request.json();

    if (!name || !ruleType) {
      return NextResponse.json({ error: "Name and rule type are required" }, { status: 400 });
    }

    const newRule = await database.queryOne(
      `INSERT INTO custom_rules (tenant_id, name, rule_type, description, action, conditions, is_active, triggered_count, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, 0, NOW())
       RETURNING *`,
      [
        tenantId,
        name,
        ruleType,
        description || "",
        action || "notify",
        JSON.stringify(conditions || {}),
      ],
    );

    if (!newRule) {
      return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      rule: {
        id: newRule.id,
        name: newRule.name,
        ruleType: newRule.rule_type,
        action: newRule.action,
        conditions: typeof newRule.conditions === "string" ? JSON.parse(newRule.conditions) : newRule.conditions,
        isActive: newRule.is_active,
        triggeredCount: 0,
        lastTriggeredAt: null,
        createdAt: newRule.created_at,
      },
    });
  } catch (error) {
    logger.error("Custom rule creation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to create policy" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { id, name, isActive, action, conditions } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Policy ID required" }, { status: 400 });
    }

    // Build dynamic update
    const sets: string[] = ["updated_at = NOW()"];
    const params: any[] = [tenantId, id];
    let idx = 3;

    if (typeof isActive === "boolean") {
      sets.push(`is_active = $${idx++}`);
      params.push(isActive);
    }
    if (name) {
      sets.push(`name = $${idx++}`);
      params.push(name);
    }
    if (action) {
      sets.push(`action = $${idx++}`);
      params.push(action);
    }
    if (conditions) {
      sets.push(`conditions = $${idx++}`);
      params.push(JSON.stringify(conditions));
    }

    await database.query(
      `UPDATE custom_rules SET ${sets.join(", ")} WHERE tenant_id = $1 AND id = $2`,
      params,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Custom rule update error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to update policy" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Policy ID required" }, { status: 400 });
    }

    await database.query(
      `DELETE FROM custom_rules WHERE tenant_id = $1 AND id = $2`,
      [tenantId, parseInt(id)],
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Custom rule delete error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Failed to delete policy" }, { status: 500 });
  }
}
