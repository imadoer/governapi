/**
 * Policy Engine
 * Real-time policy evaluation, rule matching, decision caching
 */
import {
  TenantId,
  PolicyId,
  RuleId,
  EndpointId,
  Policy,
  PolicyRule,
  PolicyEvaluationContext,
  PolicyDecision,
  PolicyAction,
  PolicyCondition,
  RiskLevel,
  Millis,
  JsonValue,
  SystemError,
} from "../core/types";
import { database } from "../infrastructure/database";
import { logger, recordPolicyMetrics } from "../infrastructure/monitoring";
import { environmentConfig } from "../config/environment";

export interface CachedDecision {
  readonly decision: PolicyDecision;
  readonly cachedAt: Millis;
  readonly ttl: Millis;
}

export interface PolicyExecutionResult {
  readonly decision: PolicyDecision;
  readonly executionTime: number;
  readonly rulesEvaluated: number;
  readonly cacheHit: boolean;
}

export interface RuleEvaluationResult {
  readonly ruleId: RuleId;
  readonly matched: boolean;
  readonly action: PolicyAction;
  readonly reason: string;
  readonly executionTime: number;
}

export interface PolicyEngineStats {
  evaluationsPerSecond: number;
  cacheHitRate: number;
  averageExecutionTime: number;
  totalEvaluations: number;
  totalViolations: number;
  totalExecutionTime: number;
}

export class PolicyEngine {
  private static instance: PolicyEngine;
  private decisionCache = new Map<string, CachedDecision>();
  private activePolicies = new Map<TenantId, Map<PolicyId, Policy>>();
  private evaluationStats: PolicyEngineStats = {
    evaluationsPerSecond: 0,
    cacheHitRate: 0,
    averageExecutionTime: 0,
    totalEvaluations: 0,
    totalViolations: 0,
    totalExecutionTime: 0,
  };

  private requestCounts = new Map<
    string,
    { count: number; windowStart: Millis }
  >();
  private lastStatsReset = Date.now();

  private constructor() {
    // Initialize cleanup intervals
    setInterval(() => this.cleanupCache(), 300000); // 5 minutes
    setInterval(() => this.updateStats(), 60000); // 1 minute
  }

  static getInstance(): PolicyEngine {
    if (!PolicyEngine.instance) {
      PolicyEngine.instance = new PolicyEngine();
    }
    return PolicyEngine.instance;
  }

  async evaluatePolicy(
    tenantId: TenantId,
    context: PolicyEvaluationContext,
  ): Promise<PolicyExecutionResult> {
    const startTime = Date.now() as Millis;

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(tenantId, context);
      const cached = this.decisionCache.get(cacheKey);

      if (cached && Date.now() - cached.cachedAt < cached.ttl) {
        recordPolicyMetrics(
          tenantId,
          "cached" as PolicyId,
          cached.decision.action,
          "cache_hit",
          (Date.now() - startTime) as Millis,
        );

        return {
          decision: cached.decision,
          executionTime: Date.now() - startTime,
          rulesEvaluated: 0,
          cacheHit: true,
        };
      }

      // Load active policies for tenant
      await this.loadActivePolicies(tenantId);
      const tenantPolicies = this.activePolicies.get(tenantId);

      if (!tenantPolicies || tenantPolicies.size === 0) {
        const defaultDecision = this.createDefaultDecision(context);

        recordPolicyMetrics(
          tenantId,
          "default" as PolicyId,
          defaultDecision.action,
          "no_policies",
          (Date.now() - startTime) as Millis,
          false,
        );

        return {
          decision: defaultDecision,
          executionTime: Date.now() - startTime,
          rulesEvaluated: 0,
          cacheHit: false,
        };
      }

      // Evaluate all policies
      const evaluationResults: RuleEvaluationResult[] = [];
      let finalDecision: PolicyDecision | null = null;

      for (const [policyId, policy] of Array.from(tenantPolicies)) {
        const policyResult = await this.evaluatePolicyRules(
          tenantId,
          policy,
          context,
        );
        evaluationResults.push(...policyResult.results);

        // Apply policy decision logic (first DENY wins, then highest priority)
        if (policyResult.decision.action === "DENY") {
          finalDecision = policyResult.decision;
          logger.info("Policy DENY rule matched, terminating evaluation", {
            tenant_id: tenantId,
            policy_id: policyId,
            rule_id: policyResult.decision.appliedRules[0],
          });
          break;
        }

        if (
          !finalDecision ||
          this.shouldOverrideDecision(finalDecision, policyResult.decision)
        ) {
          finalDecision = policyResult.decision;
        }
      }

      if (!finalDecision) {
        finalDecision = this.createDefaultDecision(context);
      }

      // Cache the decision
      const ttl = environmentConfig.getConfig().policy.cacheExpirationMs;
      this.cacheDecision(cacheKey, finalDecision, ttl);

      // Update metrics
      this.evaluationStats.totalEvaluations++;
      this.evaluationStats.totalExecutionTime += Date.now() - startTime;

      if (finalDecision.action === "DENY") {
        this.evaluationStats.totalViolations++;
      }

      recordPolicyMetrics(
        tenantId,
        "combined" as PolicyId,
        finalDecision.action,
        "evaluation_complete",
        (Date.now() - startTime) as Millis,
        finalDecision.action === "DENY",
      );

      return {
        decision: finalDecision,
        executionTime: Date.now() - startTime,
        rulesEvaluated: evaluationResults.length,
        cacheHit: false,
      };
    } catch (error) {
      logger.error("Policy evaluation failed", error as Error, {
        tenant_id: tenantId,
        context: context,
        execution_time: Date.now() - startTime,
      });

      const errorDecision = this.createErrorDecision(
        context,
        (error as Error).message,
      );

      recordPolicyMetrics(
        tenantId,
        "error" as PolicyId,
        errorDecision.action,
        "evaluation_error",
        (Date.now() - startTime) as Millis,
        true,
      );

      return {
        decision: errorDecision,
        executionTime: Date.now() - startTime,
        rulesEvaluated: 0,
        cacheHit: false,
      };
    }
  }

  private async evaluatePolicyRules(
    tenantId: TenantId,
    policy: Policy,
    context: PolicyEvaluationContext,
  ): Promise<{ decision: PolicyDecision; results: RuleEvaluationResult[] }> {
    const results: RuleEvaluationResult[] = [];
    let highestPriorityResult: RuleEvaluationResult | null = null;

    for (const rule of policy.rules) {
      if (!rule.enabled) continue;

      const ruleStartTime = Date.now() as Millis;

      try {
        const matched = await this.evaluateRule(rule, context, tenantId);

        const result: RuleEvaluationResult = {
          ruleId: rule.id,
          matched,
          action: rule.action,
          reason: matched
            ? `Rule '${rule.name}' matched`
            : `Rule '${rule.name}' did not match`,
          executionTime: Date.now() - ruleStartTime,
        };

        results.push(result);

        if (
          matched &&
          (!highestPriorityResult ||
            rule.priority >
              policy.rules.find((r) => r.id === highestPriorityResult!.ruleId)!
                .priority)
        ) {
          highestPriorityResult = result;

          // DENY actions terminate immediately
          if (rule.action === "DENY") {
            break;
          }
        }
      } catch (error) {
        logger.error("Rule evaluation failed", error as Error, {
          tenant_id: tenantId,
          policy_id: policy.id,
          rule_id: rule.id,
        });

        results.push({
          ruleId: rule.id,
          matched: false,
          action: rule.action,
          reason: `Rule evaluation error: ${(error as Error).message}`,
          executionTime: Date.now() - ruleStartTime,
        });
      }
    }

    const decision = this.createDecisionFromResults(
      context,
      highestPriorityResult,
      results,
      policy,
    );

    return { decision, results };
  }

  private async evaluateRule(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
    tenantId: TenantId,
  ): Promise<boolean> {
    switch (rule.condition) {
      case "IP_WHITELIST":
        return this.evaluateIPWhitelist(rule, context);

      case "DATA_CLASSIFICATION":
        return this.evaluateDataClassification(rule, context);

      case "REQUEST_RATE":
        return await this.evaluateRequestRate(rule, context, tenantId);

      case "TIME_WINDOW":
        return this.evaluateTimeWindow(rule, context);

      case "AUTH_REQUIRED":
        return this.evaluateAuthRequired(rule, context);

      case "RISK_THRESHOLD":
        return this.evaluateRiskThreshold(rule, context);

      default:
        logger.warn("Unknown policy condition", { condition: rule.condition });
        return false;
    }
  }

  private evaluateIPWhitelist(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
  ): boolean {
    const whitelist = rule.conditionValue as string[];
    if (!Array.isArray(whitelist)) return false;

    return whitelist.some((ip) => {
      if (ip.includes("/")) {
        // CIDR notation
        return this.isIPInCIDR(context.sourceIP, ip);
      }
      return context.sourceIP === ip;
    });
  }

  private evaluateDataClassification(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
  ): boolean {
    const requiredClassifications = rule.conditionValue as string[];
    if (!Array.isArray(requiredClassifications)) return false;

    // This would need to be enhanced to get actual endpoint classification
    // For now, we'll use a placeholder implementation
    const endpointClassification = "INTERNAL"; // Would be fetched from database

    return requiredClassifications.includes(endpointClassification);
  }

  private async evaluateRequestRate(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
    tenantId: TenantId,
  ): Promise<boolean> {
    try {
      const config = rule.conditionValue as {
        requests: number;
        windowMinutes: number;
      };
      if (!config.requests || !config.windowMinutes) return false;

      const windowStart = (Date.now() -
        config.windowMinutes * 60 * 1000) as Millis;

      // Get request count from database
      const requestCount = await this.getRequestCount(
        tenantId,
        context.endpointId,
        windowStart,
      );

      return requestCount >= config.requests;
    } catch (error) {
      logger.error("Request rate evaluation failed", error as Error);
      return false;
    }
  }

  private evaluateTimeWindow(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
  ): boolean {
    const timeWindow = rule.conditionValue as {
      startHour: number;
      endHour: number;
    };
    if (
      typeof timeWindow.startHour !== "number" ||
      typeof timeWindow.endHour !== "number"
    ) {
      return false;
    }

    const currentHour = new Date(context.timestamp).getHours();

    if (timeWindow.startHour <= timeWindow.endHour) {
      return (
        currentHour >= timeWindow.startHour && currentHour <= timeWindow.endHour
      );
    } else {
      // Wrap around midnight
      return (
        currentHour >= timeWindow.startHour || currentHour <= timeWindow.endHour
      );
    }
  }

  private evaluateAuthRequired(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
  ): boolean {
    const required = rule.conditionValue as boolean;
    const hasAuth = !!context.authContext;

    return required ? !hasAuth : hasAuth;
  }

  private evaluateRiskThreshold(
    rule: PolicyRule,
    context: PolicyEvaluationContext,
  ): boolean {
    const threshold = rule.conditionValue as number;
    if (typeof threshold !== "number") return false;

    // Calculate risk score based on context
    const riskScore = this.calculateRiskScore(context);

    return riskScore >= threshold;
  }

  private calculateRiskScore(context: PolicyEvaluationContext): number {
    let score = 0;

    // High risk for certain paths
    if (context.requestPath.includes("/admin")) score += 30;
    if (context.requestPath.includes("/api/v1/admin")) score += 50;

    // Higher risk for non-authenticated requests
    if (!context.authContext) score += 20;

    // Higher risk for certain methods
    if (["DELETE", "PUT", "PATCH"].includes(context.requestMethod)) score += 15;

    // Time-based risk (higher at night)
    const hour = new Date(context.timestamp).getHours();
    if (hour < 6 || hour > 22) score += 10;

    return Math.min(100, score);
  }

  private async getRequestCount(
    tenantId: TenantId,
    endpointId: EndpointId,
    windowStart: Millis,
  ): Promise<number> {
    try {
      const result = await database.queryOne(
        `SELECT COUNT(*) as request_count 
         FROM api_usage_metrics 
         WHERE tenant_id = $1 AND endpoint_id = $2 AND timestamp >= $3`,
        [tenantId, endpointId, windowStart],
      );

      return parseInt(result?.request_count || "0");
    } catch (error) {
      logger.error("Failed to get request count", error as Error);
      return 0;
    }
  }

  private isIPInCIDR(ip: string, cidr: string): boolean {
    // Simple CIDR check implementation
    const [network, prefixLength] = cidr.split("/");
    const prefix = parseInt(prefixLength);

    if (!prefix || prefix < 0 || prefix > 32) return false;

    const ipToNumber = (ip: string) => {
      return (
        ip
          .split(".")
          .reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
      );
    };

    const ipNum = ipToNumber(ip);
    const networkNum = ipToNumber(network);
    const mask = (0xffffffff << (32 - prefix)) >>> 0;

    return (ipNum & mask) === (networkNum & mask);
  }

  private createDecisionFromResults(
    context: PolicyEvaluationContext,
    highestPriorityResult: RuleEvaluationResult | null,
    results: RuleEvaluationResult[],
    policy: Policy,
  ): PolicyDecision {
    if (!highestPriorityResult) {
      return this.createDefaultDecision(context);
    }

    return {
      allowed: highestPriorityResult.action === "ALLOW",
      action: highestPriorityResult.action,
      appliedRules: [highestPriorityResult.ruleId],
      reason: highestPriorityResult.reason,
      riskScore: this.calculateRiskScore(context),
      requiresAudit: ["DENY", "REQUIRE_AUTH"].includes(
        highestPriorityResult.action,
      ),
      throttleDelay:
        highestPriorityResult.action === "THROTTLE"
          ? (1000 as Millis)
          : undefined,
      metadata: {
        policyId: policy.id,
        evaluatedAt: Date.now() as Millis,
      },
    };
  }

  private shouldOverrideDecision(
    current: PolicyDecision,
    candidate: PolicyDecision,
  ): boolean {
    // DENY always wins
    if (candidate.action === "DENY") return true;
    if (current.action === "DENY") return false;

    // Higher risk score wins
    return candidate.riskScore > current.riskScore;
  }

  private createDefaultDecision(
    context: PolicyEvaluationContext,
  ): PolicyDecision {
    const config = environmentConfig.getConfig();
    const defaultAction = config.policy.defaultAction as PolicyAction;

    return {
      allowed: defaultAction === "ALLOW",
      action: defaultAction as PolicyAction,
      appliedRules: [],
      reason: "Default policy action applied",
      riskScore: this.calculateRiskScore(context),
      requiresAudit: false,
      metadata: {
        defaultPolicy: true,
        evaluatedAt: Date.now() as Millis,
      },
    };
  }

  private createErrorDecision(
    context: PolicyEvaluationContext,
    errorMessage: string,
  ): PolicyDecision {
    return {
      allowed: false,
      action: "DENY",
      appliedRules: [],
      reason: `Policy evaluation error: ${errorMessage}`,
      riskScore: 100,
      requiresAudit: true,
      metadata: {
        error: true,
        errorMessage,
        evaluatedAt: Date.now() as Millis,
      },
    };
  }

  private async loadActivePolicies(tenantId: TenantId): Promise<void> {
    if (this.activePolicies.has(tenantId)) {
      return; // Already loaded
    }

    try {
      // Use raw SQL query instead of non-existent method
      const searchResults = await database.queryMany(
        "SELECT * FROM api_endpoints WHERE tenant_id = $1 AND active = true LIMIT 1000",
        [tenantId],
      );

      const policies = new Map<PolicyId, Policy>();

      // This would need to be enhanced to actually load policies from database
      // For now, creating a placeholder implementation

      this.activePolicies.set(tenantId, policies);

      logger.debug("Loaded active policies", {
        tenant_id: tenantId,
        policy_count: policies.size,
      });
    } catch (error) {
      logger.error("Failed to load active policies", error as Error, {
        tenant_id: tenantId,
      });
      this.activePolicies.set(tenantId, new Map());
    }
  }

  private generateCacheKey(
    tenantId: TenantId,
    context: PolicyEvaluationContext,
  ): string {
    const keyData = {
      tenantId,
      endpointId: context.endpointId,
      method: context.requestMethod,
      sourceIP: context.sourceIP,
      authContext: !!context.authContext,
    };

    return Buffer.from(JSON.stringify(keyData)).toString("base64");
  }

  private cacheDecision(
    key: string,
    decision: PolicyDecision,
    ttl: number,
  ): void {
    const now = Date.now() as Millis;

    this.decisionCache.set(key, {
      decision,
      cachedAt: now,
      ttl: ttl as Millis,
    });

    // Limit cache size
    if (this.decisionCache.size > 10000) {
      const oldestKeys = Array.from(this.decisionCache.keys()).slice(0, 1000);
      oldestKeys.forEach((k) => this.decisionCache.delete(k));
    }
  }

  private cleanupCache(): void {
    const now = Date.now() as Millis;
    let cleaned = 0;

    for (const [key, cached] of Array.from(this.decisionCache.entries())) {
      if (now - cached.cachedAt > cached.ttl) {
        this.decisionCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug("Cleaned up policy cache", {
        cleaned_entries: cleaned,
        remaining_entries: this.decisionCache.size,
      });
    }
  }

  private updateStats(): void {
    const now = Date.now();
    const timeSinceLastReset = now - this.lastStatsReset;
    const seconds = timeSinceLastReset / 1000;

    if (seconds > 0) {
      this.evaluationStats.evaluationsPerSecond =
        this.evaluationStats.totalEvaluations / seconds;
      this.evaluationStats.averageExecutionTime =
        this.evaluationStats.totalExecutionTime /
        Math.max(1, this.evaluationStats.totalEvaluations);
    }

    // Reset counters periodically
    if (timeSinceLastReset > 300000) {
      // 5 minutes
      this.lastStatsReset = now;
      this.evaluationStats.totalEvaluations = 0;
      this.evaluationStats.totalExecutionTime = 0;
    }
  }

  async reloadPolicies(tenantId: TenantId): Promise<void> {
    this.activePolicies.delete(tenantId);
    await this.loadActivePolicies(tenantId);
    logger.info("Policies reloaded", { tenant_id: tenantId });
  }

  getStats(): PolicyEngineStats {
    return { ...this.evaluationStats };
  }

  clearCache(): void {
    this.decisionCache.clear();
    this.activePolicies.clear();
    logger.info("Policy engine cache cleared");
  }

  async batchEvaluate(
    tenantId: TenantId,
    contexts: PolicyEvaluationContext[],
  ): Promise<PolicyExecutionResult[]> {
    const results: PolicyExecutionResult[] = [];

    for (const context of contexts) {
      try {
        const result = await this.evaluatePolicy(tenantId, context);
        results.push(result);
      } catch (error) {
        logger.error("Batch policy evaluation failed", error as Error);
        results.push({
          decision: this.createErrorDecision(context, (error as Error).message),
          executionTime: 0,
          rulesEvaluated: 0,
          cacheHit: false,
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const policyEngine = PolicyEngine.getInstance();

// Helper functions
export async function evaluateRequest(
  tenantId: TenantId,
  context: PolicyEvaluationContext,
): Promise<PolicyExecutionResult> {
  return policyEngine.evaluatePolicy(tenantId, context);
}

export async function reloadTenantPolicies(tenantId: TenantId): Promise<void> {
  return policyEngine.reloadPolicies(tenantId);
}

export function getPolicyEngineStats(): PolicyEngineStats {
  return policyEngine.getStats();
}

export function clearPolicyCache(): void {
  policyEngine.clearCache();
}

export default PolicyEngine;
