import { database } from "../infrastructure/database";

const DEFAULT_POLICIES = [
  {
    name: "Critical Vulnerability Alert",
    rule_type: "vuln_alert",
    description:
      "Sends a notification when any CRITICAL severity vulnerability is found during a scan. Early detection of critical issues helps you respond before they're exploited.",
    priority: "CRITICAL",
    action: "notify",
    conditions: {
      severity: "critical",
      trigger: "on_finding",
    },
  },
  {
    name: "Score Drop Alert",
    rule_type: "score_alert",
    description:
      "Triggers when your security score drops more than 10 points between consecutive scans. Catches regressions from config changes, new deployments, or emerging threats.",
    priority: "HIGH",
    action: "notify",
    conditions: {
      score_drop_threshold: 10,
      trigger: "on_score_change",
    },
  },
  {
    name: "CI/CD Quality Gate",
    rule_type: "score_alert",
    description:
      "Fails your CI/CD pipeline check if the security score is below 70. Prevents insecure code from reaching production. Configure threshold in conditions.",
    priority: "HIGH",
    action: "fail_cicd",
    conditions: {
      min_score: 70,
      trigger: "on_cicd_check",
    },
  },
];

/**
 * Seed default security policies for a tenant.
 * Skips if the tenant already has any policies.
 */
export async function seedDefaultPolicies(tenantId: string): Promise<number> {
  try {
    const existing = await database.queryOne(
      `SELECT COUNT(*) as count FROM custom_rules WHERE tenant_id = $1`,
      [tenantId],
    );

    if (parseInt(existing?.count || "0") > 0) {
      return 0; // Already has policies
    }

    let seeded = 0;
    for (const policy of DEFAULT_POLICIES) {
      await database.query(
        `INSERT INTO custom_rules (tenant_id, name, rule_type, description, priority, action, conditions, is_active, triggered_count, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true, 0, NOW())`,
        [
          tenantId,
          policy.name,
          policy.rule_type,
          policy.description,
          policy.priority,
          policy.action,
          JSON.stringify(policy.conditions),
        ],
      );
      seeded++;
    }

    return seeded;
  } catch (error) {
    console.error(`Failed to seed policies for tenant ${tenantId}:`, error);
    return 0;
  }
}

/**
 * Seed default policies for ALL existing tenants that have 0 policies.
 */
export async function seedDefaultPoliciesForAllTenants(): Promise<number> {
  try {
    const tenants = await database.queryMany(
      `SELECT c.id FROM companies c
       WHERE NOT EXISTS (
         SELECT 1 FROM custom_rules cr WHERE cr.tenant_id = c.id::text
       )`,
      [],
    );

    let totalSeeded = 0;
    for (const tenant of tenants) {
      const count = await seedDefaultPolicies(tenant.id);
      totalSeeded += count;
    }

    return totalSeeded;
  } catch (error) {
    console.error("Failed to seed policies for existing tenants:", error);
    return 0;
  }
}
