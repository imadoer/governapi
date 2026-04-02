/**
 * Monitoring Infrastructure Layer
 * Prometheus metrics, health checks, SLA tracking, and observability
 */

import {
  register,
  Counter,
  Histogram,
  Gauge,
  Summary,
  collectDefaultMetrics,
} from "prom-client";
import { createLogger, transports, format } from "winston";
import { environmentConfig } from "../config/environment";
import { database } from "./database";
import {
  TenantId,
  EndpointId,
  PolicyId,
  SystemErrorCode,
  RiskLevel,
  Millis,
  ComponentHealth,
  SystemHealth,
} from "../core/types";

export interface MetricsSnapshot {
  readonly timestamp: Millis;
  readonly apiRequestsTotal: number;
  readonly policyEvaluationsTotal: number;
  readonly threatEventsTotal: number;
  readonly avgResponseTime: number;
  readonly errorRate: number;
  readonly activeEndpoints: number;
  readonly activePolicies: number;
}

export interface SLAMetrics {
  readonly availability: number;
  readonly responseTime95th: number;
  readonly errorRate: number;
  readonly throughput: number;
  readonly complianceScore: number;
}

export interface AlertRule {
  readonly name: string;
  readonly metric: string;
  readonly threshold: number;
  readonly comparison: "gt" | "lt" | "eq";
  readonly duration: Millis;
  readonly severity: RiskLevel;
  readonly enabled: boolean;
}

class PrometheusMetrics {
  private static instance: PrometheusMetrics;
  private prefix: string;

  // Core API metrics
  public readonly apiRequestsTotal: Counter<string>;
  public readonly apiRequestDuration: Histogram<string>;
  public readonly apiRequestsInFlight: Gauge<string>;
  public readonly apiErrorsTotal: Counter<string>;

  // Policy engine metrics
  public readonly policyEvaluationsTotal: Counter<string>;
  public readonly policyEvaluationDuration: Histogram<string>;
  public readonly policyRulesActive: Gauge<string>;
  public readonly policyViolationsTotal: Counter<string>;

  // Discovery metrics
  public readonly endpointsDiscovered: Counter<string>;
  public readonly endpointsActive: Gauge<string>;
  public readonly scanDuration: Histogram<string>;
  public readonly scanErrors: Counter<string>;

  // Threat detection metrics
  public readonly threatEventsTotal: Counter<string>;
  public readonly threatDetectionLatency: Histogram<string>;
  public readonly activeThreats: Gauge<string>;
  public readonly falsePositives: Counter<string>;

  // Compliance metrics
  public readonly complianceEvidence: Counter<string>;
  public readonly complianceReports: Counter<string>;
  public readonly auditEvents: Counter<string>;

  // System health metrics
  public readonly systemHealth: Gauge<string>;
  public readonly databaseConnections: Gauge<string>;
  public readonly redisConnections: Gauge<string>;
  public readonly memoryUsage: Gauge<string>;
  public readonly cpuUsage: Gauge<string>;

  private constructor() {
    const config = environmentConfig.getConfig();
    this.prefix = config.monitoring.metricsPrefix;

    // Initialize API metrics
    this.apiRequestsTotal = new Counter({
      name: `${this.prefix}_api_requests_total`,
      help: "Total number of API requests processed",
      labelNames: [
        "tenant_id",
        "endpoint_id",
        "method",
        "status_code",
        "data_classification",
      ],
    });

    this.apiRequestDuration = new Histogram({
      name: `${this.prefix}_api_request_duration_milliseconds`,
      help: "API request duration in milliseconds",
      labelNames: ["tenant_id", "endpoint_id", "method"],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000],
    });

    this.apiRequestsInFlight = new Gauge({
      name: `${this.prefix}_api_requests_in_flight`,
      help: "Number of API requests currently being processed",
      labelNames: ["tenant_id"],
    });

    this.apiErrorsTotal = new Counter({
      name: `${this.prefix}_api_errors_total`,
      help: "Total number of API errors",
      labelNames: ["tenant_id", "endpoint_id", "error_code", "error_type"],
    });

    // Initialize policy metrics
    this.policyEvaluationsTotal = new Counter({
      name: `${this.prefix}_policy_evaluations_total`,
      help: "Total number of policy evaluations performed",
      labelNames: ["tenant_id", "policy_id", "decision", "rule_matched"],
    });

    this.policyEvaluationDuration = new Histogram({
      name: `${this.prefix}_policy_evaluation_duration_milliseconds`,
      help: "Policy evaluation duration in milliseconds",
      labelNames: ["tenant_id", "policy_id"],
      buckets: [1, 2, 5, 10, 25, 50, 100, 250, 500],
    });

    this.policyRulesActive = new Gauge({
      name: `${this.prefix}_policy_rules_active`,
      help: "Number of active policy rules",
      labelNames: ["tenant_id", "policy_id"],
    });

    this.policyViolationsTotal = new Counter({
      name: `${this.prefix}_policy_violations_total`,
      help: "Total number of policy violations detected",
      labelNames: ["tenant_id", "policy_id", "rule_id", "severity"],
    });

    // Initialize discovery metrics
    this.endpointsDiscovered = new Counter({
      name: `${this.prefix}_endpoints_discovered_total`,
      help: "Total number of API endpoints discovered",
      labelNames: ["tenant_id", "discovery_source", "data_classification"],
    });

    this.endpointsActive = new Gauge({
      name: `${this.prefix}_endpoints_active`,
      help: "Number of active API endpoints",
      labelNames: ["tenant_id", "data_classification"],
    });

    this.scanDuration = new Histogram({
      name: `${this.prefix}_discovery_scan_duration_milliseconds`,
      help: "API discovery scan duration in milliseconds",
      labelNames: ["tenant_id", "scan_type"],
      buckets: [1000, 5000, 10000, 30000, 60000, 300000, 600000],
    });

    this.scanErrors = new Counter({
      name: `${this.prefix}_discovery_scan_errors_total`,
      help: "Total number of discovery scan errors",
      labelNames: ["tenant_id", "error_type", "target_host"],
    });

    // Initialize threat detection metrics
    this.threatEventsTotal = new Counter({
      name: `${this.prefix}_threat_events_total`,
      help: "Total number of threat events detected",
      labelNames: ["tenant_id", "threat_type", "severity", "source_ip"],
    });

    this.threatDetectionLatency = new Histogram({
      name: `${this.prefix}_threat_detection_latency_milliseconds`,
      help: "Threat detection processing latency",
      labelNames: ["tenant_id", "detection_type"],
      buckets: [10, 25, 50, 100, 250, 500, 1000, 2500],
    });

    this.activeThreats = new Gauge({
      name: `${this.prefix}_threats_active`,
      help: "Number of unresolved threat events",
      labelNames: ["tenant_id", "severity"],
    });

    this.falsePositives = new Counter({
      name: `${this.prefix}_threat_false_positives_total`,
      help: "Total number of false positive threat detections",
      labelNames: ["tenant_id", "threat_type"],
    });

    // Initialize compliance metrics
    this.complianceEvidence = new Counter({
      name: `${this.prefix}_compliance_evidence_total`,
      help: "Total compliance evidence items collected",
      labelNames: ["tenant_id", "evidence_type", "framework"],
    });

    this.complianceReports = new Counter({
      name: `${this.prefix}_compliance_reports_total`,
      help: "Total compliance reports generated",
      labelNames: ["tenant_id", "framework", "status"],
    });

    this.auditEvents = new Counter({
      name: `${this.prefix}_audit_events_total`,
      help: "Total audit events logged",
      labelNames: ["tenant_id", "event_type", "user_id"],
    });

    // Initialize system health metrics
    this.systemHealth = new Gauge({
      name: `${this.prefix}_system_health_score`,
      help: "Overall system health score (0-100)",
      labelNames: ["component"],
    });

    this.databaseConnections = new Gauge({
      name: `${this.prefix}_database_connections_active`,
      help: "Number of active database connections",
    });

    this.redisConnections = new Gauge({
      name: `${this.prefix}_redis_connections_active`,
      help: "Number of active Redis connections",
    });

    this.memoryUsage = new Gauge({
      name: `${this.prefix}_memory_usage_bytes`,
      help: "Memory usage in bytes",
      labelNames: ["type"],
    });

    this.cpuUsage = new Gauge({
      name: `${this.prefix}_cpu_usage_percent`,
      help: "CPU usage percentage",
    });

    // Collect default Node.js metrics
    collectDefaultMetrics({ register, prefix: this.prefix });
  }

  static getInstance(): PrometheusMetrics {
    if (!PrometheusMetrics.instance) {
      PrometheusMetrics.instance = new PrometheusMetrics();
    }
    return PrometheusMetrics.instance;
  }

  getRegistry() {
    return register;
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  recordAPIRequest(
    tenantId: TenantId,
    endpointId: EndpointId,
    method: string,
    statusCode: number,
    duration: number,
    dataClassification: string,
  ): void {
    this.apiRequestsTotal.inc({
      tenant_id: tenantId,
      endpoint_id: endpointId,
      method,
      status_code: statusCode.toString(),
      data_classification: dataClassification,
    });

    this.apiRequestDuration.observe(
      { tenant_id: tenantId, endpoint_id: endpointId, method },
      duration,
    );

    if (statusCode >= 400) {
      this.apiErrorsTotal.inc({
        tenant_id: tenantId,
        endpoint_id: endpointId,
        error_code: statusCode.toString(),
        error_type: statusCode >= 500 ? "server_error" : "client_error",
      });
    }
  }

  recordPolicyEvaluation(
    tenantId: TenantId,
    policyId: PolicyId,
    decision: string,
    ruleMatched: string,
    duration: number,
    violation: boolean = false,
  ): void {
    this.policyEvaluationsTotal.inc({
      tenant_id: tenantId,
      policy_id: policyId,
      decision,
      rule_matched: ruleMatched,
    });

    this.policyEvaluationDuration.observe(
      { tenant_id: tenantId, policy_id: policyId },
      duration,
    );

    if (violation) {
      this.policyViolationsTotal.inc({
        tenant_id: tenantId,
        policy_id: policyId,
        rule_id: ruleMatched,
        severity: "HIGH", // Will be determined by actual rule
      });
    }
  }

  recordEndpointDiscovery(
    tenantId: TenantId,
    discoverySource: string,
    dataClassification: string,
  ): void {
    this.endpointsDiscovered.inc({
      tenant_id: tenantId,
      discovery_source: discoverySource,
      data_classification: dataClassification,
    });
  }

  recordThreatEvent(
    tenantId: TenantId,
    threatType: string,
    severity: RiskLevel,
    sourceIP: string,
    detectionLatency: number,
  ): void {
    this.threatEventsTotal.inc({
      tenant_id: tenantId,
      threat_type: threatType,
      severity,
      source_ip: sourceIP,
    });

    this.threatDetectionLatency.observe(
      { tenant_id: tenantId, detection_type: threatType },
      detectionLatency,
    );
  }

  updateSystemHealth(component: string, score: number): void {
    this.systemHealth.set({ component }, score);
  }

  updateResourceUsage(): void {
    const memUsage = process.memoryUsage();
    this.memoryUsage.set({ type: "heap_used" }, memUsage.heapUsed);
    this.memoryUsage.set({ type: "heap_total" }, memUsage.heapTotal);
    this.memoryUsage.set({ type: "external" }, memUsage.external);
    this.memoryUsage.set({ type: "rss" }, memUsage.rss);

    // CPU usage calculation
    const startUsage = process.cpuUsage();
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage);
      const totalUsage = (endUsage.user + endUsage.system) / 1000000; // Convert to seconds
      this.cpuUsage.set(Math.min(100, totalUsage * 100));
    }, 1000);
  }
}

class StructuredLogger {
  private logger: any;
  private metricsCollector: PrometheusMetrics;

  constructor() {
    const config = environmentConfig.getConfig();
    this.metricsCollector = PrometheusMetrics.getInstance();

    const logFormat = config.monitoring.structuredLogging
      ? format.combine(
          format.timestamp(),
          format.errors({ stack: true }),
          format.json(),
        )
      : format.combine(
          format.timestamp(),
          format.errors({ stack: true }),
          format.printf(({ timestamp, level, message, ...meta }) => {
            return `${timestamp} [${level.toUpperCase()}] ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta) : ""
            }`;
          }),
        );

    this.logger = createLogger({
      level: config.monitoring.logLevel,
      format: logFormat,
      transports: [
        new transports.Console({
          handleExceptions: true,
          handleRejections: true,
        }),
        new transports.File({
          filename: "/opt/apiguard/logs/error.log",
          level: "error",
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 10,
        }),
        new transports.File({
          filename: "/opt/apiguard/logs/combined.log",
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 20,
        }),
      ],
    });
  }

  info(message: string, metadata?: any): void {
    this.logger.info(message, metadata);
  }

  warn(message: string, metadata?: any): void {
    this.logger.warn(message, metadata);
  }

  error(message: string, error?: Error, metadata?: any): void {
    this.logger.error(message, {
      error: error?.message,
      stack: error?.stack,
      ...metadata,
    });
  }

  debug(message: string, metadata?: any): void {
    this.logger.debug(message, metadata);
  }

  logAPIRequest(
    tenantId: TenantId,
    endpointId: EndpointId,
    method: string,
    statusCode: number,
    duration: number,
    sourceIP: string,
  ): void {
    this.info("API request processed", {
      tenant_id: tenantId,
      endpoint_id: endpointId,
      method,
      status_code: statusCode,
      duration_ms: duration,
      source_ip: sourceIP,
      event_type: "api_request",
    });
  }

  logPolicyEvaluation(
    tenantId: TenantId,
    policyId: PolicyId,
    decision: string,
    duration: number,
    rulesEvaluated: number,
  ): void {
    this.info("Policy evaluation completed", {
      tenant_id: tenantId,
      policy_id: policyId,
      decision,
      duration_ms: duration,
      rules_evaluated: rulesEvaluated,
      event_type: "policy_evaluation",
    });
  }

  logThreatDetection(
    tenantId: TenantId,
    threatType: string,
    severity: RiskLevel,
    sourceIP: string,
    confidence: number,
  ): void {
    this.warn("Threat detected", {
      tenant_id: tenantId,
      threat_type: threatType,
      severity,
      source_ip: sourceIP,
      confidence,
      event_type: "threat_detection",
    });
  }

  logSecurityEvent(
    tenantId: TenantId,
    eventType: string,
    description: string,
    sourceIP: string,
    userId?: string,
  ): void {
    this.warn("Security event logged", {
      tenant_id: tenantId,
      event_type: eventType,
      description,
      source_ip: sourceIP,
      user_id: userId,
      event_category: "security",
    });
  }
}

class HealthChecker {
  private static instance: HealthChecker;
  private checks: Map<string, () => Promise<ComponentHealth>> = new Map();
  private lastHealthCheck: SystemHealth | null = null;
  private checkInterval: NodeJS.Timeout | null = null;
  private metrics: PrometheusMetrics;
  private logger: StructuredLogger;

  private constructor() {
    this.metrics = PrometheusMetrics.getInstance();
    this.logger = new StructuredLogger();
    this.setupHealthChecks();
  }

  static getInstance(): HealthChecker {
    if (!HealthChecker.instance) {
      HealthChecker.instance = new HealthChecker();
    }
    return HealthChecker.instance;
  }

  private setupHealthChecks(): void {
    // Database health check
    this.checks.set("database", async (): Promise<ComponentHealth> => {
      const startTime = Date.now();
      try {
        const healthMetrics = await database.getHealthMetrics();
        const responseTime = Date.now() - startTime;

        this.metrics.databaseConnections.set(healthMetrics.connectionCount);

        const status =
          healthMetrics.connectionCount > 15
            ? "DEGRADED"
            : healthMetrics.activeQueries > 50
              ? "DEGRADED"
              : "UP";

        return {
          status,
          responseTime,
          errorRate: 0,
          lastChecked: Date.now() as Millis,
        };
      } catch (error) {
        return {
          status: "DOWN",
          responseTime: Date.now() - startTime,
          errorRate: 1,
          lastError: (error as Error).message,
          lastChecked: Date.now() as Millis,
        };
      }
    });

    // Redis health check
    this.checks.set("redis", async (): Promise<ComponentHealth> => {
      const startTime = Date.now();
      try {
        const redis = require("ioredis");
        const redisConfig = environmentConfig.getRedisConfig();
        const client = new redis({
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.database,
          connectTimeout: 5000,
          lazyConnect: true,
        });

        const pong = await client.ping();
        const responseTime = Date.now() - startTime;
        await client.quit();

        return {
          status: pong === "PONG" ? "UP" : "DOWN",
          responseTime,
          errorRate: 0,
          lastChecked: Date.now() as Millis,
        };
      } catch (error) {
        return {
          status: "DOWN",
          responseTime: Date.now() - startTime,
          errorRate: 1,
          lastError: (error as Error).message,
          lastChecked: Date.now() as Millis,
        };
      }
    });

    // Memory health check
    this.checks.set("memory", async (): Promise<ComponentHealth> => {
      const memUsage = process.memoryUsage();
      const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

      const status =
        heapUsedPercent > 90
          ? "DOWN"
          : heapUsedPercent > 75
            ? "DEGRADED"
            : "UP";

      return {
        status,
        responseTime: 0,
        errorRate: heapUsedPercent > 90 ? 1 : 0,
        lastChecked: Date.now() as Millis,
      };
    });

    // External services health check
    this.checks.set("external_services", async (): Promise<ComponentHealth> => {
      // Check critical external dependencies (placeholder for actual integrations)
      return {
        status: "UP",
        responseTime: 50,
        errorRate: 0,
        lastChecked: Date.now() as Millis,
      };
    });
  }

  async performHealthCheck(): Promise<SystemHealth> {
    const components: Record<string, ComponentHealth> = {};
    let totalScore = 0;
    let componentCount = 0;

    for (const [name, checkFn] of Array.from(this.checks)) {
      try {
        const health = await checkFn();
        components[name] = health;

        // Calculate component score
        let componentScore = 100;
        if (health.status === "DOWN") componentScore = 0;
        else if (health.status === "DEGRADED") componentScore = 50;

        // Factor in response time and error rate
        if (health.responseTime > 1000) componentScore -= 20;
        if (health.errorRate > 0.05) componentScore -= 30;

        totalScore += Math.max(0, componentScore);
        componentCount++;

        // Update Prometheus metrics
        this.metrics.updateSystemHealth(name, componentScore);
      } catch (error) {
        components[name] = {
          status: "DOWN",
          responseTime: 0,
          errorRate: 1,
          lastError: (error as Error).message,
          lastChecked: Date.now() as Millis,
        };
        this.logger.error(`Health check failed for ${name}`, error as Error);
      }
    }

    const overallScore =
      componentCount > 0 ? Math.round(totalScore / componentCount) : 0;
    const status =
      overallScore >= 80
        ? "HEALTHY"
        : overallScore >= 50
          ? "DEGRADED"
          : "UNHEALTHY";

    this.lastHealthCheck = {
      status,
      components,
      overallScore,
      lastChecked: Date.now() as Millis,
    };

    return this.lastHealthCheck;
  }

  startPeriodicHealthChecks(): void {
    const interval =
      environmentConfig.getConfig().monitoring.healthCheckIntervalMs;

    this.checkInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
        this.metrics.updateResourceUsage();
      } catch (error) {
        this.logger.error("Periodic health check failed", error as Error);
      }
    }, interval);
  }

  stopPeriodicHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getLastHealthCheck(): SystemHealth | null {
    return this.lastHealthCheck;
  }
}

class SLATracker {
  private static instance: SLATracker;
  private metrics: PrometheusMetrics;
  private logger: StructuredLogger;

  private constructor() {
    this.metrics = PrometheusMetrics.getInstance();
    this.logger = new StructuredLogger();
  }

  static getInstance(): SLATracker {
    if (!SLATracker.instance) {
      SLATracker.instance = new SLATracker();
    }
    return SLATracker.instance;
  }

  async calculateSLAMetrics(
    tenantId: TenantId,
    periodHours: number = 24,
  ): Promise<SLAMetrics> {
    const startTime = Date.now() - periodHours * 60 * 60 * 1000;

    const metricsQuery = `
      SELECT
        COUNT(*) as total_requests,
        AVG(response_time) as avg_response_time,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY response_time) as p95_response_time,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END)::float / COUNT(*) as error_rate,
        COUNT(DISTINCT endpoint_id) as unique_endpoints
      FROM api_usage_metrics
      WHERE tenant_id = $1 AND timestamp >= $2
    `;

    const result = await database.queryOne(metricsQuery, [tenantId, startTime]);

    const availability = Math.max(0, (1 - (result.error_rate || 0)) * 100);

    return {
      availability,
      responseTime95th: result.p95_response_time || 0,
      errorRate: result.error_rate || 0,
      throughput: result.total_requests || 0,
      complianceScore: await this.calculateComplianceScore(tenantId, startTime),
    };
  }

  private async calculateComplianceScore(
    tenantId: TenantId,
    startTime: number,
  ): Promise<number> {
    const evidenceQuery = `
      SELECT COUNT(*) as evidence_count
      FROM compliance_evidence
      WHERE tenant_id = $1 AND created_at >= to_timestamp($2/1000)
    `;

    const violationQuery = `
      SELECT COUNT(*) as violation_count
      FROM threat_events
      WHERE tenant_id = $1 AND created_at >= to_timestamp($2/1000) AND severity IN ('HIGH', 'CRITICAL')
    `;

    const evidenceResult = await database.queryOne(evidenceQuery, [
      tenantId,
      startTime,
    ]);
    const violationResult = await database.queryOne(violationQuery, [
      tenantId,
      startTime,
    ]);

    const evidenceCount = evidenceResult.evidence_count || 0;
    const violationCount = violationResult.violation_count || 0;

    // Simple compliance scoring algorithm
    const baseScore = 100;
    const violationPenalty = Math.min(50, violationCount * 5);
    const evidenceBonus = Math.min(10, evidenceCount * 0.1);

    return Math.max(
      0,
      Math.min(100, baseScore - violationPenalty + evidenceBonus),
    );
  }
}

// Export singleton instances
export const metrics = PrometheusMetrics.getInstance();
export const logger = new StructuredLogger();
export const healthChecker = HealthChecker.getInstance();
export const slaTracker = SLATracker.getInstance();

// Initialize monitoring system
export async function initializeMonitoring(): Promise<void> {
  logger.info("Initializing monitoring system");

  healthChecker.startPeriodicHealthChecks();

  // Setup metrics endpoint
  const express = require("express");
  const app = express();
  const config = environmentConfig.getConfig();

  app.get("/metrics", async (req: any, res: any) => {
    try {
      const metricsData = await metrics.getMetrics();
      res.set("Content-Type", register.contentType);
      res.end(metricsData);
    } catch (error) {
      logger.error("Failed to generate metrics", error as Error);
      res.status(500).end("Error generating metrics");
    }
  });

  app.get("/health", async (req: any, res: any) => {
    try {
      const health = await healthChecker.performHealthCheck();
      res.json(health);
    } catch (error) {
      logger.error("Health check failed", error as Error);
      res
        .status(503)
        .json({ status: "UNHEALTHY", error: (error as Error).message });
    }
  });

  app.listen(config.monitoring.prometheusPort, () => {
    logger.info(
      `Monitoring endpoints started on port ${config.monitoring.prometheusPort}`,
    );
  });
}

export function recordAPIMetrics(
  tenantId: TenantId,
  endpointId: EndpointId,
  method: string,
  statusCode: number,
  duration: number,
  dataClassification: string,
  sourceIP: string,
): void {
  metrics.recordAPIRequest(
    tenantId,
    endpointId,
    method,
    statusCode,
    duration,
    dataClassification,
  );
  logger.logAPIRequest(
    tenantId,
    endpointId,
    method,
    statusCode,
    duration,
    sourceIP,
  );
}

export function recordPolicyMetrics(
  tenantId: TenantId,
  policyId: PolicyId,
  action: string,
  ruleId: string,
  executionTime: Millis,
  violation: boolean = false,
): void {
  metrics.recordPolicyEvaluation(
    tenantId,
    policyId,
    action,
    ruleId,
    executionTime,
    violation,
  );
  logger.logPolicyEvaluation(tenantId, policyId, action, executionTime, 1);
}

export function recordThreatMetrics(
  tenantId: TenantId,
  threatType: string,
  severity: RiskLevel,
  sourceIP: string,
  detectionLatency: number,
  confidence: number,
): void {
  metrics.recordThreatEvent(
    tenantId,
    threatType,
    severity,
    sourceIP,
    detectionLatency,
  );
  logger.logThreatDetection(
    tenantId,
    threatType,
    severity,
    sourceIP,
    confidence,
  );
}
