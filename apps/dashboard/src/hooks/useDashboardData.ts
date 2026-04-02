import { useState, useEffect, useCallback } from "react";

export interface DashboardStats {
  totalEndpoints: number;
  totalThreats: number;
  totalScans: number;
  totalRequests: number;
  avgSecurityScore: number;
  threatsBlockedToday: number;
}

export interface ThreatTrends {
  overview: {
    totalThreatsBlocked: number;
    threatVelocity: string;
    topThreatType: string;
    last24Hours: number;
    averagePerDay: number;
    responseTime: number;
  };
  geographicThreats: Array<{
    country: string;
    threatCount: number;
    percentage: number;
  }>;
  threatTypes: Record<string, number>;
  attackPatterns: {
    commonVectors: Array<[string, number]>;
    successRate: string;
  };
  botAnalytics: {
    totalBots: number;
    maliciousBots: number;
    blockedBots: number;
    botTypes: Record<string, number>;
  };
}

export interface SecurityScan {
  id: string;
  scanType: string;
  status: string;
  createdAt: string;
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  findings: any;
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: string;
  cvssScore: number;
  endpoint: string;
  status: string;
  discoveredAt: string;
  description: string;
  impact: string;
  solution: string;
  exploitability: string;
  affectedEndpoints: string[];
}

export interface PerformanceMetrics {
  overview: {
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    uptimePercentage: number;
    requestsPerSecond: number;
    errorRate: number;
    throughput: number;
  };
  endpointMetrics: Array<{
    endpoint: string;
    averageResponseTime: number;
    requestCount: number;
    errorRate: number;
    status: string;
  }>;
  geographicPerformance: Record<string, { latency: number; status: string }>;
}

export interface ComplianceReport {
  framework: string;
  status: string;
  score: number;
  lastAudit: string;
  findings: number;
  criticalFindings: number;
}

export interface DashboardData {
  stats: DashboardStats | null;
  threatTrends: ThreatTrends | null;
  vulnerabilities: { vulnerabilities: Vulnerability[]; summary: any } | null;
  securityScans: SecurityScan[] | null;
  performanceMetrics: PerformanceMetrics | null;
  complianceReports: ComplianceReport[] | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export function useDashboardData(apiKey: string | null) {
  const [data, setData] = useState<DashboardData>({
    stats: null,
    threatTrends: null,
    vulnerabilities: null,
    securityScans: null,
    performanceMetrics: null,
    complianceReports: null,
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchWithAuth = useCallback(
    async (endpoint: string) => {
      if (!apiKey) {
        throw new Error("No API key available");
      }

      const response = await fetch(
        `${API_BASE}/api/customer/${endpoint}?apiKey=${apiKey}`,
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Request failed" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    [apiKey],
  );

  const fetchAllData = useCallback(async () => {
    if (!apiKey) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: "No API key available",
      }));
      return;
    }

    setData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Fetch all data in parallel for performance
      const [
        statsResult,
        threatTrendsResult,
        vulnerabilitiesResult,
        securityScansResult,
        performanceResult,
        complianceResult,
      ] = await Promise.allSettled([
        fetchWithAuth("dashboard?type=stats"),
        fetchWithAuth("threat-trends"),
        fetchWithAuth("vulnerabilities"),
        fetchWithAuth("security-scans"),
        fetchWithAuth("performance"),
        fetchWithAuth("compliance"),
      ]);

      setData({
        stats:
          statsResult.status === "fulfilled" ? statsResult.value.stats : null,
        threatTrends:
          threatTrendsResult.status === "fulfilled"
            ? threatTrendsResult.value.trends
            : null,
        vulnerabilities:
          vulnerabilitiesResult.status === "fulfilled"
            ? vulnerabilitiesResult.value
            : null,
        securityScans:
          securityScansResult.status === "fulfilled"
            ? securityScansResult.value.scans
            : null,
        performanceMetrics:
          performanceResult.status === "fulfilled"
            ? performanceResult.value.metrics
            : null,
        complianceReports:
          complianceResult.status === "fulfilled"
            ? complianceResult.value.reports
            : null,
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (error) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch dashboard data",
      }));
    }
  }, [apiKey, fetchWithAuth]);

  // Auto-refresh data every 30 seconds for real-time updates
  useEffect(() => {
    if (!apiKey) return;

    fetchAllData();
    const interval = setInterval(fetchAllData, 30000);
    return () => clearInterval(interval);
  }, [apiKey, fetchAllData]);

  const refetch = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    ...data,
    refetch,
  };
}
