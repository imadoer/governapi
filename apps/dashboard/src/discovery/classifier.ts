/**
 * API Classification Engine
 * Data sensitivity detection, PII identification, risk scoring algorithms
 */

import {
  TenantId,
  EndpointId,
  DataClassification,
  RiskLevel,
  HTTPMethod,
  JsonValue,
  classifyDataSensitivity,
  calculateRiskScore,
} from "../core/types";
// import { logger } from "../infrastructure/monitoring"; // Disabled

export interface ClassificationResult {
  readonly dataClassification: DataClassification;
  readonly riskLevel: RiskLevel;
  readonly riskScore: number;
  readonly sensitiveFields: readonly string[];
  readonly complianceFlags: readonly string[];
  readonly confidence: number;
  readonly reasoning: readonly string[];
}

export interface PIIDetectionResult {
  readonly hasPII: boolean;
  readonly piiTypes: readonly PIIType[];
  readonly maskedData: JsonValue;
  readonly confidence: number;
}

export type PIIType =
  | "SSN"
  | "CREDIT_CARD"
  | "EMAIL"
  | "PHONE"
  | "ADDRESS"
  | "IP_ADDRESS"
  | "MEDICAL_ID"
  | "GOVERNMENT_ID"
  | "BIOMETRIC"
  | "FINANCIAL_ACCOUNT";

export interface DataPattern {
  readonly name: string;
  readonly regex: RegExp;
  readonly piiType: PIIType;
  readonly weight: number;
  readonly complianceFrameworks: readonly string[];
}

class DataPatternMatcher {
  private static instance: DataPatternMatcher;
  private patterns: Map<PIIType, DataPattern[]> = new Map();

  private constructor() {
    this.initializePatterns();
  }

  static getInstance(): DataPatternMatcher {
    if (!DataPatternMatcher.instance) {
      DataPatternMatcher.instance = new DataPatternMatcher();
    }
    return DataPatternMatcher.instance;
  }

  private initializePatterns(): void {
    // SSN patterns
    this.patterns.set("SSN", [
      {
        name: "US SSN",
        regex: /\b\d{3}-?\d{2}-?\d{4}\b/g,
        piiType: "SSN",
        weight: 1.0,
        complianceFrameworks: ["PCI_DSS", "SOC2", "GDPR"],
      },
    ]);

    // Credit card patterns
    this.patterns.set("CREDIT_CARD", [
      {
        name: "Credit Card Number",
        regex:
          /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3[0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
        piiType: "CREDIT_CARD",
        weight: 1.0,
        complianceFrameworks: ["PCI_DSS"],
      },
    ]);

    // Email patterns
    this.patterns.set("EMAIL", [
      {
        name: "Email Address",
        regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        piiType: "EMAIL",
        weight: 0.8,
        complianceFrameworks: ["GDPR", "SOC2"],
      },
    ]);

    // Phone number patterns
    this.patterns.set("PHONE", [
      {
        name: "US Phone Number",
        regex:
          /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,
        piiType: "PHONE",
        weight: 0.9,
        complianceFrameworks: ["GDPR", "SOC2", "HIPAA"],
      },
    ]);

    // Medical ID patterns
    this.patterns.set("MEDICAL_ID", [
      {
        name: "Medical Record Number",
        regex:
          /\b(?:MRN|mrn|medical.?record.?number|patient.?id)[\s:=]*([A-Z0-9]{6,12})\b/gi,
        piiType: "MEDICAL_ID",
        weight: 1.0,
        complianceFrameworks: ["HIPAA"],
      },
    ]);

    // Government ID patterns
    this.patterns.set("GOVERNMENT_ID", [
      {
        name: "Passport Number",
        regex: /\b[A-Z]{1,2}[0-9]{6,9}\b/g,
        piiType: "GOVERNMENT_ID",
        weight: 0.7,
        complianceFrameworks: ["GDPR", "SOC2"],
      },
    ]);

    // Financial account patterns
    this.patterns.set("FINANCIAL_ACCOUNT", [
      {
        name: "Bank Account Number",
        regex: /\b(?:account.?number|acct.?no)[\s:=]*([0-9]{8,17})\b/gi,
        piiType: "FINANCIAL_ACCOUNT",
        weight: 1.0,
        complianceFrameworks: ["PCI_DSS", "SOC2"],
      },
    ]);

    // IP Address patterns
    this.patterns.set("IP_ADDRESS", [
      {
        name: "IPv4 Address",
        regex:
          /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
        piiType: "IP_ADDRESS",
        weight: 0.3,
        complianceFrameworks: ["GDPR"],
      },
    ]);
  }

  detectPII(data: string | JsonValue): PIIDetectionResult {
    const stringData = typeof data === "string" ? data : JSON.stringify(data);
    const foundPII: PIIType[] = [];
    const detectionReasons: string[] = [];
    let totalConfidence = 0;
    let patternCount = 0;

    // Check against all patterns
    for (const [piiType, patterns] of Array.from(this.patterns)) {
      for (const pattern of patterns) {
        const matches = stringData.match(pattern.regex);
        if (matches && matches.length > 0) {
          foundPII.push(piiType);
          detectionReasons.push(
            `Found ${matches.length} ${pattern.name} pattern(s)`,
          );
          totalConfidence += pattern.weight;
          patternCount++;
        }
      }
    }

    const confidence =
      patternCount > 0 ? Math.min(1.0, totalConfidence / patternCount) : 0;
    const maskedData = this.maskSensitiveData(data, foundPII);

    return {
      hasPII: foundPII.length > 0,
      piiTypes: Array.from(new Set(foundPII)),
      maskedData,
      confidence,
    };
  }

  private maskSensitiveData(
    data: string | JsonValue,
    piiTypes: PIIType[],
  ): JsonValue {
    if (typeof data !== "string") {
      return this.maskObjectData(data, piiTypes);
    }

    let maskedData = data;

    for (const piiType of piiTypes) {
      const patterns = this.patterns.get(piiType) || [];
      for (const pattern of patterns) {
        maskedData = maskedData.replace(pattern.regex, (match) => {
          const length = match.length;
          if (length <= 4) return "*".repeat(length);
          return (
            match.substring(0, 2) +
            "*".repeat(length - 4) +
            match.substring(length - 2)
          );
        });
      }
    }

    return maskedData;
  }

  private maskObjectData(data: JsonValue, piiTypes: PIIType[]): JsonValue {
    if (data === null || typeof data !== "object") {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.maskObjectData(item, piiTypes));
    }

    const masked: { [key: string]: JsonValue } = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === "string") {
        masked[key] = this.maskSensitiveData(value, piiTypes) as string;
      } else {
        masked[key] = this.maskObjectData(value, piiTypes);
      }
    }

    return masked;
  }
}

class APIClassifier {
  private static instance: APIClassifier;
  private patternMatcher: DataPatternMatcher;

  private constructor() {
    this.patternMatcher = DataPatternMatcher.getInstance();
  }

  static getInstance(): APIClassifier {
    if (!APIClassifier.instance) {
      APIClassifier.instance = new APIClassifier();
    }
    return APIClassifier.instance;
  }

  async classifyEndpoint(
    tenantId: TenantId,
    method: HTTPMethod,
    path: string,
    host: string,
    headers: Record<string, string> = {},
    sampleRequest?: JsonValue,
    sampleResponse?: JsonValue,
  ): Promise<ClassificationResult> {
    const startTime = Date.now();

    try {
      // Base classification from path and method
      const pathClassification = this.classifyFromPath(path, method);

      // Analyze request/response data for PII
      const requestPII = sampleRequest
        ? this.patternMatcher.detectPII(sampleRequest)
        : null;
      const responsePII = sampleResponse
        ? this.patternMatcher.detectPII(sampleResponse)
        : null;

      // Determine overall data classification
      const dataClassification = this.determineDataClassification(
        pathClassification,
        requestPII,
        responsePII,
        headers,
      );

      // Calculate risk score
      const authRequired = this.detectAuthRequirement(headers, path);
      const exposureLevel = this.calculateExposureLevel(method, path, headers);
      const riskScore = calculateRiskScore(
        dataClassification,
        authRequired,
        0,
        exposureLevel,
      );

      // Determine risk level
      const riskLevel = this.determineRiskLevel(riskScore, dataClassification);

      // Compile sensitive fields and compliance flags
      const sensitiveFields = this.extractSensitiveFields(
        requestPII,
        responsePII,
      );
      const complianceFlags = this.generateComplianceFlags(
        dataClassification,
        sensitiveFields,
      );

      // Generate reasoning
      const reasoning = this.generateClassificationReasoning(
        pathClassification,
        requestPII,
        responsePII,
        authRequired,
        exposureLevel,
      );

      // Calculate overall confidence
      const confidence = this.calculateConfidence(
        requestPII,
        responsePII,
        pathClassification,
      );

      const result: ClassificationResult = {
        dataClassification,
        riskLevel,
        riskScore,
        sensitiveFields,
        complianceFlags,
        confidence,
        reasoning,
      };

      console.debug("Endpoint classification completed", {
        tenant_id: tenantId,
        method,
        path,
        host,
        classification: dataClassification,
        risk_score: riskScore,
        duration_ms: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      console.error("Endpoint classification failed", error as Error, {
        tenant_id: tenantId,
        method,
        path,
        host,
      });

      // Return safe defaults on error
      return {
        dataClassification: "INTERNAL",
        riskLevel: "MEDIUM",
        riskScore: 50,
        sensitiveFields: [],
        complianceFlags: [],
        confidence: 0,
        reasoning: ["Classification failed, using defaults"],
      };
    }
  }

  private classifyFromPath(
    path: string,
    method: HTTPMethod,
  ): {
    classification: DataClassification;
    confidence: number;
    indicators: string[];
  } {
    const pathLower = path.toLowerCase();
    const indicators: string[] = [];

    // PHI patterns
    const phiPatterns = [
      "/health",
      "/medical",
      "/patient",
      "/diagnosis",
      "/treatment",
      "/hipaa",
      "/phi",
      "/healthcare",
      "/clinical",
      "/medication",
    ];

    // PII patterns
    const piiPatterns = [
      "/user",
      "/profile",
      "/personal",
      "/contact",
      "/address",
      "/pii",
      "/gdpr",
      "/privacy",
      "/identity",
      "/demographic",
    ];

    // Confidential patterns
    const confidentialPatterns = [
      "/admin",
      "/internal",
      "/private",
      "/secret",
      "/config",
      "/system",
      "/management",
      "/control",
      "/restricted",
    ];

    // Public patterns
    const publicPatterns = [
      "/public",
      "/docs",
      "/documentation",
      "/swagger",
      "/openapi",
      "/status",
      "/health",
      "/ping",
      "/version",
      "/info",
    ];

    // Check patterns in order of sensitivity
    if (phiPatterns.some((pattern) => pathLower.includes(pattern))) {
      indicators.push("PHI path pattern detected");
      return { classification: "PHI", confidence: 0.9, indicators };
    }

    if (piiPatterns.some((pattern) => pathLower.includes(pattern))) {
      indicators.push("PII path pattern detected");
      return { classification: "PII", confidence: 0.8, indicators };
    }

    if (confidentialPatterns.some((pattern) => pathLower.includes(pattern))) {
      indicators.push("Confidential path pattern detected");
      return { classification: "CONFIDENTIAL", confidence: 0.7, indicators };
    }

    if (publicPatterns.some((pattern) => pathLower.includes(pattern))) {
      indicators.push("Public path pattern detected");
      return { classification: "PUBLIC", confidence: 0.6, indicators };
    }

    // Method-based classification
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      indicators.push("Write operation detected");
      return { classification: "INTERNAL", confidence: 0.5, indicators };
    }

    indicators.push("Default classification applied");
    return { classification: "INTERNAL", confidence: 0.3, indicators };
  }

  private determineDataClassification(
    pathClassification: {
      classification: DataClassification;
      confidence: number;
    },
    requestPII: PIIDetectionResult | null,
    responsePII: PIIDetectionResult | null,
    headers: Record<string, string>,
  ): DataClassification {
    // PII detection overrides path classification
    const hasPhiData =
      requestPII?.piiTypes.includes("MEDICAL_ID") ||
      responsePII?.piiTypes.includes("MEDICAL_ID") ||
      headers["content-type"]?.includes("application/fhir+json");

    if (hasPhiData) return "PHI";

    const hasPiiData = requestPII?.hasPII || responsePII?.hasPII;
    if (hasPiiData) {
      const highRiskPII = ["SSN", "CREDIT_CARD", "MEDICAL_ID", "GOVERNMENT_ID"];
      const hasHighRiskPII =
        requestPII?.piiTypes.some((type) => highRiskPII.includes(type)) ||
        responsePII?.piiTypes.some((type) => highRiskPII.includes(type));

      return hasHighRiskPII ? "RESTRICTED" : "PII";
    }

    // Authentication headers suggest sensitive data
    const authHeaders = ["authorization", "x-api-key", "x-auth-token"];
    const hasAuthHeaders = authHeaders.some((header) => headers[header]);

    if (hasAuthHeaders && pathClassification.classification === "INTERNAL") {
      return "CONFIDENTIAL";
    }

    return pathClassification.classification;
  }

  private detectAuthRequirement(
    headers: Record<string, string>,
    path: string,
  ): boolean {
    // Check for authentication headers
    const authHeaders = [
      "authorization",
      "x-api-key",
      "x-auth-token",
      "cookie",
    ];
    const hasAuthHeaders = authHeaders.some((header) => headers[header]);

    // Check path patterns that typically require auth
    const authPaths = ["/admin", "/api/v", "/private", "/internal", "/user"];
    const pathRequiresAuth = authPaths.some((pattern) =>
      path.toLowerCase().includes(pattern),
    );

    // Check security headers
    const securityHeaders = [
      "x-frame-options",
      "x-content-type-options",
      "strict-transport-security",
    ];
    const hasSecurityHeaders = securityHeaders.some(
      (header) => headers[header],
    );

    return hasAuthHeaders || pathRequiresAuth || hasSecurityHeaders;
  }

  private calculateExposureLevel(
    method: HTTPMethod,
    path: string,
    headers: Record<string, string>,
  ): number {
    let exposureScore = 0;

    // Method-based exposure
    const methodScores = {
      GET: 0.3,
      HEAD: 0.2,
      OPTIONS: 0.1,
      POST: 0.6,
      PUT: 0.7,
      PATCH: 0.6,
      DELETE: 0.8,
    };
    exposureScore += methodScores[method] || 0.5;

    // Path-based exposure
    if (path.includes("/public") || path.includes("/docs"))
      exposureScore -= 0.2;
    if (path.includes("/admin") || path.includes("/private"))
      exposureScore += 0.3;
    if (path.includes("/api/")) exposureScore += 0.2;

    // CORS headers indicate external access
    if (headers["access-control-allow-origin"]) exposureScore += 0.3;

    // Rate limiting headers suggest high traffic
    if (headers["x-ratelimit-limit"]) exposureScore += 0.1;

    return Math.min(1.0, Math.max(0.0, exposureScore));
  }

  private determineRiskLevel(
    riskScore: number,
    classification: DataClassification,
  ): RiskLevel {
    if (classification === "PHI" || riskScore >= 90) return "CRITICAL";
    if (classification === "RESTRICTED" || riskScore >= 75) return "HIGH";
    if (classification === "PII" || riskScore >= 50) return "MEDIUM";
    return "LOW";
  }

  private extractSensitiveFields(
    requestPII: PIIDetectionResult | null,
    responsePII: PIIDetectionResult | null,
  ): string[] {
    const fields: string[] = [];

    if (requestPII?.piiTypes) {
      fields.push(
        ...requestPII.piiTypes.map((type) => `request.${type.toLowerCase()}`),
      );
    }

    if (responsePII?.piiTypes) {
      fields.push(
        ...responsePII.piiTypes.map((type) => `response.${type.toLowerCase()}`),
      );
    }

    return Array.from(new Set(fields));
  }

  private generateComplianceFlags(
    classification: DataClassification,
    sensitiveFields: string[],
  ): string[] {
    const flags: string[] = [];

    // Classification-based flags
    switch (classification) {
      case "PHI":
        flags.push("HIPAA_REQUIRED", "HEALTHCARE_DATA");
        break;
      case "PII":
        flags.push("GDPR_APPLICABLE", "PERSONAL_DATA");
        break;
      case "RESTRICTED":
        flags.push("SOC2_TYPE2", "RESTRICTED_ACCESS");
        break;
      case "CONFIDENTIAL":
        flags.push("CONFIDENTIAL_DATA", "ACCESS_CONTROL_REQUIRED");
        break;
    }

    // Field-based flags
    if (sensitiveFields.some((field) => field.includes("credit_card"))) {
      flags.push("PCI_DSS_REQUIRED");
    }

    if (sensitiveFields.some((field) => field.includes("ssn"))) {
      flags.push("SSN_PROTECTION");
    }

    if (sensitiveFields.some((field) => field.includes("medical"))) {
      flags.push("PHI_PROTECTION");
    }

    return Array.from(new Set(flags));
  }

  private generateClassificationReasoning(
    pathClassification: {
      classification: DataClassification;
      indicators: string[];
    },
    requestPII: PIIDetectionResult | null,
    responsePII: PIIDetectionResult | null,
    authRequired: boolean,
    exposureLevel: number,
  ): string[] {
    const reasoning: string[] = [];

    reasoning.push(...pathClassification.indicators);

    if (requestPII?.hasPII) {
      reasoning.push(`Request contains PII: ${requestPII.piiTypes.join(", ")}`);
    }

    if (responsePII?.hasPII) {
      reasoning.push(
        `Response contains PII: ${responsePII.piiTypes.join(", ")}`,
      );
    }

    if (authRequired) {
      reasoning.push("Authentication detected");
    }

    if (exposureLevel > 0.7) {
      reasoning.push("High exposure level detected");
    }

    return reasoning;
  }

  private calculateConfidence(
    requestPII: PIIDetectionResult | null,
    responsePII: PIIDetectionResult | null,
    pathClassification: { confidence: number },
  ): number {
    let totalConfidence = pathClassification.confidence;
    let factors = 1;

    if (requestPII) {
      totalConfidence += requestPII.confidence;
      factors++;
    }

    if (responsePII) {
      totalConfidence += responsePII.confidence;
      factors++;
    }

    return Math.min(1.0, totalConfidence / factors);
  }
}

class ComplianceAnalyzer {
  private static instance: ComplianceAnalyzer;

  private constructor() {}

  static getInstance(): ComplianceAnalyzer {
    if (!ComplianceAnalyzer.instance) {
      ComplianceAnalyzer.instance = new ComplianceAnalyzer();
    }
    return ComplianceAnalyzer.instance;
  }

  analyzeHIPAACompliance(classification: ClassificationResult): {
    applicable: boolean;
    requirements: string[];
    violations: string[];
    score: number;
  } {
    const requirements: string[] = [];
    const violations: string[] = [];

    const applicable =
      classification.dataClassification === "PHI" ||
      classification.sensitiveFields.some((field) => field.includes("medical"));

    if (!applicable) {
      return {
        applicable: false,
        requirements: [],
        violations: [],
        score: 100,
      };
    }

    // HIPAA requirements
    requirements.push(
      "Implement access controls and user authentication",
      "Encrypt PHI in transit and at rest",
      "Maintain audit logs for all PHI access",
      "Implement automatic logoff procedures",
      "Regular security risk assessments required",
    );

    // Check for violations
    if (classification.riskScore > 75) {
      violations.push("High risk PHI endpoint without adequate protection");
    }

    if (!classification.complianceFlags.includes("HIPAA_REQUIRED")) {
      violations.push("PHI data detected but HIPAA compliance not flagged");
    }

    const score = Math.max(0, 100 - violations.length * 25);

    return { applicable, requirements, violations, score };
  }

  analyzeGDPRCompliance(classification: ClassificationResult): {
    applicable: boolean;
    requirements: string[];
    violations: string[];
    score: number;
  } {
    const requirements: string[] = [];
    const violations: string[] = [];

    const applicable =
      ["PII", "PHI", "RESTRICTED"].includes(
        classification.dataClassification,
      ) || classification.sensitiveFields.length > 0;

    if (!applicable) {
      return {
        applicable: false,
        requirements: [],
        violations: [],
        score: 100,
      };
    }

    // GDPR requirements
    requirements.push(
      "Obtain explicit consent for data processing",
      "Implement data subject rights (access, rectification, erasure)",
      "Conduct Data Protection Impact Assessments (DPIA)",
      "Implement privacy by design and by default",
      "Maintain records of processing activities",
    );

    // Check for violations
    if (
      classification.sensitiveFields.includes("email") ||
      classification.sensitiveFields.includes("ip_address")
    ) {
      requirements.push("Implement cookie consent mechanisms");
    }

    const score = Math.max(0, 100 - violations.length * 20);

    return { applicable, requirements, violations, score };
  }

  analyzePCIDSSCompliance(classification: ClassificationResult): {
    applicable: boolean;
    requirements: string[];
    violations: string[];
    score: number;
  } {
    const requirements: string[] = [];
    const violations: string[] = [];

    const applicable = classification.sensitiveFields.some(
      (field) =>
        field.includes("credit_card") || field.includes("financial_account"),
    );

    if (!applicable) {
      return {
        applicable: false,
        requirements: [],
        violations: [],
        score: 100,
      };
    }

    // PCI DSS requirements
    requirements.push(
      "Install and maintain firewall configuration",
      "Do not use vendor-supplied defaults for system passwords",
      "Protect stored cardholder data with encryption",
      "Encrypt transmission of cardholder data across open networks",
      "Use and regularly update anti-virus software",
      "Develop and maintain secure systems and applications",
    );

    // Check for violations
    if (classification.riskScore > 60) {
      violations.push("Payment card data in high-risk endpoint");
    }

    const score = Math.max(0, 100 - violations.length * 30);

    return { applicable, requirements, violations, score };
  }
}

// Content analysis utilities
class ContentAnalyzer {
  private static instance: ContentAnalyzer;

  private constructor() {}

  static getInstance(): ContentAnalyzer {
    if (!ContentAnalyzer.instance) {
      ContentAnalyzer.instance = new ContentAnalyzer();
    }
    return ContentAnalyzer.instance;
  }

  analyzeResponseSchema(response: JsonValue): {
    fields: string[];
    types: Record<string, string>;
    complexity: number;
    sensitiveFields: string[];
  } {
    const fields: string[] = [];
    const types: Record<string, string> = {};
    const sensitiveFields: string[] = [];

    this.extractFields(response, "", fields, types, sensitiveFields);

    const complexity = this.calculateComplexity(fields, types);

    return { fields, types, complexity, sensitiveFields };
  }

  private extractFields(
    obj: JsonValue,
    prefix: string,
    fields: string[],
    types: Record<string, string>,
    sensitiveFields: string[],
  ): void {
    if (obj === null || typeof obj !== "object") {
      return;
    }

    if (Array.isArray(obj)) {
      if (obj.length > 0) {
        this.extractFields(
          obj[0],
          `${prefix}[]`,
          fields,
          types,
          sensitiveFields,
        );
      }
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const fieldPath = prefix ? `${prefix}.${key}` : key;
      fields.push(fieldPath);

      if (value === null) {
        types[fieldPath] = "null";
      } else if (Array.isArray(value)) {
        types[fieldPath] = "array";
        if (value.length > 0) {
          this.extractFields(
            value[0],
            `${fieldPath}[]`,
            fields,
            types,
            sensitiveFields,
          );
        }
      } else if (typeof value === "object") {
        types[fieldPath] = "object";
        this.extractFields(value, fieldPath, fields, types, sensitiveFields);
      } else {
        types[fieldPath] = typeof value;

        // Check if field name suggests sensitive data
        const keyLower = key.toLowerCase();
        const sensitiveKeywords = [
          "password",
          "secret",
          "token",
          "key",
          "auth",
          "credential",
          "ssn",
          "social",
          "credit",
          "card",
          "account",
          "bank",
          "email",
          "phone",
          "address",
          "medical",
          "health",
        ];

        if (sensitiveKeywords.some((keyword) => keyLower.includes(keyword))) {
          sensitiveFields.push(fieldPath);
        }
      }
    }
  }

  private calculateComplexity(
    fields: string[],
    types: Record<string, string>,
  ): number {
    let complexity = fields.length;

    // Add complexity for nested objects
    complexity += fields.filter((field) => field.includes(".")).length * 0.5;

    // Add complexity for arrays
    complexity +=
      Object.values(types).filter((type) => type === "array").length * 0.3;

    return Math.round(complexity * 10) / 10;
  }
}

// Batch classification service
class BatchClassifier {
  private static instance: BatchClassifier;
  private classifier: APIClassifier;
  private patternMatcher: DataPatternMatcher;

  private constructor() {
    this.classifier = APIClassifier.getInstance();
    this.patternMatcher = DataPatternMatcher.getInstance();
  }

  static getInstance(): BatchClassifier {
    if (!BatchClassifier.instance) {
      BatchClassifier.instance = new BatchClassifier();
    }
    return BatchClassifier.instance;
  }

  async classifyEndpoints(
    tenantId: TenantId,
    endpoints: Array<{
      id: EndpointId;
      method: HTTPMethod;
      path: string;
      host: string;
      headers?: Record<string, string>;
      sampleData?: { request?: JsonValue; response?: JsonValue };
    }>,
  ): Promise<Map<EndpointId, ClassificationResult>> {
    const results = new Map<EndpointId, ClassificationResult>();
    const batchSize = 10;

    console.info("Starting batch endpoint classification", {
      tenant_id: tenantId,
      endpoint_count: endpoints.length,
    });

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < endpoints.length; i += batchSize) {
      const batch = endpoints.slice(i, i + batchSize);

      const batchPromises = batch.map(async (endpoint) => {
        try {
          const result = await this.classifier.classifyEndpoint(
            tenantId,
            endpoint.method,
            endpoint.path,
            endpoint.host,
            endpoint.headers || {},
            endpoint.sampleData?.request,
            endpoint.sampleData?.response,
          );

          results.set(endpoint.id, result);
          return { success: true, endpointId: endpoint.id };
        } catch (error) {
          console.error(
            "Batch classification failed for endpoint",
            error as Error,
            {
              tenant_id: tenantId,
              endpoint_id: endpoint.id,
            },
          );
          return { success: false, endpointId: endpoint.id, error };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);

      console.debug("Batch classification completed", {
        tenant_id: tenantId,
        batch_number: Math.floor(i / batchSize) + 1,
        successful: batchResults.filter((r) => r.status === "fulfilled").length,
        failed: batchResults.filter((r) => r.status === "rejected").length,
      });

      // Small delay between batches to prevent overload
      if (i + batchSize < endpoints.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.info("Batch endpoint classification completed", {
      tenant_id: tenantId,
      total_classified: results.size,
      total_requested: endpoints.length,
    });

    return results;
  }
}

// Risk assessment utilities
export function assessEndpointRisk(
  classification: ClassificationResult,
  trafficMetrics: {
    requestCount: number;
    errorRate: number;
    avgResponseTime: number;
  },
): {
  overallRisk: RiskLevel;
  riskFactors: string[];
  recommendations: string[];
} {
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  // Classification-based risk
  if (classification.dataClassification === "PHI") {
    riskFactors.push("Contains protected health information");
    recommendations.push("Implement HIPAA-compliant access controls");
  }

  if (classification.dataClassification === "PII") {
    riskFactors.push("Contains personally identifiable information");
    recommendations.push("Apply GDPR privacy controls");
  }

  // Traffic-based risk
  if (trafficMetrics.requestCount > 10000) {
    riskFactors.push("High traffic volume");
    recommendations.push("Implement rate limiting and monitoring");
  }

  if (trafficMetrics.errorRate > 0.05) {
    riskFactors.push("High error rate detected");
    recommendations.push("Investigate and fix error sources");
  }

  if (trafficMetrics.avgResponseTime > 2000) {
    riskFactors.push("Slow response times");
    recommendations.push("Optimize performance and caching");
  }

  // Determine overall risk
  const baseRisk = classification.riskLevel;
  const additionalRiskFactors = riskFactors.length - 1; // Exclude classification risk

  let overallRisk: RiskLevel = baseRisk;
  if (additionalRiskFactors >= 3) {
    overallRisk = "CRITICAL";
  } else if (additionalRiskFactors >= 2) {
    overallRisk = baseRisk === "LOW" ? "MEDIUM" : "HIGH";
  }

  return { overallRisk, riskFactors, recommendations };
}

// Export main components
export const dataPatternMatcher = DataPatternMatcher.getInstance();
export const apiClassifier = APIClassifier.getInstance();
export const complianceAnalyzer = ComplianceAnalyzer.getInstance();
export const contentAnalyzer = ContentAnalyzer.getInstance();
export const batchClassifier = BatchClassifier.getInstance();

// Main classification functions
export async function classifyEndpoint(
  tenantId: TenantId,
  method: HTTPMethod,
  path: string,
  host: string,
  headers: Record<string, string> = {},
  sampleRequest?: JsonValue,
  sampleResponse?: JsonValue,
): Promise<ClassificationResult> {
  return apiClassifier.classifyEndpoint(
    tenantId,
    method,
    path,
    host,
    headers,
    sampleRequest,
    sampleResponse,
  );
}

export function detectPII(data: string | JsonValue): PIIDetectionResult {
  return dataPatternMatcher.detectPII(data);
}

export async function classifyEndpointsBatch(
  tenantId: TenantId,
  endpoints: Array<{
    id: EndpointId;
    method: HTTPMethod;
    path: string;
    host: string;
    headers?: Record<string, string>;
    sampleData?: { request?: JsonValue; response?: JsonValue };
  }>,
): Promise<Map<EndpointId, ClassificationResult>> {
  return batchClassifier.classifyEndpoints(tenantId, endpoints);
}
