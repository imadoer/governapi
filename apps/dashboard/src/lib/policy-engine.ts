import { database } from "../infrastructure/database";
import { dispatchWebhooks } from "./webhook-dispatch";

interface ScanResult {
  scanId: number;
  tenantId: string;
  url: string;
  securityScore: number;
  vulnerabilities: Array<{
    severity: string;
    vulnerability_type: string;
    title: string;
    affected_url: string;
  }>;
  responseStatus?: number;
  headers?: Record<string, string | null>;
}

/**
 * Evaluate all active policies for a tenant after a scan completes.
 * Fire-and-forget — errors are logged but don't block the caller.
 */
export async function evaluatePolicies(scan: ScanResult) {
  try {
    const policies = await database.queryMany(
      `SELECT id, name, rule_type, action, conditions, is_active
       FROM custom_rules
       WHERE tenant_id = $1 AND is_active = true`,
      [scan.tenantId],
    );

    if (policies.length === 0) return;

    console.log(`[PolicyEngine] Evaluating ${policies.length} active policies for tenant ${scan.tenantId}`);

    for (const policy of policies) {
      try {
        const conditions = typeof policy.conditions === "string"
          ? JSON.parse(policy.conditions)
          : policy.conditions;

        const result = evaluateCondition(policy.rule_type, conditions, scan);

        if (result.triggered) {
          console.log(`[PolicyEngine] TRIGGERED: "${policy.name}" — ${result.details}`);
          await executeAction(policy, scan, result.details);
        }
      } catch (err: any) {
        console.error(`[PolicyEngine] Error evaluating policy ${policy.id}:`, err?.message);
      }
    }
  } catch (err: any) {
    console.error("[PolicyEngine] Failed to load policies:", err?.message);
  }
}

function evaluateCondition(
  ruleType: string,
  conditions: any,
  scan: ScanResult,
): { triggered: boolean; details: string } {
  switch (conditions.type || ruleType) {
    case "score_below":
    case "score_alert": {
      const threshold = conditions.threshold ?? 50;
      if (scan.securityScore < threshold) {
        return {
          triggered: true,
          details: `Score ${scan.securityScore} is below threshold ${threshold}`,
        };
      }
      return { triggered: false, details: "" };
    }

    case "severity_match":
    case "vuln_alert": {
      const targetSeverity = conditions.severity || "CRITICAL";
      const matching = scan.vulnerabilities.filter(
        (v) => v.severity === targetSeverity,
      );
      if (matching.length > 0) {
        return {
          triggered: true,
          details: `Found ${matching.length} ${targetSeverity} vulnerability(ies): ${matching.map((v) => v.title).join(", ")}`,
        };
      }
      return { triggered: false, details: "" };
    }

    case "header_missing":
    case "header_check": {
      const headerName = conditions.header || "HSTS";
      // Map friendly names to actual header keys
      const headerMap: Record<string, string> = {
        HSTS: "strict-transport-security",
        CSP: "content-security-policy",
        "X-Frame-Options": "x-frame-options",
        "X-Content-Type-Options": "x-content-type-options",
        CORS: "access-control-allow-origin",
        "Referrer-Policy": "referrer-policy",
      };
      const actualHeader = headerMap[headerName] || headerName.toLowerCase();

      // Check if any vuln matches "Missing <header>"
      const missingHeaderVuln = scan.vulnerabilities.find(
        (v) =>
          v.vulnerability_type.toLowerCase().includes("missing") &&
          v.vulnerability_type.toLowerCase().includes(headerName.toLowerCase().replace("x-", "")),
      );
      if (missingHeaderVuln) {
        return {
          triggered: true,
          details: `Header ${headerName} is missing on ${scan.url}`,
        };
      }

      // Also check raw headers if available
      if (scan.headers && !scan.headers[actualHeader]) {
        return {
          triggered: true,
          details: `Header ${headerName} is missing on ${scan.url}`,
        };
      }
      return { triggered: false, details: "" };
    }

    case "compliance_below":
    case "compliance_alert": {
      // Compliance is derived from vulns — rough estimate: each vuln type reduces compliance
      const threshold = conditions.threshold ?? 50;
      const vulnTypes = new Set(scan.vulnerabilities.map((v) => v.vulnerability_type));
      // Rough: 100 - (unique vuln types * 12)
      const complianceEstimate = Math.max(0, 100 - vulnTypes.size * 12);
      if (complianceEstimate < threshold) {
        return {
          triggered: true,
          details: `Estimated compliance ${complianceEstimate}% is below threshold ${threshold}%`,
        };
      }
      return { triggered: false, details: "" };
    }

    case "endpoint_error":
    case "endpoint_down": {
      if (scan.responseStatus && scan.responseStatus >= 500) {
        return {
          triggered: true,
          details: `Endpoint returned ${scan.responseStatus}`,
        };
      }
      // Check if scan found "Target Unreachable" vuln
      const unreachable = scan.vulnerabilities.find(
        (v) => v.vulnerability_type === "Target Unreachable",
      );
      if (unreachable) {
        return {
          triggered: true,
          details: `Endpoint unreachable: ${unreachable.title}`,
        };
      }
      return { triggered: false, details: "" };
    }

    case "new_exposure": {
      // This would need cross-scan comparison — skip for now
      return { triggered: false, details: "" };
    }

    default:
      return { triggered: false, details: "" };
  }
}

async function executeAction(
  policy: any,
  scan: ScanResult,
  details: string,
) {
  const action = policy.action || "notify";

  // 1. Record the trigger
  await database.query(
    `INSERT INTO policy_triggers (tenant_id, policy_id, endpoint_url, scan_id, details, action_taken, triggered_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [scan.tenantId, policy.id, scan.url, scan.scanId, details, action],
  );

  // 2. Update policy stats
  await database.query(
    `UPDATE custom_rules
     SET triggered_count = COALESCE(triggered_count, 0) + 1,
         last_triggered_at = NOW(),
         updated_at = NOW()
     WHERE id = $1`,
    [policy.id],
  );

  // 3. Execute the action
  switch (action) {
    case "notify": {
      // Send to all active integrations via existing webhook system
      await dispatchWebhooks(scan.tenantId, "policy.triggered", {
        policyName: policy.name,
        policyType: policy.rule_type,
        details,
        url: scan.url,
        securityScore: scan.securityScore,
        vulnerabilityCount: scan.vulnerabilities.length,
      });
      console.log(`[PolicyEngine] Notify action sent for "${policy.name}"`);
      break;
    }

    case "flag_critical": {
      // Upgrade all vulns from this scan to CRITICAL
      const updated = await database.query(
        `UPDATE vulnerabilities
         SET severity = 'CRITICAL', updated_at = NOW()
         WHERE scan_id = $1 AND tenant_id = $2 AND severity != 'CRITICAL'`,
        [scan.scanId, scan.tenantId],
      );
      console.log(`[PolicyEngine] Flag Critical: upgraded vulnerabilities for scan ${scan.scanId}`);
      break;
    }

    case "fail_cicd": {
      // Store a violation record that the CI/CD API key check will read
      await database.query(
        `INSERT INTO policy_triggers (tenant_id, policy_id, endpoint_url, scan_id, details, action_taken, triggered_at)
         VALUES ($1, $2, $3, $4, $5, 'cicd_fail', NOW())`,
        [scan.tenantId, policy.id, scan.url, scan.scanId, `CI/CD gate failed: ${details}`],
      );
      console.log(`[PolicyEngine] CI/CD fail recorded for "${policy.name}"`);
      break;
    }

    case "auto_rescan": {
      console.log(`[PolicyEngine] Auto-rescan requested for ${scan.url} (not implemented — would create infinite loop)`);
      break;
    }

    default:
      console.log(`[PolicyEngine] Unknown action: ${action}`);
  }
}
