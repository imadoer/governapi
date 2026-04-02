/**
 * Policy Enforcement Engine
 * Request blocking, rate limiting, audit logging, alert generation
 */
import {
  TenantId,
  EndpointId,
  PolicyDecision,
  PolicyEvaluationContext,
  PolicyAction,
  ThreatEvent,
  ComplianceEvidence,
  Millis,
  JsonValue,
  SystemError,
} from "../core/types";
import { database } from "../infrastructure/database";
import { logger, recordPolicyMetrics } from "../infrastructure/monitoring";
import { policyEngine } from "./engine";
import { environmentConfig } from "../config/environment";

export interface EnforcementResult {
  readonly decision: PolicyDecision;
  readonly action: EnforcementAction;
  readonly delay?: Millis;
  readonly reason: string;
  readonly auditGenerated: boolean;
  readonly alertGenerated: boolean;
}

export type EnforcementAction =
  | "PASS_THROUGH"
  | "BLOCK_REQUEST"
  | "THROTTLE_REQUEST"
  | "REQUIRE_ADDITIONAL_AUTH"
  | "LOG_ONLY"
  | "REDIRECT";

export interface ThrottleState {
  readonly requestCount: number;
  readonly windowStart: Millis;
  readonly delayMs: Millis;
  readonly nextAllowedTime: Millis;
}

export interface EnforcementStats {
  totalRequests: number;
  blockedRequests: number;
  throttledRequests: number;
  loggedRequests: number;
  averageProcessingTime: number;
  totalDecisionTime: number;
}

export interface EnforcementConfig {
  readonly enableRealTimeBlocking: boolean;
  readonly enableAuditLogging: boolean;
  readonly enableThreatDetection: boolean;
  readonly maxThrottleDelay: Millis;
  readonly emergencyBypass: boolean;
}

export class PolicyEnforcement {
  private static instance: PolicyEnforcement;
  private throttleStates = new Map<string, ThrottleState>();
  private emergencyMode = new Set<TenantId>();
  private enforcementStats: EnforcementStats = {
    totalRequests: 0,
    blockedRequests: 0,
    throttledRequests: 0,
    loggedRequests: 0,
    averageProcessingTime: 0,
    totalDecisionTime: 0,
  };

  private constructor() {
    // Cleanup throttle states periodically
    setInterval(() => this.cleanupThrottleStates(), 300000); // 5 minutes
  }

  static getInstance(): PolicyEnforcement {
    if (!PolicyEnforcement.instance) {
      PolicyEnforcement.instance = new PolicyEnforcement();
    }
    return PolicyEnforcement.instance;
  }

  async enforcePolicy(
    tenantId: TenantId,
    context: PolicyEvaluationContext,
  ): Promise<EnforcementResult> {
    const startTime = Date.now() as Millis;

    try {
      // Check emergency mode
      if (this.emergencyMode.has(tenantId)) {
        return this.createPassThroughResult("Emergency mode enabled");
      }

      // Evaluate policy
      const policyResult = await policyEngine.evaluatePolicy(tenantId, context);
      const decision = policyResult.decision;

      // Determine enforcement action
      const action = this.determineEnforcementAction(decision);
      let delay: Millis | undefined;
      let auditGenerated = false;
      let alertGenerated = false;

      // Apply enforcement based on decision
      switch (action) {
        case "BLOCK_REQUEST":
          auditGenerated = await this.generateAuditLog(
            tenantId,
            context,
            decision,
            "BLOCKED",
          );
          alertGenerated = await this.generateSecurityAlert(
            tenantId,
            context,
            decision,
          );
          break;

        case "THROTTLE_REQUEST":
          delay = await this.applyThrottling(tenantId, context, decision);
          auditGenerated = await this.generateAuditLog(
            tenantId,
            context,
            decision,
            "THROTTLED",
          );
          break;

        case "REQUIRE_ADDITIONAL_AUTH":
          auditGenerated = await this.generateAuditLog(
            tenantId,
            context,
            decision,
            "AUTH_REQUIRED",
          );
          break;

        case "LOG_ONLY":
          auditGenerated = await this.generateAuditLog(
            tenantId,
            context,
            decision,
            "LOGGED",
          );
          break;

        case "PASS_THROUGH":
          // Log successful requests for analytics
          await this.logSuccessfulRequest(tenantId, context);
          break;
      }

      // Update metrics
      this.updateEnforcementStats(action, (Date.now() - startTime) as Millis);

      // Record policy metrics
      recordPolicyMetrics(
        tenantId,
        "enforcement" as any,
        decision.action,
        action,
        (Date.now() - startTime) as Millis,
        action === "BLOCK_REQUEST",
      );

      return {
        decision,
        action,
        delay,
        reason: this.getEnforcementReason(decision, action),
        auditGenerated,
        alertGenerated,
      };
    } catch (error) {
      logger.error("Policy enforcement failed", error as Error, {
        tenant_id: tenantId,
        endpoint_id: context.endpointId,
        duration_ms: (Date.now() - startTime) as Millis,
      });

      // Fail-safe: allow request but log error
      return this.createPassThroughResult(
        `Enforcement error: ${(error as Error).message}`,
      );
    }
  }

  private determineEnforcementAction(
    decision: PolicyDecision,
  ): EnforcementAction {
    switch (decision.action) {
      case "DENY":
        return "BLOCK_REQUEST";
      case "THROTTLE":
        return "THROTTLE_REQUEST";
      case "REQUIRE_AUTH":
        return "REQUIRE_ADDITIONAL_AUTH";
      case "LOG":
        return "LOG_ONLY";
      case "ALLOW":
      default:
        return "PASS_THROUGH";
    }
  }

  private async applyThrottling(
    tenantId: TenantId,
    context: PolicyEvaluationContext,
    decision: PolicyDecision,
  ): Promise<Millis> {
    const throttleKey = `${tenantId}:${context.endpointId}:${context.sourceIP}`;
    const now = Date.now() as Millis;

    const currentState = this.throttleStates.get(throttleKey);
    const baseDelay = decision.throttleDelay || (1000 as Millis);

    if (!currentState) {
      // First throttle for this key
      const newState: ThrottleState = {
        requestCount: 1,
        windowStart: now as Millis,
        delayMs: baseDelay,
        nextAllowedTime: (now + baseDelay) as Millis,
      };
      this.throttleStates.set(throttleKey, newState);
      return baseDelay;
    }

    // Check if we're in the same window (1 minute)
    const windowDuration = 60000; // 1 minute
    if (now - currentState.windowStart < windowDuration) {
      // Exponential backoff
      const exponentialDelay = Math.min(30000, currentState.delayMs * 2);
      const updatedState: ThrottleState = {
        requestCount: currentState.requestCount + 1,
        windowStart: now as Millis,
        delayMs: exponentialDelay as Millis,
        nextAllowedTime: (now + exponentialDelay) as Millis,
      };
      this.throttleStates.set(throttleKey, updatedState);
      return exponentialDelay as Millis;
    } else {
      // New window, reset
      const newState: ThrottleState = {
        requestCount: 1,
        windowStart: now as Millis,
        delayMs: baseDelay,
        nextAllowedTime: (now + baseDelay) as Millis,
      };
      this.throttleStates.set(throttleKey, newState);
      return baseDelay;
    }
  }

  private async generateAuditLog(
    tenantId: TenantId,
    context: PolicyEvaluationContext,
    decision: PolicyDecision,
    enforcementAction: string,
  ): Promise<boolean> {
    try {
      const auditEvent = {
        tenantId,
        endpointId: context.endpointId,
        sourceIP: context.sourceIP,
        requestMethod: context.requestMethod,
        requestPath: context.requestPath,
        decision: decision.action,
        enforcementAction,
        reason: decision.reason,
        riskScore: decision.riskScore,
        appliedRules: decision.appliedRules,
        timestamp: Date.now() as Millis,
        userAgent: context.requestHeaders["user-agent"] || "unknown",
        authContext: context.authContext ? "authenticated" : "anonymous",
      };

      // Store compliance evidence
      const evidenceData = JSON.stringify(auditEvent);
      const dataHash = this.generateHash(evidenceData);
      const signature = this.generateSignature(evidenceData);

      await database.query(
        `INSERT INTO compliance_evidence (
          id, tenant_id, evidence_type, endpoint_id, description,
          data_hash, signature, metadata, retention_expiry, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          `audit_${crypto.randomUUID()}`,
          tenantId,
          "POLICY_VIOLATION",
          context.endpointId,
          `Policy enforcement: ${enforcementAction}`,
          dataHash,
          signature,
          evidenceData,
          ((Date.now() as Millis) + 365 * 24 * 60 * 60 * 1000) as Millis, // 1 year
        ],
      );

      return true;
    } catch (error) {
      logger.error("Failed to generate audit log", error as Error);
      return false;
    }
  }

  private async generateSecurityAlert(
    tenantId: TenantId,
    context: PolicyEvaluationContext,
    decision: PolicyDecision,
  ): Promise<boolean> {
    try {
      // Only generate alerts for high-risk violations
      if (decision.riskScore < 70) {
        return false;
      }

      const alertData = {
        tenantId,
        threatType: "POLICY_VIOLATION",
        severity: decision.riskScore > 90 ? "CRITICAL" : "HIGH",
        endpointId: context.endpointId,
        sourceIP: context.sourceIP,
        description: `High-risk policy violation detected: ${decision.reason}`,
        confidence: Math.min(100, decision.riskScore * 1.2),
        evidenceIds: [],
        resolved: false,
        metadata: {
          policyDecision: decision,
          enforcementAction: "BLOCK_REQUEST",
          requestMethod: context.requestMethod,
          requestPath: context.requestPath,
        } as any,
      };

      await database.query(
        `INSERT INTO threat_events (
          id, tenant_id, threat_type, severity, endpoint_id, source_ip,
          description, confidence, evidence_ids, resolved, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          `threat_${crypto.randomUUID()}`,
          tenantId,
          alertData.threatType,
          alertData.severity,
          alertData.endpointId,
          alertData.sourceIP,
          alertData.description,
          alertData.confidence,
          JSON.stringify(alertData.evidenceIds),
          alertData.resolved,
          JSON.stringify(alertData.metadata),
        ],
      );

      // Store compliance evidence for the alert
      const evidenceData = JSON.stringify({
        alertData,
        context,
        decision,
        generatedAt: Date.now(),
      });

      await database.query(
        `INSERT INTO compliance_evidence (
          id, tenant_id, evidence_type, endpoint_id, description,
          data_hash, signature, metadata, retention_expiry, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          `evidence_${crypto.randomUUID()}`,
          tenantId,
          "THREAT_DETECTION",
          context.endpointId,
          `Security alert generated for policy violation`,
          this.generateHash(evidenceData),
          this.generateSignature(evidenceData),
          evidenceData,
          ((Date.now() as Millis) + 7 * 365 * 24 * 60 * 60 * 1000) as Millis, // 7 years
        ],
      );

      return true;
    } catch (error) {
      logger.error("Failed to generate security alert", error as Error);
      return false;
    }
  }

  private async logSuccessfulRequest(
    tenantId: TenantId,
    context: PolicyEvaluationContext,
  ): Promise<void> {
    try {
      await database.query(
        `INSERT INTO api_usage_metrics (
          tenant_id, endpoint_id, timestamp, request_count,
          response_time, status_code, source_ip, user_agent, auth_context
        ) VALUES ($1, $2, $3, 1, 0, 200, $4, $5, $6)`,
        [
          tenantId,
          context.endpointId,
          Date.now(),
          context.sourceIP,
          context.requestHeaders["user-agent"] || "unknown",
          context.authContext ? JSON.stringify(context.authContext) : null,
        ],
      );
    } catch (error) {
      logger.error("Failed to log successful request", error as Error);
    }
  }

  private createPassThroughResult(reason: string): EnforcementResult {
    return {
      decision: {
        allowed: true,
        action: "ALLOW",
        appliedRules: [],
        reason,
        riskScore: 0,
        requiresAudit: false,
        metadata: {},
      },
      action: "PASS_THROUGH",
      reason,
      auditGenerated: false,
      alertGenerated: false,
    };
  }

  private getEnforcementReason(
    decision: PolicyDecision,
    action: EnforcementAction,
  ): string {
    switch (action) {
      case "BLOCK_REQUEST":
        return `Request blocked: ${decision.reason}`;
      case "THROTTLE_REQUEST":
        return `Request throttled: ${decision.reason}`;
      case "REQUIRE_ADDITIONAL_AUTH":
        return `Additional authentication required: ${decision.reason}`;
      case "LOG_ONLY":
        return `Request logged: ${decision.reason}`;
      case "PASS_THROUGH":
      default:
        return `Request allowed: ${decision.reason}`;
    }
  }

  private updateEnforcementStats(
    action: EnforcementAction,
    processingTime: number,
  ): void {
    this.enforcementStats.totalRequests++;
    this.enforcementStats.totalDecisionTime += processingTime;

    switch (action) {
      case "BLOCK_REQUEST":
        this.enforcementStats.blockedRequests++;
        break;
      case "THROTTLE_REQUEST":
        this.enforcementStats.throttledRequests++;
        break;
      case "LOG_ONLY":
        this.enforcementStats.loggedRequests++;
        break;
    }

    // Update average processing time
    this.enforcementStats.averageProcessingTime =
      this.enforcementStats.totalDecisionTime /
      this.enforcementStats.totalRequests;
  }

  private cleanupThrottleStates(): void {
    const now = Date.now() as Millis;
    const maxAge = 300000; // 5 minutes

    for (const [key, state] of Array.from(this.throttleStates.entries())) {
      if (now - state.windowStart > maxAge) {
        this.throttleStates.delete(key);
      }
    }
  }

  private generateHash(data: string): string {
    // Simple hash implementation - in production, use crypto module
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }

  private generateSignature(data: string): string {
    const config = environmentConfig.getConfig();
    // Simple signature - in production, use proper cryptographic signing
    return this.generateHash(data + config.security.apiSigningKey);
  }

  // Enhanced context preprocessing
  async preprocessContext(
    tenantId: TenantId,
    baseContext: PolicyEvaluationContext,
  ): Promise<PolicyEvaluationContext> {
    const now = Date.now() as Millis;

    // Enhanced context with additional risk factors
    const enhancedContext: PolicyEvaluationContext = {
      ...baseContext,
      timestamp: Date.now() as Millis as Millis,
      // Note: Removed metadata field that doesn't exist in the interface
    };

    return enhancedContext;
  }

  // Real-time policy enforcement with preprocessing
  async enforceWithPreprocessing(
    tenantId: TenantId,
    baseContext: PolicyEvaluationContext,
  ): Promise<EnforcementResult> {
    const enhancedContext = await this.preprocessContext(tenantId, baseContext);
    return this.enforcePolicy(tenantId, enhancedContext);
  }

  // Bulk enforcement for batch processing
  async bulkEnforce(
    tenantId: TenantId,
    contexts: PolicyEvaluationContext[],
  ): Promise<EnforcementResult[]> {
    const results: EnforcementResult[] = [];

    for (const context of contexts) {
      try {
        const result = await this.enforcePolicy(tenantId, context);
        results.push(result);
      } catch (error) {
        logger.error("Bulk enforcement failed for context", error as Error);
        results.push(
          this.createPassThroughResult(
            `Bulk enforcement error: ${(error as Error).message}`,
          ),
        );
      }
    }

    return results;
  }

  // Emergency controls
  enableEmergencyMode(tenantId: TenantId): void {
    this.emergencyMode.add(tenantId);
    logger.warn("Emergency mode enabled", { tenant_id: tenantId });
  }

  disableEmergencyMode(tenantId: TenantId): void {
    this.emergencyMode.delete(tenantId);
    logger.info("Emergency mode disabled", { tenant_id: tenantId });
  }

  async warmupCache(tenantId: TenantId): Promise<void> {
    try {
      // Pre-evaluate common policy scenarios to warm up cache
      const commonContexts = this.generateCommonContexts(tenantId);

      for (const context of commonContexts) {
        await policyEngine.evaluatePolicy(tenantId, context);
      }

      logger.info("Policy enforcement cache warmed up", {
        tenant_id: tenantId,
        contexts_evaluated: commonContexts.length,
      });
    } catch (error) {
      logger.error("Failed to warm up enforcement cache", error as Error);
    }
  }

  private generateCommonContexts(
    tenantId: TenantId,
  ): PolicyEvaluationContext[] {
    const commonPaths = ["/api/v1/users", "/api/v1/data", "/admin", "/health"];
    const commonMethods = ["GET", "POST", "PUT", "DELETE"];
    const commonIPs = ["192.168.1.1", "10.0.0.1", "127.0.0.1"];

    const contexts: PolicyEvaluationContext[] = [];

    for (const path of commonPaths) {
      for (const method of commonMethods) {
        for (const ip of commonIPs) {
          contexts.push({
            tenantId,
            endpointId: `${method}:localhost:443${path}` as any,
            requestMethod: method as any,
            requestPath: path,
            sourceIP: ip,
            requestHeaders: {
              "user-agent": "test-agent",
              "content-type": "application/json",
            },
            timestamp: Date.now() as Millis as Millis,
          });
        }
      }
    }

    return contexts;
  }

  // Statistics and monitoring
  getEnforcementStats(): EnforcementStats {
    return { ...this.enforcementStats };
  }

  resetStats(): void {
    this.enforcementStats = {
      totalRequests: 0,
      blockedRequests: 0,
      throttledRequests: 0,
      loggedRequests: 0,
      averageProcessingTime: 0,
      totalDecisionTime: 0,
    };
  }

  getThrottleStates(): Map<string, ThrottleState> {
    return new Map(this.throttleStates);
  }

  async getEnforcementHistory(
    tenantId: TenantId,
    hours: number = 24,
  ): Promise<any[]> {
    const startTime = Date.now() - hours * 60 * 60 * 1000;

    return database.queryMany(
      `SELECT * FROM compliance_evidence 
       WHERE tenant_id = $1 AND evidence_type = 'POLICY_VIOLATION' 
       AND created_at >= to_timestamp($2/1000)
       ORDER BY created_at DESC`,
      [tenantId, startTime],
    );
  }

  async getThreatAlerts(
    tenantId: TenantId,
    hours: number = 24,
  ): Promise<any[]> {
    const startTime = Date.now() - hours * 60 * 60 * 1000;

    return database.queryMany(
      `SELECT * FROM threat_events 
       WHERE tenant_id = $1 AND threat_type = 'POLICY_VIOLATION'
       AND created_at >= to_timestamp($2/1000)
       ORDER BY created_at DESC`,
      [tenantId, startTime],
    );
  }
}

// Export singleton instance
export const policyEnforcement = PolicyEnforcement.getInstance();

// Helper functions
export async function enforceRequest(
  tenantId: TenantId,
  context: PolicyEvaluationContext,
): Promise<EnforcementResult> {
  return policyEnforcement.enforcePolicy(tenantId, context);
}

export async function preprocessAndEnforce(
  tenantId: TenantId,
  context: PolicyEvaluationContext,
): Promise<EnforcementResult> {
  return policyEnforcement.enforceWithPreprocessing(tenantId, context);
}

export async function warmupEnforcementCache(
  tenantId: TenantId,
): Promise<void> {
  return policyEnforcement.warmupCache(tenantId);
}

export function createEnforcementMiddleware(tenantId: TenantId) {
  return async (
    context: PolicyEvaluationContext,
  ): Promise<EnforcementResult> => {
    return policyEnforcement.enforcePolicy(tenantId, context);
  };
}

export default PolicyEnforcement;
