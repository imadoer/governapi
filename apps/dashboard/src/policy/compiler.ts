/**
 * Policy Compiler
 * YAML-to-executable policy compilation, validation, versioning
 */
import * as yaml from "js-yaml";
import {
  TenantId,
  PolicyId,
  RuleId,
  Policy,
  PolicyRule,
  PolicyAction,
  PolicyCondition,
  RiskLevel,
  JsonValue,
  Millis,
  validatePolicyRule,
} from "../core/types";
import { database } from "../infrastructure/database";
import { logger } from "../infrastructure/monitoring";

export interface PolicyDefinition {
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly rules: readonly RuleDefinition[];
  readonly metadata?: JsonValue;
}

export interface RuleDefinition {
  readonly name: string;
  readonly description?: string;
  readonly condition: PolicyCondition;
  readonly conditionValue: JsonValue;
  readonly action: PolicyAction;
  readonly severity: RiskLevel;
  readonly priority?: number;
  readonly enabled?: boolean;
  readonly tags?: readonly string[];
}

export interface CompilationResult {
  readonly success: boolean;
  readonly policy?: Policy;
  readonly errors: readonly CompilationError[];
  readonly warnings: readonly string[];
  readonly compilationTime: number;
}

export interface CompilationError {
  readonly type:
    | "SYNTAX_ERROR"
    | "VALIDATION_ERROR"
    | "SCHEMA_ERROR"
    | "REFERENCE_ERROR";
  readonly message: string;
  readonly line?: number;
  readonly column?: number;
  readonly ruleName?: string;
  readonly severity: "ERROR" | "WARNING";
}

export interface PolicySchema {
  readonly version: string;
  readonly supportedConditions: readonly PolicyCondition[];
  readonly supportedActions: readonly PolicyAction[];
  readonly validationRules: JsonValue;
}

export interface CompilationMetrics {
  totalCompilations: number;
  successfulCompilations: number;
  averageCompilationTime: number;
  errorsByType: Record<string, number>;
}

export class PolicyCompiler {
  private static instance: PolicyCompiler;
  private schema: PolicySchema;
  private compilationMetrics: CompilationMetrics = {
    totalCompilations: 0,
    successfulCompilations: 0,
    averageCompilationTime: 0,
    errorsByType: {},
  };

  private constructor() {
    this.schema = this.loadPolicySchema();
  }

  static getInstance(): PolicyCompiler {
    if (!PolicyCompiler.instance) {
      PolicyCompiler.instance = new PolicyCompiler();
    }
    return PolicyCompiler.instance;
  }

  async compileFromYAML(
    yamlSource: string,
    tenantId: TenantId,
    createdBy: string,
    policyId?: PolicyId,
  ): Promise<CompilationResult> {
    const startTime = Date.now() as Millis;
    const errors: CompilationError[] = [];
    const warnings: string[] = [];

    try {
      // Parse YAML
      const policyDef = this.parseYAML(yamlSource, errors);
      if (!policyDef) {
        return {
          success: false,
          errors,
          warnings,
          compilationTime: Date.now() - startTime,
        };
      }

      // Validate schema
      this.validateSchema(policyDef, errors, warnings);
      if (errors.length > 0) {
        return {
          success: false,
          errors,
          warnings,
          compilationTime: Date.now() - startTime,
        };
      }

      // Compile to executable policy
      const policy = await this.compilePolicyDefinition(
        policyDef,
        tenantId,
        createdBy,
        policyId,
      );

      // Validate compiled policy
      this.validateCompiledPolicy(policy, errors, warnings);

      if (errors.length > 0) {
        return {
          success: false,
          errors,
          warnings,
          compilationTime: Date.now() - startTime,
        };
      }

      // Store compilation metadata
      await this.storeCompilationResult(tenantId, policy, yamlSource, {
        compilation_time_ms: Date.now() - startTime,
      });

      this.updateMetrics(true, Date.now() - startTime);

      return {
        success: true,
        policy,
        errors,
        warnings,
        compilationTime: Date.now() - startTime,
      };
    } catch (error) {
      const compilationError: CompilationError = {
        type: "SYNTAX_ERROR",
        message: `Compilation failed: ${(error as Error).message}`,
        severity: "ERROR",
      };

      this.updateMetrics(false, Date.now() - startTime);

      return {
        success: false,
        errors: [compilationError],
        warnings,
        compilationTime: Date.now() - startTime,
      };
    }
  }

  async compileFromJSON(
    jsonSource: string,
    tenantId: TenantId,
    createdBy: string,
    policyId?: PolicyId,
  ): Promise<CompilationResult> {
    try {
      const policyDef = JSON.parse(jsonSource) as PolicyDefinition;
      return this.compilePolicyDefinition(
        policyDef,
        tenantId,
        createdBy,
        policyId,
      ).then((policy) => ({
        success: true,
        policy,
        errors: [],
        warnings: [],
        compilationTime: 0,
      }));
    } catch (error) {
      return {
        success: false,
        errors: [
          {
            type: "SYNTAX_ERROR",
            message: `JSON parsing failed: ${(error as Error).message}`,
            severity: "ERROR",
          },
        ],
        warnings: [],
        compilationTime: 0,
      };
    }
  }

  private parseYAML(
    yamlSource: string,
    errors: CompilationError[],
  ): PolicyDefinition | null {
    try {
      const parsed = yaml.load(yamlSource, {
        schema: yaml.JSON_SCHEMA,
        onWarning: (warning) => {
          errors.push({
            type: "SYNTAX_ERROR",
            message: warning.message,
            line: warning.mark?.line,
            column: warning.mark?.column,
            severity: "WARNING",
          });
        },
      });

      if (!parsed || typeof parsed !== "object") {
        errors.push({
          type: "SYNTAX_ERROR",
          message: "Invalid YAML structure",
          severity: "ERROR",
        });
        return null;
      }

      return parsed as PolicyDefinition;
    } catch (error) {
      errors.push({
        type: "SYNTAX_ERROR",
        message: `YAML parsing error: ${(error as Error).message}`,
        severity: "ERROR",
      });
      return null;
    }
  }

  private validateSchema(
    policyDef: PolicyDefinition,
    errors: CompilationError[],
    warnings: string[],
  ): void {
    // Validate required fields
    if (!policyDef.name || typeof policyDef.name !== "string") {
      errors.push({
        type: "SCHEMA_ERROR",
        message: "Policy name is required and must be a string",
        severity: "ERROR",
      });
    }

    if (!policyDef.version || typeof policyDef.version !== "string") {
      errors.push({
        type: "SCHEMA_ERROR",
        message: "Policy version is required and must be a string",
        severity: "ERROR",
      });
    }

    if (!policyDef.rules || !Array.isArray(policyDef.rules)) {
      errors.push({
        type: "SCHEMA_ERROR",
        message: "Policy rules are required and must be an array",
        severity: "ERROR",
      });
      return;
    }

    // Validate rules
    policyDef.rules.forEach((rule, index) => {
      this.validateRuleDefinition(rule, index, errors, warnings);
    });

    // Check for duplicate rule names
    const ruleNames = policyDef.rules.map((r) => r.name);
    const duplicates = ruleNames.filter(
      (name, index) => ruleNames.indexOf(name) !== index,
    );
    if (duplicates.length > 0) {
      errors.push({
        type: "VALIDATION_ERROR",
        message: `Duplicate rule names found: ${duplicates.join(", ")}`,
        severity: "ERROR",
      });
    }

    // Performance warnings
    if (policyDef.rules.length > 50) {
      warnings.push(
        `Policy has ${policyDef.rules.length} rules - consider splitting for better performance`,
      );
    }
  }

  private validateRuleDefinition(
    rule: RuleDefinition,
    index: number,
    errors: CompilationError[],
    warnings: string[],
  ): void {
    const ruleName = rule.name || `Rule ${index + 1}`;

    // Required fields
    if (!rule.name || typeof rule.name !== "string") {
      errors.push({
        type: "SCHEMA_ERROR",
        message: "Rule name is required and must be a string",
        ruleName,
        severity: "ERROR",
      });
    }

    if (
      !rule.condition ||
      !this.schema.supportedConditions.includes(rule.condition)
    ) {
      errors.push({
        type: "VALIDATION_ERROR",
        message: `Invalid condition: ${rule.condition}. Supported: ${this.schema.supportedConditions.join(", ")}`,
        ruleName,
        severity: "ERROR",
      });
    }

    if (!rule.action || !this.schema.supportedActions.includes(rule.action)) {
      errors.push({
        type: "VALIDATION_ERROR",
        message: `Invalid action: ${rule.action}. Supported: ${this.schema.supportedActions.join(", ")}`,
        ruleName,
        severity: "ERROR",
      });
    }

    if (
      !rule.severity ||
      !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(rule.severity)
    ) {
      errors.push({
        type: "VALIDATION_ERROR",
        message: `Invalid severity: ${rule.severity}. Must be LOW, MEDIUM, HIGH, or CRITICAL`,
        ruleName,
        severity: "ERROR",
      });
    }

    // Validate condition-specific values
    this.validateConditionValue(
      rule.condition,
      rule.conditionValue,
      ruleName,
      errors,
      warnings,
    );

    // Priority validation
    if (
      rule.priority !== undefined &&
      (rule.priority < 0 || rule.priority > 1000)
    ) {
      errors.push({
        type: "VALIDATION_ERROR",
        message: "Rule priority must be between 0 and 1000",
        ruleName,
        severity: "ERROR",
      });
    }
  }

  private validateConditionValue(
    condition: PolicyCondition,
    value: JsonValue,
    ruleName: string,
    errors: CompilationError[],
    warnings: string[],
  ): void {
    switch (condition) {
      case "IP_WHITELIST":
        if (!Array.isArray(value)) {
          errors.push({
            type: "VALIDATION_ERROR",
            message:
              "IP_WHITELIST condition value must be an array of IP addresses",
            ruleName,
            severity: "ERROR",
          });
        } else {
          value.forEach((ip, index) => {
            if (typeof ip !== "string" || !this.isValidIPOrCIDR(ip as string)) {
              errors.push({
                type: "VALIDATION_ERROR",
                message: `Invalid IP address or CIDR at index ${index}: ${ip}`,
                ruleName,
                severity: "ERROR",
              });
            }
          });
        }
        break;

      case "REQUEST_RATE":
        if (
          !value ||
          typeof value !== "object" ||
          !("requests" in (value as any)) ||
          !("windowMinutes" in (value as any))
        ) {
          errors.push({
            type: "VALIDATION_ERROR",
            message:
              'REQUEST_RATE condition value must have "requests" and "windowMinutes" properties',
            ruleName,
            severity: "ERROR",
          });
        } else {
          const rateConfig = value as any;
          if (
            typeof rateConfig.requests !== "number" ||
            rateConfig.requests <= 0
          ) {
            errors.push({
              type: "VALIDATION_ERROR",
              message: "REQUEST_RATE requests must be a positive number",
              ruleName,
              severity: "ERROR",
            });
          }
          if (
            typeof rateConfig.windowMinutes !== "number" ||
            rateConfig.windowMinutes <= 0
          ) {
            errors.push({
              type: "VALIDATION_ERROR",
              message: "REQUEST_RATE windowMinutes must be a positive number",
              ruleName,
              severity: "ERROR",
            });
          }
        }
        break;

      case "TIME_WINDOW":
        if (
          !value ||
          typeof value !== "object" ||
          !("startHour" in (value as any)) ||
          !("endHour" in (value as any))
        ) {
          errors.push({
            type: "VALIDATION_ERROR",
            message:
              'TIME_WINDOW condition value must have "startHour" and "endHour" properties',
            ruleName,
            severity: "ERROR",
          });
        } else {
          const timeConfig = value as any;
          if (
            typeof timeConfig.startHour !== "number" ||
            timeConfig.startHour < 0 ||
            timeConfig.startHour > 23
          ) {
            errors.push({
              type: "VALIDATION_ERROR",
              message: "TIME_WINDOW startHour must be between 0 and 23",
              ruleName,
              severity: "ERROR",
            });
          }
          if (
            typeof timeConfig.endHour !== "number" ||
            timeConfig.endHour < 0 ||
            timeConfig.endHour > 23
          ) {
            errors.push({
              type: "VALIDATION_ERROR",
              message: "TIME_WINDOW endHour must be between 0 and 23",
              ruleName,
              severity: "ERROR",
            });
          }
        }
        break;

      case "RISK_THRESHOLD":
        if (typeof value !== "number" || value < 0 || value > 100) {
          errors.push({
            type: "VALIDATION_ERROR",
            message:
              "RISK_THRESHOLD condition value must be a number between 0 and 100",
            ruleName,
            severity: "ERROR",
          });
        }
        break;

      case "AUTH_REQUIRED":
        if (typeof value !== "boolean") {
          errors.push({
            type: "VALIDATION_ERROR",
            message: "AUTH_REQUIRED condition value must be a boolean",
            ruleName,
            severity: "ERROR",
          });
        }
        break;

      case "DATA_CLASSIFICATION":
        if (!Array.isArray(value)) {
          errors.push({
            type: "VALIDATION_ERROR",
            message:
              "DATA_CLASSIFICATION condition value must be an array of classifications",
            ruleName,
            severity: "ERROR",
          });
        } else {
          const validClassifications = [
            "PUBLIC",
            "INTERNAL",
            "CONFIDENTIAL",
            "RESTRICTED",
            "PII",
            "PHI",
          ];
          value.forEach((classification, index) => {
            if (
              typeof classification !== "string" ||
              !validClassifications.includes(classification as string)
            ) {
              errors.push({
                type: "VALIDATION_ERROR",
                message: `Invalid data classification at index ${index}: ${classification}`,
                ruleName,
                severity: "ERROR",
              });
            }
          });
        }
        break;
    }
  }

  private async compilePolicyDefinition(
    policyDef: PolicyDefinition,
    tenantId: TenantId,
    createdBy: string,
    policyId?: PolicyId,
  ): Promise<Policy> {
    const generatedPolicyId =
      policyId ||
      (`${tenantId}:policy:${policyDef.name.toLowerCase().replace(/\s+/g, "-")}` as PolicyId);

    const compiledRules: PolicyRule[] = policyDef.rules.map(
      (ruleDef, index) => {
        const ruleId = `${generatedPolicyId}:rule:${index}` as RuleId;

        return {
          id: ruleId,
          policyId: generatedPolicyId,
          tenantId,
          name: ruleDef.name,
          description: ruleDef.description || "",
          condition: ruleDef.condition,
          conditionValue: ruleDef.conditionValue,
          action: ruleDef.action,
          severity: ruleDef.severity,
          enabled: ruleDef.enabled !== false,
          priority: ruleDef.priority || 0,
          createdAt: new Date(),
          createdBy,
          updatedBy: createdBy,
        };
      },
    );

    return {
      id: generatedPolicyId,
      tenantId,
      name: policyDef.name,
      description: policyDef.description || "",
      version: policyDef.version,
      rules: compiledRules,
      active: false,
      compiledPolicy: {
        source: "yaml",
        compiledAt: Date.now() as Millis,
        compilerVersion: "1.0.0",
        metadata: policyDef.metadata,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy,
      updatedBy: createdBy,
    };
  }

  private validateCompiledPolicy(
    policy: Policy,
    errors: CompilationError[],
    warnings: string[],
  ): void {
    // Validate policy structure
    if (!policy.rules || policy.rules.length === 0) {
      warnings.push("Policy has no rules - it will have no effect");
    }

    // Check for conflicting rules
    const denyRules = policy.rules.filter((r) => r.action === "DENY");
    const allowRules = policy.rules.filter((r) => r.action === "ALLOW");

    if (denyRules.length > 0 && allowRules.length > 0) {
      warnings.push(
        "Policy contains both ALLOW and DENY rules - DENY rules will take precedence",
      );
    }

    // Validate priority ordering
    const priorities = policy.rules.map((r) => r.priority);
    const uniquePriorities = new Set(priorities);
    if (priorities.length !== uniquePriorities.size) {
      warnings.push(
        "Multiple rules have the same priority - evaluation order may be unpredictable",
      );
    }

    // Performance checks
    const complexRules = policy.rules.filter(
      (r) => r.condition === "REQUEST_RATE" || r.condition === "RISK_THRESHOLD",
    );
    if (complexRules.length > 10) {
      warnings.push(
        "Many complex rules detected - consider optimizing for performance",
      );
    }
  }

  private async storeCompilationResult(
    tenantId: TenantId,
    policy: Policy,
    sourceCode: string,
    metadata: JsonValue,
  ): Promise<void> {
    try {
      await database.query(
        `INSERT INTO policy_compilations (
          tenant_id, policy_id, source_code, compiled_policy,
          compilation_metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          tenantId,
          policy.id,
          sourceCode,
          JSON.stringify(policy),
          JSON.stringify(metadata),
        ],
      );
    } catch (error) {
      logger.error("Failed to store compilation result", error as Error);
    }
  }

  private updateMetrics(success: boolean, compilationTime: number): void {
    this.compilationMetrics.totalCompilations++;
    if (success) {
      this.compilationMetrics.successfulCompilations++;
    }

    // Update average compilation time
    const totalTime =
      this.compilationMetrics.averageCompilationTime *
      (this.compilationMetrics.totalCompilations - 1);
    this.compilationMetrics.averageCompilationTime =
      (totalTime + compilationTime) / this.compilationMetrics.totalCompilations;
  }

  private isValidIPOrCIDR(ip: string): boolean {
    // Simple IP/CIDR validation
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    if (!ipRegex.test(ip)) return false;

    const parts = ip.split("/");
    const ipParts = parts[0].split(".").map(Number);

    // Validate IP octets
    if (ipParts.some((octet) => octet < 0 || octet > 255)) return false;

    // Validate CIDR prefix if present
    if (parts[1]) {
      const prefix = Number(parts[1]);
      if (prefix < 0 || prefix > 32) return false;
    }

    return true;
  }

  private loadPolicySchema(): PolicySchema {
    return {
      version: "1.0.0",
      supportedConditions: [
        "IP_WHITELIST",
        "DATA_CLASSIFICATION",
        "REQUEST_RATE",
        "TIME_WINDOW",
        "AUTH_REQUIRED",
        "RISK_THRESHOLD",
      ],
      supportedActions: ["ALLOW", "DENY", "LOG", "THROTTLE", "REQUIRE_AUTH"],
      validationRules: {
        maxRulesPerPolicy: 100,
        maxPolicyNameLength: 255,
        maxRuleNameLength: 255,
      },
    };
  }

  // Public API methods
  async validateYAML(yamlSource: string): Promise<CompilationResult> {
    const errors: CompilationError[] = [];
    const warnings: string[] = [];

    const policyDef = this.parseYAML(yamlSource, errors);
    if (policyDef) {
      this.validateSchema(policyDef, errors, warnings);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      compilationTime: 0,
    };
  }

  async deployPolicy(tenantId: TenantId, policy: Policy): Promise<void> {
    try {
      await database.query(
        `UPDATE policies SET active = true, deployed_at = $1, updated_at = NOW()
         WHERE tenant_id = $2 AND id = $3`,
        [Date.now() as Millis, tenantId, policy.id],
      );

      logger.info("Policy deployed successfully", {
        tenant_id: tenantId,
        policy_id: policy.id,
        policy_name: policy.name,
      });
    } catch (error) {
      logger.error("Failed to deploy policy", error as Error);
      throw error;
    }
  }

  async undeployPolicy(tenantId: TenantId, policyId: PolicyId): Promise<void> {
    try {
      await database.query(
        `UPDATE policies SET active = false, updated_at = NOW()
         WHERE tenant_id = $1 AND id = $2`,
        [tenantId, policyId],
      );

      logger.info("Policy undeployed successfully", {
        tenant_id: tenantId,
        policy_id: policyId,
      });
    } catch (error) {
      logger.error("Failed to undeploy policy", error as Error);
      throw error;
    }
  }

  getCompilationMetrics(): CompilationMetrics {
    return { ...this.compilationMetrics };
  }

  getSchema(): PolicySchema {
    return { ...this.schema };
  }
}

// Export singleton instance
export const policyCompiler = PolicyCompiler.getInstance();

// Helper functions
export async function compileYAMLPolicy(
  yamlSource: string,
  tenantId: TenantId,
  createdBy: string,
  policyId?: PolicyId,
): Promise<CompilationResult> {
  return policyCompiler.compileFromYAML(
    yamlSource,
    tenantId,
    createdBy,
    policyId,
  );
}

export async function validatePolicyYAML(
  yamlSource: string,
): Promise<CompilationResult> {
  return policyCompiler.validateYAML(yamlSource);
}

export async function deployCompiledPolicy(
  tenantId: TenantId,
  policy: Policy,
): Promise<void> {
  return policyCompiler.deployPolicy(tenantId, policy);
}

export function getPolicySchema(): PolicySchema {
  return policyCompiler.getSchema();
}

export default PolicyCompiler;
