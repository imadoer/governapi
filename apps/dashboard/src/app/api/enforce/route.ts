import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function POST(req: NextRequest) {
  try {
    const { apiId, request } = await req.json();

    // Check if IP is blocked
    const blockedIP = await database.queryOne(
      `SELECT * FROM ip_blocks 
       WHERE ip_address = $1::inet 
       AND blocked_until > NOW()`,
      [request.ip]
    );

    if (blockedIP) {
      return NextResponse.json({
        allowed: false,
        blocked: true,
        violations: [{
          policy_id: null,
          policy_name: "IP Block",
          severity: "CRITICAL",
          message: `IP blocked: ${blockedIP.reason}`
        }]
      });
    }

    // Get active policies (if table exists)
    let policies = [];
    try {
      policies = await database.queryMany(
        "SELECT * FROM policies WHERE enabled = true",
      ) || [];
    } catch (e) {
      // Policies table doesn't exist yet - skip policy checks
      policies = [];
    }

    const violations = [];

    for (const policy of policies) {
      const rules = policy.rules || {};

      // Check authentication requirement
      if (
        rules.require === "authentication" &&
        !request.headers?.authorization
      ) {
        violations.push({
          policy_id: policy.id,
          policy_name: policy.name,
          severity: policy.severity,
          message: "Authentication required",
        });
      }

      // Check rate limits
      if (rules.rateLimit && request.requestCount > rules.rateLimit) {
        violations.push({
          policy_id: policy.id,
          policy_name: policy.name,
          severity: policy.severity,
          message: `Rate limit exceeded: ${request.requestCount}/${rules.rateLimit}`,
        });
      }

      // Check IP restrictions
      if (rules.blockedIPs && rules.blockedIPs.includes(request.ip)) {
        violations.push({
          policy_id: policy.id,
          policy_name: policy.name,
          severity: policy.severity,
          message: "IP address blocked",
        });
      }
    }

    // Record violations if any
    if (violations.length > 0) {
      for (const violation of violations) {
        await database.query(
          "INSERT INTO violations (policy_id, api_id, severity, message, created_at) VALUES ($1, $2, $3, $4, NOW())",
          [violation.policy_id, apiId, violation.severity, violation.message],
        );
      }
    }

    return NextResponse.json({
      allowed: violations.length === 0,
      violations,
      blocked: violations.some(
        (v) => v.severity === "HIGH" || v.severity === "CRITICAL",
      ),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Policy enforcement failed" },
      { status: 500 },
    );
  }
}
