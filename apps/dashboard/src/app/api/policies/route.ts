import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    // Get real security policies for this tenant
    const policies = await database.queryMany(
      `SELECT id, name, description, policy_type, rules, is_active, severity, 
              created_at, updated_at, created_by
       FROM security_policies 
       WHERE tenant_id = $1 
       ORDER BY severity DESC, created_at DESC`,
      [tenantId],
    );

    // Get policy compliance statistics
    const complianceStats = await database.queryOne(
      `SELECT 
         COUNT(*) as total_policies,
         COUNT(CASE WHEN is_active = true THEN 1 END) as active_policies,
         COUNT(CASE WHEN severity = 'HIGH' THEN 1 END) as high_severity,
         COUNT(CASE WHEN severity = 'CRITICAL' THEN 1 END) as critical_policies
       FROM security_policies 
       WHERE tenant_id = $1`,
      [tenantId],
    );

    // Get recent policy violations
    const violations = await database.queryMany(
      `SELECT pv.id, pv.policy_id, pv.violation_type, pv.severity, pv.details,
              pv.created_at, sp.name as policy_name
       FROM policy_violations pv
       JOIN security_policies sp ON pv.policy_id = sp.id
       WHERE pv.tenant_id = $1
       ORDER BY pv.created_at DESC
       LIMIT 50`,
      [tenantId],
    );

    const formattedPolicies = policies.map((policy) => ({
      id: policy.id,
      name: policy.name,
      description: policy.description,
      type: policy.policy_type,
      rules:
        typeof policy.rules === "string"
          ? JSON.parse(policy.rules)
          : policy.rules,
      isActive: policy.is_active,
      severity: policy.severity,
      createdAt: policy.created_at,
      updatedAt: policy.updated_at,
      createdBy: policy.created_by,
    }));

    return NextResponse.json({
      success: true,
      policies: formattedPolicies,
      statistics: {
        total: parseInt(complianceStats?.total_policies || "0"),
        active: parseInt(complianceStats?.active_policies || "0"),
        highSeverity: parseInt(complianceStats?.high_severity || "0"),
        critical: parseInt(complianceStats?.critical_policies || "0"),
        complianceRate:
          policies.length > 0
            ? Math.round(
                (violations.filter((v) => v.severity !== "CRITICAL").length /
                  policies.length) *
                  100,
              )
            : 100,
      },
      recentViolations: violations.map((v) => ({
        id: v.id,
        policyId: v.policy_id,
        policyName: v.policy_name,
        violationType: v.violation_type,
        severity: v.severity,
        details: v.details,
        detectedAt: v.created_at,
      })),
    });
  } catch (error) {
    logger.error("Policies API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch security policies" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const {
      name,
      description,
      policyType,
      rules,
      severity = "MEDIUM",
    } = await request.json();

    if (!name || !policyType || !rules) {
      return NextResponse.json(
        { error: "Name, policy type, and rules are required" },
        { status: 400 },
      );
    }

    // Validate policy type
    const validTypes = [
      "ACCESS_CONTROL",
      "DATA_PROTECTION",
      "THREAT_DETECTION",
      "COMPLIANCE",
      "RATE_LIMITING",
    ];
    if (!validTypes.includes(policyType)) {
      return NextResponse.json(
        { error: "Invalid policy type" },
        { status: 400 },
      );
    }

    // Validate severity
    const validSeverities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: "Invalid severity level" },
        { status: 400 },
      );
    }

    // Create new security policy
    const newPolicy = await database.queryOne(
      `INSERT INTO security_policies (tenant_id, name, description, policy_type, rules, severity, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [
        tenantId,
        name,
        description || `${policyType} security policy`,
        policyType,
        JSON.stringify(rules),
        severity,
        true,
        userId || "system",
      ],
    );

    if (!newPolicy) {
      return NextResponse.json(
        { error: "Failed to create security policy" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      policy: {
        id: newPolicy.id,
        name: newPolicy.name,
        description: newPolicy.description,
        type: newPolicy.policy_type,
        rules:
          typeof newPolicy.rules === "string"
            ? JSON.parse(newPolicy.rules)
            : newPolicy.rules,
        severity: newPolicy.severity,
        isActive: newPolicy.is_active,
        createdAt: newPolicy.created_at,
        createdBy: newPolicy.created_by,
      },
      message: "Security policy created successfully",
    });
  } catch (error) {
    logger.error("Policy creation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create security policy" },
      { status: 500 },
    );
  }
}
