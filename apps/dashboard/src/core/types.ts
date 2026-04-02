/**
 * Core type system for API Governance Platform
 * Branded types, interfaces, and domain objects
 */

// Branded type system for type safety
type Brand<T, K> = T & { readonly __brand: K };

export type TenantId = Brand<string, "TenantId">;
export type APIId = Brand<string, "APIId">;
export type EndpointId = Brand<string, "EndpointId">;
export type PolicyId = Brand<string, "PolicyId">;
export type RuleId = Brand<string, "RuleId">;
export type ThreatId = Brand<string, "ThreatId">;
export type EvidenceId = Brand<string, "EvidenceId">;
export type ScanId = Brand<string, "ScanId">;
export type Millis = Brand<number, "Millis">;
export type Dollars = Brand<number, "Dollars">;

// Core JSON value type
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

// Base interfaces for all entities
export interface TenantScoped {
  readonly tenantId: TenantId;
}

export interface Traceable {
  readonly traceId: string;
}

export interface Timestamped {
  readonly createdAt: Date;
  readonly updatedAt?: Date;
}

export interface Auditable extends Timestamped {
  readonly createdBy: string;
  readonly updatedBy?: string;
}

// API Discovery and Classification
export type HTTPMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "DELETE"
  | "PATCH"
  | "HEAD"
  | "OPTIONS";
export type DataClassification =
  | "PUBLIC"
  | "INTERNAL"
  | "CONFIDENTIAL"
  | "RESTRICTED"
  | "PII"
  | "PHI";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DiscoverySource =
  | "TRAFFIC_ANALYSIS"
  | "SERVICE_MESH"
  | "OPENAPI_SPEC"
  | "MANUAL_IMPORT";

export interface APIEndpoint extends TenantScoped, Auditable {
  readonly id: EndpointId;
  readonly method: HTTPMethod;
  readonly path: string;
  readonly host: string;
  readonly port: number;
  readonly protocol: "http" | "https";
  readonly service: string;
  readonly version?: string;
  readonly dataClassification: DataClassification;
  readonly riskScore: number;
  readonly discoverySource: DiscoverySource;
  readonly lastSeen: Millis;
  readonly requestCount: number;
  readonly avgResponseTime: number;
  readonly errorRate: number;
  readonly authRequired: boolean;
  readonly rateLimited: boolean;
  readonly metadata: JsonValue;
}

export interface APIUsageMetrics {
  readonly endpointId: EndpointId;
  readonly timestamp: Millis;
  readonly requestCount: number;
  readonly responseTime: number;
  readonly statusCode: number;
  readonly sourceIP: string;
  readonly userAgent?: string;
  readonly authContext?: JsonValue;
}

// Policy System
export type PolicyAction =
  | "ALLOW"
  | "DENY"
  | "LOG"
  | "THROTTLE"
  | "REQUIRE_AUTH";
export type PolicyCondition =
  | "IP_WHITELIST"
  | "DATA_CLASSIFICATION"
  | "REQUEST_RATE"
  | "TIME_WINDOW"
  | "AUTH_REQUIRED"
  | "RISK_THRESHOLD";

export interface PolicyRule extends TenantScoped, Auditable {
  readonly id: RuleId;
  readonly policyId: PolicyId;
  readonly name: string;
  readonly description: string;
  readonly condition: PolicyCondition;
  readonly conditionValue: JsonValue;
  readonly action: PolicyAction;
  readonly severity: RiskLevel;
  readonly enabled: boolean;
  readonly priority: number;
}

export interface Policy extends TenantScoped, Auditable {
  readonly id: PolicyId;
  readonly name: string;
  readonly description: string;
  readonly version: string;
  readonly rules: readonly PolicyRule[];
  readonly active: boolean;
  readonly deployedAt?: Millis;
  readonly compiledPolicy?: JsonValue;
}

export interface PolicyEvaluationContext {
  readonly tenantId: TenantId;
  readonly endpointId: EndpointId;
  readonly requestMethod: HTTPMethod;
  readonly requestPath: string;
  readonly sourceIP: string;
  readonly authContext?: JsonValue;
  readonly requestHeaders: Record<string, string>;
  readonly requestBody?: JsonValue;
  readonly timestamp: Millis;
}

export interface PolicyDecision {
  readonly allowed: boolean;
  readonly action: PolicyAction;
  readonly appliedRules: readonly RuleId[];
  readonly reason: string;
  readonly riskScore: number;
  readonly requiresAudit: boolean;
  readonly throttleDelay?: Millis;
  readonly metadata: JsonValue;
}

// Threat Detection
export type ThreatType =
  | "ANOMALOUS_ACCESS"
  | "DATA_EXFILTRATION"
  | "BRUTE_FORCE"
  | "PRIVILEGE_ESCALATION"
  | "SUSPICIOUS_PATTERN"
  | "RATE_LIMIT_VIOLATION"
  | "RATE_LIMIT_VIOLATION"
  | "POLICY_VIOLATION";

export interface ThreatEvent extends TenantScoped, Timestamped {
  readonly id: ThreatId;
  readonly threatType: ThreatType;
  readonly severity: RiskLevel;
  readonly endpointId: EndpointId;
  readonly sourceIP: string;
  readonly description: string;
  readonly confidence: number;
  readonly evidenceIds: readonly EvidenceId[];
  readonly resolved: boolean;
  readonly resolvedAt?: Millis;
  readonly resolvedBy?: string;
  readonly metadata: JsonValue;
}

export interface BehaviorBaseline {
  readonly endpointId: EndpointId;
  readonly avgRequestsPerHour: number;
  readonly avgResponseTime: number;
  readonly commonSourceIPs: readonly string[];
  readonly typicalUserAgents: readonly string[];
  readonly peakHours: readonly number[];
  readonly errorRateBaseline: number;
  readonly lastUpdated: Millis;
}

// Compliance and Auditing
export type ComplianceFramework =
  | "SOC2"
  | "HIPAA"
  | "PCI_DSS"
  | "GDPR"
  | "ISO27001";
export type EvidenceType =
  | "API_ACCESS"
  | "POLICY_VIOLATION"
  | "DATA_ACCESS"
  | "CONFIGURATION_CHANGE"
  | "THREAT_DETECTION"
  | "VULNERABILITY_SCAN";

export interface ComplianceEvidence extends TenantScoped, Timestamped {
  readonly id: EvidenceId;
  readonly evidenceType: EvidenceType;
  readonly endpointId?: EndpointId;
  readonly description: string;
  readonly dataHash: string;
  readonly signature: string;
  readonly metadata: JsonValue;
  readonly retentionExpiry: Millis;
}

export interface ComplianceReport extends TenantScoped, Timestamped {
  readonly framework: ComplianceFramework;
  readonly reportPeriod: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly overallScore: number;
  readonly controlResults: readonly ControlResult[];
  readonly evidenceCount: number;
  readonly violationCount: number;
  readonly recommendations: readonly string[];
}

export interface ControlResult {
  readonly controlId: string;
  readonly controlName: string;
  readonly status: "COMPLIANT" | "NON_COMPLIANT" | "PARTIAL";
  readonly score: number;
  readonly findings: readonly string[];
  readonly evidenceIds: readonly EvidenceId[];
}

// Security and Vulnerabilities
export type VulnerabilityType =
  | "BROKEN_AUTHENTICATION"
  | "SENSITIVE_DATA_EXPOSURE"
  | "INJECTION_VULNERABILITY"
  | "BROKEN_ACCESS_CONTROL"
  | "SECURITY_MISCONFIGURATION"
  | "INSUFFICIENT_LOGGING";

export interface Vulnerability extends TenantScoped, Timestamped {
  readonly id: string;
  readonly endpointId: EndpointId;
  readonly vulnerabilityType: VulnerabilityType;
  readonly severity: RiskLevel;
  readonly description: string;
  readonly recommendation: string;
  readonly cveIds: readonly string[];
  readonly exploitable: boolean;
  readonly fixed: boolean;
  readonly fixedAt?: Millis;
}

// Network and Discovery
export interface NetworkEndpoint {
  readonly host: string;
  readonly port: number;
  readonly protocol: "http" | "https";
  readonly service?: string;
  readonly version?: string;
  readonly healthCheck?: string;
}

export interface DiscoveryConfig extends TenantScoped {
  readonly networkRanges: readonly string[];
  readonly excludedHosts: readonly string[];
  readonly scanIntervalMs: Millis;
  readonly deepScanEnabled: boolean;
  readonly serviceDiscoveryEnabled: boolean;
  readonly passiveMonitoringEnabled: boolean;
}

// Error handling
export type SystemErrorCode =
  | "VALIDATION_FAILED"
  | "AUTHENTICATION_FAILED"
  | "AUTHORIZATION_FAILED"
  | "TENANT_NOT_FOUND"
  | "API_NOT_FOUND"
  | "POLICY_EVALUATION_FAILED"
  | "THREAT_DETECTION_ERROR"
  | "DATABASE_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "RATE_LIMIT_EXCEEDED"
  | "CONFIGURATION_ERROR"
  | "COMPLIANCE_VIOLATION"
  | "SIGNATURE_VERIFICATION_FAILED"
  | "ENCRYPTION_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "INTERNAL_ERROR";

export interface SystemError extends Error {
  readonly code: SystemErrorCode;
  readonly metadata: JsonValue;
  readonly retryable: boolean;
  readonly statusCode: number;
  readonly tenantId?: TenantId;
}

// Database and Query Types (ENHANCED FOR YOUR SYSTEM)
export interface QueryOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly orderBy?: string;
  readonly orderDirection?: "ASC" | "DESC";
  readonly timeout?: Millis;
}

export interface PaginationOptions {
  readonly page: number;
  readonly pageSize: number;
  readonly maxPageSize?: number;
}

export interface SearchFilters {
  readonly tenantId?: TenantId;
  readonly dateRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly tags?: readonly string[];
  readonly metadata?: JsonValue;
}

export interface DatabaseTransaction {
  readonly id: string;
  readonly startedAt: Millis;
  readonly isolationLevel:
    | "READ_UNCOMMITTED"
    | "READ_COMMITTED"
    | "REPEATABLE_READ"
    | "SERIALIZABLE";
  readonly readonly: boolean;
}

// Auth and Authorization Types (ENHANCED)
export interface AuthContext {
  readonly apiKey: string;
  readonly companyId: string;
  readonly tenantId: TenantId;
  readonly userId: string;
  readonly company?: {
    readonly company_name?: string;
    readonly daily_limit?: number;
    readonly stripe_customer_id?: string;
    readonly email?: string;
    readonly name?: string;
  };
  readonly permissions: readonly string[];
  readonly scopes: readonly string[];
  readonly sessionId?: string;
  readonly expiresAt?: Millis;
}

export interface AuthenticationResult {
  readonly success: boolean;
  readonly context?: AuthContext;
  readonly error?: string;
  readonly retryAfter?: Millis;
}

// Monitoring and Metrics Types (ENHANCED)
export interface MetricPoint {
  readonly timestamp: Millis;
  readonly value: number;
  readonly labels: Record<string, string>;
}

export interface PolicyMetrics {
  readonly tenantId: TenantId;
  readonly policyId: PolicyId;
  readonly action: string;
  readonly ruleId: string;
  readonly executionTime: Millis;
  readonly violation?: boolean;
  readonly evaluatedAt: Millis;
}

export interface SystemMetrics {
  readonly cpuUsage: number;
  readonly memoryUsage: number;
  readonly diskUsage: number;
  readonly networkIO: {
    readonly bytesIn: number;
    readonly bytesOut: number;
  };
  readonly activeConnections: number;
  readonly queueDepth: number;
  readonly timestamp: Millis;
}

// Environment Configuration Types (ENHANCED)
export interface EnvironmentConfig {
  readonly monitoring: {
    readonly logLevel: "debug" | "info" | "warn" | "error";
    readonly healthCheckIntervalMs: number;
    readonly prometheusPort: number;
    readonly metricsPrefix: string;
    readonly structuredLogging: boolean;
  };
  readonly policy: {
    readonly defaultAction: PolicyAction;
    readonly cacheExpirationMs: number;
    readonly maxRulesPerPolicy: number;
    readonly evaluationTimeoutMs: number;
  };
  readonly database: {
    readonly connectionPoolSize: number;
    readonly queryTimeoutMs: number;
    readonly maxRetries: number;
    readonly retryDelayMs: number;
  };
  readonly security: {
    readonly encryptionEnabled: boolean;
    readonly tlsEnabled: boolean;
    readonly corsOrigins: readonly string[];
    readonly rateLimitWindowMs: number;
  };
}

// Utility functions for branded types
export function createTenantId(value: string): TenantId {
  if (!value || typeof value !== "string" || value.length < 1) {
    throw new Error("Invalid tenant ID");
  }
  return value as TenantId;
}

export function createAPIId(value: string): APIId {
  if (!value || typeof value !== "string" || value.length < 1) {
    throw new Error("Invalid API ID");
  }
  return value as APIId;
}

export function createEndpointId(
  method: HTTPMethod,
  path: string,
  host: string,
): EndpointId {
  const normalized = `${method}:${host}${path}`.toLowerCase();
  return normalized as EndpointId;
}

export function createPolicyId(tenantId: TenantId, name: string): PolicyId {
  return `${tenantId}:policy:${name}` as PolicyId;
}

export function isValidIPAddress(ip: string): boolean {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

export function calculateRiskScore(
  dataClassification: DataClassification,
  authRequired: boolean,
  errorRate: number,
  exposureLevel: number,
): number {
  let baseScore = 0;

  // Data classification scoring
  switch (dataClassification) {
    case "PUBLIC":
      baseScore = 10;
      break;
    case "INTERNAL":
      baseScore = 30;
      break;
    case "CONFIDENTIAL":
      baseScore = 60;
      break;
    case "RESTRICTED":
      baseScore = 80;
      break;
    case "PII":
      baseScore = 90;
      break;
    case "PHI":
      baseScore = 95;
      break;
  }

  // Authentication penalty
  if (!authRequired) baseScore += 20;

  // Error rate penalty
  if (errorRate > 0.05) baseScore += 15;
  if (errorRate > 0.1) baseScore += 25;

  // Exposure level (0-1 scale)
  baseScore += Math.round(exposureLevel * 30);

  return Math.min(100, Math.max(0, baseScore));
}

export function classifyDataSensitivity(
  path: string,
  headers: Record<string, string>,
  body?: JsonValue,
): DataClassification {
  const sensitivePatterns = {
    PHI: ["/health", "/medical", "/patient", "/hipaa"],
    PII: ["/user", "/profile", "/personal", "/contact", "/address"],
    CONFIDENTIAL: ["/admin", "/internal", "/private", "/secret"],
    RESTRICTED: ["/api/v1/admin", "/system", "/config"],
  };

  const pathLower = path.toLowerCase();

  // Check path patterns
  for (const [classification, patterns] of Object.entries(sensitivePatterns)) {
    if (patterns.some((pattern) => pathLower.includes(pattern))) {
      return classification as DataClassification;
    }
  }

  // Check headers for sensitive content
  const contentType = headers["content-type"] || "";
  if (contentType.includes("application/json") && body) {
    const bodyString = JSON.stringify(body).toLowerCase();
    if (
      bodyString.includes("ssn") ||
      bodyString.includes("medical") ||
      bodyString.includes("diagnosis")
    ) {
      return "PHI";
    }
    if (
      bodyString.includes("email") ||
      bodyString.includes("phone") ||
      bodyString.includes("address")
    ) {
      return "PII";
    }
  }

  return "INTERNAL";
}

export function generateThreatSignature(
  sourceIP: string,
  endpoint: string,
  pattern: string,
): string {
  const crypto = require("crypto");
  const data = `${sourceIP}:${endpoint}:${pattern}:${Date.now()}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

// Validation utilities
export function validateEndpointData(endpoint: Partial<APIEndpoint>): string[] {
  const errors: string[] = [];

  if (
    !endpoint.method ||
    !["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"].includes(
      endpoint.method,
    )
  ) {
    errors.push("Invalid HTTP method");
  }

  if (!endpoint.path || !endpoint.path.startsWith("/")) {
    errors.push("Invalid path - must start with /");
  }

  if (!endpoint.host || endpoint.host.length < 1) {
    errors.push("Host is required");
  }

  if (!endpoint.port || endpoint.port < 1 || endpoint.port > 65535) {
    errors.push("Invalid port number");
  }

  if (
    endpoint.riskScore !== undefined &&
    (endpoint.riskScore < 0 || endpoint.riskScore > 100)
  ) {
    errors.push("Risk score must be between 0 and 100");
  }

  return errors;
}

export function validatePolicyRule(rule: Partial<PolicyRule>): string[] {
  const errors: string[] = [];

  if (!rule.name || rule.name.length < 1) {
    errors.push("Rule name is required");
  }

  if (!rule.condition) {
    errors.push("Rule condition is required");
  }

  if (
    !rule.action ||
    !["ALLOW", "DENY", "LOG", "THROTTLE", "REQUIRE_AUTH"].includes(rule.action)
  ) {
    errors.push("Invalid rule action");
  }

  if (
    !rule.severity ||
    !["LOW", "MEDIUM", "HIGH", "CRITICAL"].includes(rule.severity)
  ) {
    errors.push("Invalid severity level");
  }

  if (
    rule.priority !== undefined &&
    (rule.priority < 0 || rule.priority > 1000)
  ) {
    errors.push("Priority must be between 0 and 1000");
  }

  return errors;
}

// Cost and usage tracking
export interface UsageBilling {
  readonly tenantId: TenantId;
  readonly billingPeriod: Date;
  readonly apiCallCount: number;
  readonly storageUsageGB: number;
  readonly complianceExports: number;
  readonly threatAlertsGenerated: number;
  readonly totalCost: Dollars;
  readonly breakdown: {
    readonly discovery: Dollars;
    readonly policyEnforcement: Dollars;
    readonly threatDetection: Dollars;
    readonly complianceReporting: Dollars;
    readonly storage: Dollars;
  };
}

// Rate limiting and throttling
export interface RateLimit {
  readonly requests: number;
  readonly windowMs: Millis;
  readonly burstAllowed: number;
}

export interface ThrottleConfig extends TenantScoped {
  readonly endpointId: EndpointId;
  readonly rateLimit: RateLimit;
  readonly enabled: boolean;
  readonly gracePeriodMs: Millis;
  readonly blockDurationMs: Millis;
}

// Integration and external systems
export interface Integration extends TenantScoped, Auditable {
  readonly name: string;
  readonly type: "SIEM" | "API_GATEWAY" | "SERVICE_MESH" | "MONITORING";
  readonly endpoint: string;
  readonly apiKey: string;
  readonly active: boolean;
  readonly lastSync: Millis;
  readonly syncIntervalMs: Millis;
  readonly configurationSchema: JsonValue;
}

// Notification and alerting
export interface AlertChannel {
  readonly type: "EMAIL" | "SLACK" | "WEBHOOK" | "SMS";
  readonly endpoint: string;
  readonly credentials?: JsonValue;
  readonly enabled: boolean;
}

export interface ThreatAlert extends TenantScoped, Timestamped {
  readonly threatId: ThreatId;
  readonly title: string;
  readonly description: string;
  readonly severity: RiskLevel;
  readonly endpointId: EndpointId;
  readonly sourceIP: string;
  readonly recommendedAction: string;
  readonly acknowledged: boolean;
  readonly acknowledgedBy?: string;
  readonly acknowledgedAt?: Millis;
  readonly resolved: boolean;
  readonly resolvedAt?: Millis;
}

// Export and reporting types
export type ExportFormat = "JSON" | "CSV" | "PDF" | "XLSX";

export interface ExportRequest extends TenantScoped {
  readonly format: ExportFormat;
  readonly dataType:
    | "ENDPOINTS"
    | "POLICIES"
    | "THREATS"
    | "COMPLIANCE"
    | "USAGE";
  readonly dateRange: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly filters?: JsonValue;
  readonly includeMetadata: boolean;
}

export interface ExportResult {
  readonly exportId: string;
  readonly status: "PENDING" | "COMPLETED" | "FAILED";
  readonly downloadUrl?: string;
  readonly fileSize?: number;
  readonly createdAt: Millis;
  readonly expiresAt: Millis;
}

// System health and metrics
export interface SystemHealth {
  readonly status: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  readonly components: Record<string, ComponentHealth>;
  readonly overallScore: number;
  readonly lastChecked: Millis;
}

export interface ComponentHealth {
  readonly status: "UP" | "DOWN" | "DEGRADED";
  readonly responseTime: number;
  readonly errorRate: number;
  readonly lastError?: string;
  readonly lastChecked: Millis;
}
