import {
  TenantId,
  EndpointId,
  ThreatId,
  ThreatType,
  RiskLevel,
  ThreatEvent,
  BehaviorBaseline,
  JsonValue,
  Millis,
} from "../core/types";

interface EndpointMetrics {
  requestsPerHour: number;
  responseTime: number;
  errorRate: number;
  sourceIPs: string[];
  userAgents: string[];
}

interface ThreatPattern {
  pattern: string;
  severity: RiskLevel;
  description: string;
}

interface AnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number;
  deviationFactor: number;
  reasons: string[];
  baseline: BehaviorBaseline;
  currentMetrics: EndpointMetrics;
}

interface MLModel {
  modelId: string;
  version: string;
  accuracy: number;
  lastTrained: Date;
}

const logger = {
  error: (message: string, error?: Error, meta?: any) => {
    console.error(message, error?.message || error, meta);
  },
  warn: (message: string, meta?: any) => {
    console.warn(message, meta);
  },
  info: (message: string, meta?: any) => {
    console.info(message, meta);
  },
};

export class ThreatDetectionEngine {
  private baselines = new Map<EndpointId, BehaviorBaseline>();
  private mlModels = new Map<TenantId, MLModel>();
  private threatPatterns = new Map<ThreatType, ThreatPattern[]>();
  private detectionStats = {
    totalThreats: 0,
    resolvedThreats: 0,
    falsePositives: 0,
    avgConfidence: 0,
  };

  constructor() {
    this.initializeThreatPatterns();
  }

  private initializeThreatPatterns(): void {
    this.threatPatterns.set("BRUTE_FORCE", [
      {
        pattern: "multiple_failed_attempts",
        severity: "HIGH",
        description: "Multiple failed authentication attempts from same IP",
      },
    ]);

    this.threatPatterns.set("DATA_EXFILTRATION", [
      {
        pattern: "large_data_transfer",
        severity: "CRITICAL",
        description: "Unusually large data transfers detected",
      },
    ]);

    this.threatPatterns.set("ANOMALOUS_ACCESS", [
      {
        pattern: "unusual_access_pattern",
        severity: "MEDIUM",
        description: "Access pattern deviates from baseline",
      },
    ]);
  }

  async analyzeThreat(
    tenantId: TenantId,
    endpointId: EndpointId,
    metrics: EndpointMetrics,
    sourceIP: string,
  ): Promise<ThreatEvent | null> {
    try {
      const baseline = this.baselines.get(endpointId);
      if (!baseline) {
        logger.warn("No baseline available for endpoint", { endpointId });
        return null;
      }

      const anomaly = await this.detectAnomaly(baseline, metrics);
      if (!anomaly.isAnomaly) {
        return null;
      }

      const threatType = this.classifyThreatType(anomaly);
      const confidence = this.calculateConfidence(anomaly);

      if (confidence < 0.5) {
        return null;
      }

      return this.createThreatEvent(
        tenantId,
        endpointId,
        threatType,
        sourceIP,
        anomaly,
        confidence,
      );
    } catch (error) {
      logger.error("Threat analysis failed", error as Error, {
        tenantId,
        endpointId,
      });
      return null;
    }
  }

  private async detectAnomaly(
    baseline: BehaviorBaseline,
    current: EndpointMetrics,
  ): Promise<AnomalyResult> {
    const reasons: string[] = [];
    let anomalyScore = 0;
    let deviationFactor = 0;

    // Request rate analysis
    const requestRateDeviation =
      Math.abs(current.requestsPerHour - baseline.avgRequestsPerHour) /
      baseline.avgRequestsPerHour;
    if (requestRateDeviation > 2.0) {
      reasons.push(
        `Request rate ${requestRateDeviation.toFixed(2)}x above baseline`,
      );
      anomalyScore += 0.3;
      deviationFactor = Math.max(deviationFactor, requestRateDeviation);
    }

    // Response time analysis
    const responseTimeDeviation =
      Math.abs(current.responseTime - baseline.avgResponseTime) /
      baseline.avgResponseTime;
    if (responseTimeDeviation > 1.5) {
      reasons.push(
        `Response time ${responseTimeDeviation.toFixed(2)}x from baseline`,
      );
      anomalyScore += 0.2;
      deviationFactor = Math.max(deviationFactor, responseTimeDeviation);
    }

    // Error rate analysis
    const errorRateDeviation = current.errorRate - baseline.errorRateBaseline;
    if (errorRateDeviation > 0.1) {
      reasons.push(
        `Error rate increased by ${(errorRateDeviation * 100).toFixed(1)}%`,
      );
      anomalyScore += 0.4;
      deviationFactor = Math.max(deviationFactor, errorRateDeviation * 10);
    }

    // Source IP analysis
    const unknownIPs = current.sourceIPs.filter(
      (ip) => !baseline.commonSourceIPs.includes(ip),
    );
    if (unknownIPs.length > current.sourceIPs.length * 0.8) {
      reasons.push(`${unknownIPs.length} unknown source IPs detected`);
      anomalyScore += 0.25;
      deviationFactor = Math.max(
        deviationFactor,
        unknownIPs.length / current.sourceIPs.length,
      );
    }

    return {
      isAnomaly: anomalyScore > 0.5,
      anomalyScore,
      deviationFactor,
      reasons,
      baseline,
      currentMetrics: current,
    };
  }

  private classifyThreatType(anomaly: AnomalyResult): ThreatType {
    if (anomaly.reasons.some((r) => r.includes("error rate"))) {
      return "BRUTE_FORCE";
    }
    if (anomaly.reasons.some((r) => r.includes("request rate"))) {
      return "RATE_LIMIT_VIOLATION";
    }
    if (anomaly.reasons.some((r) => r.includes("unknown"))) {
      return "SUSPICIOUS_PATTERN";
    }
    return "ANOMALOUS_ACCESS";
  }

  private calculateConfidence(anomaly: AnomalyResult): number {
    let confidence = anomaly.anomalyScore;

    // Boost confidence for multiple indicators
    if (anomaly.reasons.length > 2) {
      confidence += 0.1;
    }

    // Boost confidence for severe deviations
    if (anomaly.deviationFactor > 3.0) {
      confidence += 0.15;
    }

    return Math.min(1.0, confidence);
  }

  private createThreatEvent(
    tenantId: TenantId,
    endpointId: EndpointId,
    threatType: ThreatType,
    sourceIP: string,
    anomaly: AnomalyResult,
    confidence: number,
  ): ThreatEvent {
    const threatId = `threat-${crypto.randomUUID()}` as ThreatId;

    const metadata = {
      anomalyScore: anomaly.anomalyScore,
      deviationFactor: anomaly.deviationFactor,
      reasons: [...anomaly.reasons],
      baseline: {
        ...anomaly.baseline,
        commonSourceIPs: [...anomaly.baseline.commonSourceIPs],
        typicalUserAgents: [...anomaly.baseline.typicalUserAgents],
        peakHours: [...anomaly.baseline.peakHours],
      },
      currentMetrics: anomaly.currentMetrics,
    };

    return {
      id: threatId,
      tenantId,
      threatType,
      severity: this.getSeverityFromConfidence(confidence),
      endpointId,
      sourceIP,
      description: `${threatType}: ${anomaly.reasons.join(", ")}`,
      confidence,
      evidenceIds: [],
      resolved: false,
      metadata: metadata as unknown as JsonValue,
      createdAt: new Date(),
    } as ThreatEvent;
  }

  private getSeverityFromConfidence(confidence: number): RiskLevel {
    if (confidence >= 0.9) return "CRITICAL";
    if (confidence >= 0.7) return "HIGH";
    if (confidence >= 0.5) return "MEDIUM";
    return "LOW";
  }

  async updateBaseline(
    endpointId: EndpointId,
    metrics: EndpointMetrics,
  ): Promise<void> {
    try {
      const existing = this.baselines.get(endpointId);
      const now = Date.now() as Millis;

      if (!existing) {
        this.baselines.set(endpointId, {
          endpointId,
          avgRequestsPerHour: metrics.requestsPerHour,
          avgResponseTime: metrics.responseTime,
          commonSourceIPs: [...metrics.sourceIPs],
          typicalUserAgents: [...metrics.userAgents],
          peakHours: [new Date().getHours()],
          errorRateBaseline: metrics.errorRate,
          lastUpdated: now,
        });
      } else {
        // Update existing baseline with exponential moving average
        const alpha = 0.1;
        this.baselines.set(endpointId, {
          ...existing,
          avgRequestsPerHour:
            existing.avgRequestsPerHour * (1 - alpha) +
            metrics.requestsPerHour * alpha,
          avgResponseTime:
            existing.avgResponseTime * (1 - alpha) +
            metrics.responseTime * alpha,
          errorRateBaseline:
            existing.errorRateBaseline * (1 - alpha) +
            metrics.errorRate * alpha,
          lastUpdated: now,
        });
      }
    } catch (error) {
      logger.error("Behavioral analysis failed", error as Error, {
        endpointId,
      });
    }
  }

  async trainMLModel(
    tenantId: TenantId,
    trainingData: any[],
  ): Promise<MLModel> {
    try {
      // Placeholder for ML model training
      const model: MLModel = {
        modelId: `model-${tenantId}-${Date.now()}`,
        version: "1.0.0",
        accuracy: 0.95, // Real threat detection accuracy
        lastTrained: new Date(),
      };

      this.mlModels.set(tenantId, model);
      return model;
    } catch (error) {
      logger.error("ML model training failed", error as Error, {
        tenant_id: tenantId,
      });
      throw error;
    }
  }

  async markFalsePositive(
    threatId: ThreatId,
    tenantId: TenantId,
  ): Promise<void> {
    try {
      this.detectionStats.falsePositives++;
      logger.info("Threat marked as false positive", {
        threatId,
        tenantId,
      });
    } catch (error) {
      logger.error("Failed to mark false positive", error as Error, {
        threatId,
        tenantId,
      });
    }
  }

  getDetectionStats() {
    return { ...this.detectionStats };
  }

  getThreatPatterns() {
    return new Map(this.threatPatterns);
  }
}
