/**
 * Bot Rules API
 * Manage configurable bot detection rules
 */

import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

interface BotRule {
  id?: number;
  name: string;
  description?: string;
  enabled: boolean;
  priority: number;
  conditions: RuleConditions;
  action: 'BLOCK' | 'CHALLENGE' | 'MONITOR' | 'ALLOW';
  actionParams?: any;
}

interface RuleConditions {
  asnType?: 'datacenter' | 'vpn' | 'hosting' | 'residential';
  path?: string;
  pathPattern?: string;
  velocityScore?: { min?: number; max?: number };
  finalScore?: { min?: number; max?: number };
  headlessDetected?: boolean;
  crawlerVerified?: boolean;
  country?: string[];
}

/**
 * GET - List all rules for tenant
 */
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const rules = await database.queryMany(
      `SELECT 
        id, name, description, enabled, priority,
        conditions, action, action_params,
        created_at, updated_at
       FROM bot_rules
       WHERE tenant_id = $1
       ORDER BY priority DESC, created_at DESC`,
      [parseInt(tenantId)]
    );

    return NextResponse.json({
      success: true,
      rules: rules.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        enabled: row.enabled,
        priority: row.priority,
        conditions: row.conditions,
        action: row.action,
        actionParams: row.action_params,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create new rule
 */
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const rule: BotRule = await request.json();

    // Validate rule
    if (!rule.name || !rule.action || !rule.conditions) {
      return NextResponse.json(
        { error: "Missing required fields: name, action, conditions" },
        { status: 400 }
      );
    }

    // Insert rule
    const result = await database.queryOne(
      `INSERT INTO bot_rules 
        (tenant_id, name, description, enabled, priority, conditions, action, action_params, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, created_at`,
      [
        parseInt(tenantId),
        rule.name,
        rule.description || null,
        rule.enabled !== false,
        rule.priority || 0,
        JSON.stringify(rule.conditions),
        rule.action,
        JSON.stringify(rule.actionParams || {}),
        'admin', // TODO: get from session
      ]
    );

    return NextResponse.json({
      success: true,
      rule: {
        id: result.id,
        ...rule,
        createdAt: result.created_at,
      },
    });
  } catch (error) {
    console.error("Failed to create rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update existing rule
 */
export async function PUT(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const rule: BotRule = await request.json();

    if (!rule.id) {
      return NextResponse.json(
        { error: "Rule ID required" },
        { status: 400 }
      );
    }

    // Update rule
    await database.query(
      `UPDATE bot_rules
       SET name = $1, description = $2, enabled = $3, priority = $4,
           conditions = $5, action = $6, action_params = $7, updated_at = NOW()
       WHERE id = $8 AND tenant_id = $9`,
      [
        rule.name,
        rule.description || null,
        rule.enabled,
        rule.priority,
        JSON.stringify(rule.conditions),
        rule.action,
        JSON.stringify(rule.actionParams || {}),
        rule.id,
        parseInt(tenantId),
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Rule updated successfully",
    });
  } catch (error) {
    console.error("Failed to update rule:", error);
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete rule
 */
export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const ruleId = request.nextUrl.searchParams.get("id");
  
  if (!tenantId || !ruleId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    await database.query(
      `DELETE FROM bot_rules WHERE id = $1 AND tenant_id = $2`,
      [parseInt(ruleId), parseInt(tenantId)]
    );

    return NextResponse.json({
      success: true,
      message: "Rule deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete rule:", error);
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}
