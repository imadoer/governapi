/**
 * API Inventory Management System
 * Catalog management, version tracking, dependency mapping
 */

import {
  TenantId,
  APIId,
  EndpointId,
  HTTPMethod,
  DataClassification,
  RiskLevel,
  APIEndpoint,
  Millis,
  JsonValue,
  createEndpointId,
} from "../core/types";
import { database } from "../infrastructure/database";

import { classifyEndpoint, ClassificationResult } from "./classifier";

export interface APIInventoryEntry {
  readonly endpoint: APIEndpoint;
  readonly classification: ClassificationResult;
  readonly dependencies: readonly APIDependency[];
  readonly versions: readonly APIVersion[];
  readonly health: APIHealthStatus;
  readonly usage: APIUsageStats;
  readonly lastUpdated: Millis;
}

export interface APIDependency {
  readonly dependentEndpoint: EndpointId;
  readonly dependencyEndpoint: EndpointId;
  readonly dependencyType: "UPSTREAM" | "DOWNSTREAM" | "PEER";
  readonly relationshipStrength: number; // 0-1 scale
  readonly discoveredAt: Millis;
}

export interface APIVersion {
  readonly version: string;
  readonly endpoints: readonly EndpointId[];
  readonly deprecated: boolean;
  readonly supportedUntil?: Millis;
  readonly changelog?: string;
  readonly discoveredAt: Millis;
}

export interface APIHealthStatus {
  readonly status: "HEALTHY" | "DEGRADED" | "UNHEALTHY" | "UNKNOWN";
  readonly uptime: number; // percentage
  readonly avgResponseTime: number;
  readonly errorRate: number;
  readonly lastHealthCheck: Millis;
  readonly healthScore: number; // 0-100
}

export interface APIUsageStats {
  readonly requestsPerHour: number;
  readonly uniqueConsumers: number;
  readonly peakUsageTime: string;
  readonly geographicDistribution: Record<string, number>;
  readonly lastActivity: Millis;
}

export interface InventorySearchFilters {
  readonly dataClassification?: DataClassification;
  readonly riskLevel?: RiskLevel;
  readonly service?: string;
  readonly version?: string;
  readonly health?: "HEALTHY" | "DEGRADED" | "UNHEALTHY";
  readonly lastSeenSince?: Millis;
  readonly tags?: readonly string[];
}

export interface InventoryStats {
  readonly totalEndpoints: number;
  readonly endpointsByClassification: Record<DataClassification, number>;
  readonly endpointsByRisk: Record<RiskLevel, number>;
  readonly healthyEndpoints: number;
  readonly deprecatedEndpoints: number;
  readonly averageRiskScore: number;
  readonly complianceGaps: number;
}

class APIInventoryManager {
  private static instance: APIInventoryManager;
  private inventoryCache = new Map<EndpointId, APIInventoryEntry>();
  private dependencyGraph = new Map<EndpointId, Set<EndpointId>>();
  private versionRegistry = new Map<string, APIVersion>();

  private constructor() {}

  static getInstance(): APIInventoryManager {
    if (!APIInventoryManager.instance) {
      APIInventoryManager.instance = new APIInventoryManager();
    }
    return APIInventoryManager.instance;
  }

  async addEndpoint(
    tenantId: TenantId,
    endpoint: APIEndpoint,
    sampleRequest?: JsonValue,
    sampleResponse?: JsonValue,
  ): Promise<APIInventoryEntry> {
    const startTime = Date.now();

    try {
      // Classify the endpoint
      const classification = await classifyEndpoint(
        tenantId,
        endpoint.method,
        endpoint.path,
        endpoint.host,
        {},
        sampleRequest,
        sampleResponse,
      );

      // Update endpoint with classification results
      const updatedEndpoint = {
        ...endpoint,
        dataClassification: classification.dataClassification,
        riskScore: classification.riskScore,
      };

      // Create or update database entry
      const dbEndpoint = await database.createAPIEndpoint({
        ...updatedEndpoint,
        createdBy: "system:inventory",
      });

      // Initialize health status
      const health: APIHealthStatus = {
        status: "UNKNOWN",
        uptime: 0,
        avgResponseTime: endpoint.avgResponseTime || 0,
        errorRate: endpoint.errorRate || 0,
        lastHealthCheck: Date.now() as Millis,
        healthScore: 50,
      };

      // Initialize usage stats
      const usage: APIUsageStats = {
        requestsPerHour: 0,
        uniqueConsumers: 0,
        peakUsageTime: "12:00",
        geographicDistribution: {},
        lastActivity: endpoint.lastSeen || (Date.now() as Millis),
      };

      // Discover dependencies
      const dependencies = await this.discoverDependencies(tenantId, endpoint);

      // Check for versions
      const versions = await this.discoverVersions(tenantId, endpoint);

      const inventoryEntry: APIInventoryEntry = {
        endpoint: dbEndpoint,
        classification,
        dependencies,
        versions,
        health,
        usage,
        lastUpdated: Date.now() as Millis,
      };

      // Cache the entry
      this.inventoryCache.set(endpoint.id, inventoryEntry);

      // Update dependency graph
      this.updateDependencyGraph(endpoint.id, dependencies);

      // Update version registry
      if (endpoint.version) {
        this.updateVersionRegistry(
          endpoint.service || "unknown",
          endpoint.version,
          endpoint.id,
        );
      }

      console.info("API endpoint added to inventory", {
        tenant_id: tenantId,
        endpoint_id: endpoint.id,
        classification: classification.dataClassification,
        risk_score: classification.riskScore,
        dependencies_found: dependencies.length,
        processing_time_ms: Date.now() - startTime,
      });

      // metrics.recordEndpointDiscovery(tenantId, endpoint.discoverySource, classification.dataClassification);

      return inventoryEntry;
    } catch (error) {
      console.error("Failed to add endpoint to inventory", error as Error, {
        tenant_id: tenantId,
        endpoint_id: endpoint.id,
      });
      throw error;
    }
  }

  async updateEndpoint(
    tenantId: TenantId,
    endpointId: EndpointId,
    updates: Partial<APIEndpoint>,
  ): Promise<APIInventoryEntry | null> {
    try {
      const existing = await this.getEndpoint(tenantId, endpointId);
      if (!existing) {
        console.warn("Endpoint not found for update", {
          tenant_id: tenantId,
          endpoint_id: endpointId,
        });
        return null;
      }

      // Update database
      await database.updateAPIEndpointMetrics(endpointId, {
        requestCount: updates.requestCount,
        avgResponseTime: updates.avgResponseTime,
        errorRate: updates.errorRate,
        lastSeen: updates.lastSeen,
      });

      // Update cached entry
      const updatedEndpoint = { ...existing.endpoint, ...updates };
      const updatedEntry = {
        ...existing,
        endpoint: updatedEndpoint,
        lastUpdated: Date.now() as Millis,
      };

      this.inventoryCache.set(endpointId, updatedEntry);

      console.debug("Endpoint updated in inventory", {
        tenant_id: tenantId,
        endpoint_id: endpointId,
      });

      return updatedEntry;
    } catch (error) {
      console.error("Failed to update endpoint in inventory", error as Error, {
        tenant_id: tenantId,
        endpoint_id: endpointId,
      });
      throw error;
    }
  }

  async getEndpoint(
    tenantId: TenantId,
    endpointId: EndpointId,
  ): Promise<APIInventoryEntry | null> {
    try {
      // Check cache first
      const cached = this.inventoryCache.get(endpointId);
      if (cached && cached.endpoint.tenantId === tenantId) {
        return cached;
      }

      // Load from database
      const dbEndpoint = await database.getAPIEndpoint(tenantId, endpointId);
      if (!dbEndpoint) {
        return null;
      }

      // Rebuild inventory entry
      const entry = await this.rebuildInventoryEntry(tenantId, dbEndpoint);
      this.inventoryCache.set(endpointId, entry);

      return entry;
    } catch (error) {
      console.error("Failed to get endpoint from inventory", error as Error, {
        tenant_id: tenantId,
        endpoint_id: endpointId,
      });
      return null;
    }
  }

  async searchEndpoints(
    tenantId: TenantId,
    filters: InventorySearchFilters = {},
    pagination: { limit: number; offset: number } = { limit: 100, offset: 0 },
  ): Promise<{ entries: APIInventoryEntry[]; total: number }> {
    try {
      // Convert filters to database filters
      const dbFilters: any = { tenantId };

      if (filters.dataClassification) {
        dbFilters.riskLevel = filters.dataClassification;
      }
      if (filters.service) {
        dbFilters.service = filters.service;
      }
      if (filters.lastSeenSince) {
        dbFilters.startDate = new Date(filters.lastSeenSince);
      }

      const { endpoints, total } = await database.findAPIEndpoints(
        tenantId,
        dbFilters,
        pagination,
      );

      // Convert to inventory entries
      const entries: APIInventoryEntry[] = [];
      for (const endpoint of endpoints) {
        try {
          const entry = await this.rebuildInventoryEntry(tenantId, endpoint);

          // Apply additional filters
          if (this.matchesFilters(entry, filters)) {
            entries.push(entry);
          }
        } catch (error) {
          console.warn("Failed to rebuild inventory entry during search", {
            tenant_id: tenantId,
            endpoint_id: endpoint.id,
            error: (error as Error).message,
          });
        }
      }

      console.debug("Endpoint search completed", {
        tenant_id: tenantId,
        filters,
        results_count: entries.length,
        total_available: total,
      });

      return { entries, total };
    } catch (error) {
      console.error("Endpoint search failed", error as Error, {
        tenant_id: tenantId,
        filters,
      });
      throw error;
    }
  }

  async getInventoryStats(tenantId: TenantId): Promise<InventoryStats> {
    try {
      const { entries } = await this.searchEndpoints(
        tenantId,
        {},
        { limit: 10000, offset: 0 },
      );

      const stats: InventoryStats = {
        totalEndpoints: entries.length,
        endpointsByClassification: {
          PUBLIC: 0,
          INTERNAL: 0,
          CONFIDENTIAL: 0,
          RESTRICTED: 0,
          PII: 0,
          PHI: 0,
        },
        endpointsByRisk: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        },
        healthyEndpoints: 0,
        deprecatedEndpoints: 0,
        averageRiskScore: 0,
        complianceGaps: 0,
      };

      let totalRiskScore = 0;

      for (const entry of entries) {
        // Classification stats
        stats.endpointsByClassification[entry.endpoint.dataClassification]++;

        // Risk stats
        stats.endpointsByRisk[entry.classification.riskLevel]++;
        totalRiskScore += entry.endpoint.riskScore;

        // Health stats
        if (entry.health.status === "HEALTHY") {
          (stats as any).healthyEndpoints++;
        }

        // Version stats
        const hasDeprecatedVersions = entry.versions.some((v) => v.deprecated);
        if (hasDeprecatedVersions) {
          (stats as any).deprecatedEndpoints++;
        }

        // Compliance gaps
        if (
          entry.classification.complianceFlags.length === 0 &&
          entry.endpoint.dataClassification !== "PUBLIC"
        ) {
          (stats as any).complianceGaps++;
        }
      }

      (stats as any).averageRiskScore =
        entries.length > 0 ? Math.round(totalRiskScore / entries.length) : 0;

      console.info("Inventory stats calculated", {
        tenant_id: tenantId,
        stats,
      });

      return stats;
    } catch (error) {
      console.error("Failed to calculate inventory stats", error as Error, {
        tenant_id: tenantId,
      });
      throw error;
    }
  }

  async updateHealthStatus(
    tenantId: TenantId,
    endpointId: EndpointId,
  ): Promise<APIHealthStatus> {
    try {
      const entry = await this.getEndpoint(tenantId, endpointId);
      if (!entry) {
        throw new Error("Endpoint not found");
      }

      const healthStatus = await this.performHealthCheck(entry.endpoint);

      // Update cached entry
      const updatedEntry = {
        ...entry,
        health: healthStatus,
        lastUpdated: Date.now() as Millis,
      };
      this.inventoryCache.set(endpointId, updatedEntry);

      console.debug("Health status updated", {
        tenant_id: tenantId,
        endpoint_id: endpointId,
        status: healthStatus.status,
        health_score: healthStatus.healthScore,
      });

      return healthStatus;
    } catch (error) {
      console.error("Failed to update health status", error as Error, {
        tenant_id: tenantId,
        endpoint_id: endpointId,
      });
      throw error;
    }
  }

  async getDependencies(
    tenantId: TenantId,
    endpointId: EndpointId,
  ): Promise<APIDependency[]> {
    try {
      const entry = await this.getEndpoint(tenantId, endpointId);
      return (entry?.dependencies as APIDependency[]) || [];
    } catch (error) {
      console.error("Failed to get dependencies", error as Error, {
        tenant_id: tenantId,
        endpoint_id: endpointId,
      });
      return [];
    }
  }

  async findDependents(
    tenantId: TenantId,
    endpointId: EndpointId,
  ): Promise<EndpointId[]> {
    const dependents: EndpointId[] = [];

    for (const [id, deps] of Array.from(this.dependencyGraph)) {
      if (deps.has(endpointId)) {
        const entry = await this.getEndpoint(tenantId, id);
        if (entry && entry.endpoint.tenantId === tenantId) {
          dependents.push(id);
        }
      }
    }

    return dependents;
  }

  private async rebuildInventoryEntry(
    tenantId: TenantId,
    endpoint: APIEndpoint,
  ): Promise<APIInventoryEntry> {
    // Perform fresh classification
    const classification = await classifyEndpoint(
      tenantId,
      endpoint.method,
      endpoint.path,
      endpoint.host,
    );

    // Get current health status
    const health = await this.performHealthCheck(endpoint);

    // Calculate usage stats
    const usage = await this.calculateUsageStats(tenantId, endpoint.id);

    // Get dependencies
    const dependencies = await this.discoverDependencies(tenantId, endpoint);

    // Get versions
    const versions = await this.discoverVersions(tenantId, endpoint);

    return {
      endpoint,
      classification,
      dependencies,
      versions,
      health,
      usage,
      lastUpdated: Date.now() as Millis,
    };
  }

  private matchesFilters(
    entry: APIInventoryEntry,
    filters: InventorySearchFilters,
  ): boolean {
    if (
      filters.dataClassification &&
      entry.endpoint.dataClassification !== filters.dataClassification
    ) {
      return false;
    }

    if (
      filters.riskLevel &&
      entry.classification.riskLevel !== filters.riskLevel
    ) {
      return false;
    }

    if (filters.service && entry.endpoint.service !== filters.service) {
      return false;
    }

    if (filters.version && entry.endpoint.version !== filters.version) {
      return false;
    }

    if (filters.health && entry.health.status !== filters.health) {
      return false;
    }

    if (
      filters.lastSeenSince &&
      entry.endpoint.lastSeen < filters.lastSeenSince
    ) {
      return false;
    }

    return true;
  }

  private async discoverDependencies(
    tenantId: TenantId,
    endpoint: APIEndpoint,
  ): Promise<APIDependency[]> {
    const dependencies: APIDependency[] = [];

    try {
      // Analyze endpoint path for dependency patterns
      const pathSegments = endpoint.path.split("/").filter(Boolean);

      // Look for upstream service calls in common patterns
      for (const segment of pathSegments) {
        if (segment.includes("api") || segment.startsWith("v")) {
          continue; // Skip API versioning segments
        }

        // Check if this segment matches other known endpoints
        const { entries } = await this.searchEndpoints(
          tenantId,
          { service: segment },
          { limit: 10, offset: 0 },
        );

        for (const entry of entries) {
          if (
            entry.endpoint.id !== endpoint.id &&
            entry.endpoint.host === endpoint.host
          ) {
            dependencies.push({
              dependentEndpoint: endpoint.id,
              dependencyEndpoint: entry.endpoint.id,
              dependencyType: "UPSTREAM",
              relationshipStrength: 0.7,
              discoveredAt: Date.now() as Millis,
            });
          }
        }
      }

      // Look for database dependencies (placeholder - would integrate with actual DB monitoring)
      if (
        endpoint.path.includes("/users") ||
        endpoint.path.includes("/accounts")
      ) {
        // These endpoints likely depend on user database
        console.debug("Database dependency detected", {
          tenant_id: tenantId,
          endpoint_id: endpoint.id,
          dependency_type: "database",
        });
      }
    } catch (error) {
      console.warn("Dependency discovery failed", {
        tenant_id: tenantId,
        endpoint_id: endpoint.id,
        error: (error as Error).message,
      });
    }

    return dependencies;
  }

  private async discoverVersions(
    tenantId: TenantId,
    endpoint: APIEndpoint,
  ): Promise<APIVersion[]> {
    const versions: APIVersion[] = [];

    try {
      const serviceName = endpoint.service || "unknown";

      // Extract version from path
      const versionMatch = endpoint.path.match(/\/v(\d+(?:\.\d+)*)/);
      if (versionMatch) {
        const version = versionMatch[1];

        versions.push({
          version,
          endpoints: [endpoint.id],
          deprecated: false,
          discoveredAt: Date.now() as Millis,
        });
      }

      // Extract version from explicit version field
      if (endpoint.version) {
        const existing = versions.find((v) => v.version === endpoint.version);
        if (!existing) {
          versions.push({
            version: endpoint.version,
            endpoints: [endpoint.id],
            deprecated: false,
            discoveredAt: Date.now() as Millis,
          });
        }
      }

      // If no version found, assume v1
      if (versions.length === 0) {
        versions.push({
          version: "1.0.0",
          endpoints: [endpoint.id],
          deprecated: false,
          discoveredAt: Date.now() as Millis,
        });
      }
    } catch (error) {
      console.warn("Version discovery failed", {
        tenant_id: tenantId,
        endpoint_id: endpoint.id,
        error: (error as Error).message,
      });
    }

    return versions;
  }

  private async performHealthCheck(
    endpoint: APIEndpoint,
  ): Promise<APIHealthStatus> {
    const startTime = Date.now();

    try {
      // Construct URL for health check
      const url = `${endpoint.protocol}://${endpoint.host}:${endpoint.port}${endpoint.path}`;

      // Try to make a HEAD request first (less intrusive)
      const response = await fetch(url, {
        method: "HEAD",

        headers: {
          "User-Agent": "APIGuard-HealthCheck/1.0",
        },
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.status < 500;

      let healthScore = 100;
      if (response.status >= 400) healthScore -= 30;
      if (response.status >= 500) healthScore -= 60;
      if (responseTime > 2000) healthScore -= 20;
      if (responseTime > 5000) healthScore -= 40;

      const status =
        healthScore > 70
          ? "HEALTHY"
          : healthScore > 40
            ? "DEGRADED"
            : "UNHEALTHY";

      return {
        status,
        uptime: isHealthy ? 100 : 0,
        avgResponseTime: responseTime,
        errorRate: isHealthy ? 0 : 1,
        lastHealthCheck: Date.now() as Millis,
        healthScore: Math.max(0, healthScore),
      };
    } catch (error) {
      console.debug("Health check failed", {
        endpoint_id: endpoint.id,
        error: (error as Error).message,
        duration_ms: Date.now() - startTime,
      });

      return {
        status: "UNHEALTHY",
        uptime: 0,
        avgResponseTime: Date.now() - startTime,
        errorRate: 1,
        lastHealthCheck: Date.now() as Millis,
        healthScore: 0,
      };
    }
  }

  private async calculateUsageStats(
    tenantId: TenantId,
    endpointId: EndpointId,
  ): Promise<APIUsageStats> {
    try {
      const last24Hours = Date.now() - 24 * 60 * 60 * 1000;

      const usageMetrics = await database.getUsageMetrics(
        tenantId,
        new Date(last24Hours),
        new Date(),
        endpointId,
      );

      const totalRequests = usageMetrics.reduce(
        (sum: number, metric: any) => sum + metric.total_requests,
        0,
      );
      const requestsPerHour = Math.round(totalRequests / 24);

      // Calculate unique consumers (simplified - would need actual tracking)
      const uniqueConsumers = Math.max(1, Math.floor(totalRequests / 100));

      // Find peak usage time
      const hourlyUsage = usageMetrics.reduce(
        (acc: any, metric: any) => {
          const hour = new Date(metric.hour).getHours();
          acc[hour] = (acc[hour] || 0) + metric.total_requests;
          return acc;
        },
        {} as Record<number, number>,
      );

      const peakHour = Object.entries(hourlyUsage).sort(
        ([, a], [, b]) => (b as number) - (a as number),
      )[0];

      const peakUsageTime = peakHour ? `${peakHour[0]}:00` : "12:00";

      return {
        requestsPerHour,
        uniqueConsumers,
        peakUsageTime,
        geographicDistribution: { US: 0.8, EU: 0.2 }, // Placeholder
        lastActivity: Date.now() as Millis,
      };
    } catch (error) {
      console.warn("Usage stats calculation failed", {
        tenant_id: tenantId,
        endpoint_id: endpointId,
        error: (error as Error).message,
      });

      return {
        requestsPerHour: 0,
        uniqueConsumers: 0,
        peakUsageTime: "12:00",
        geographicDistribution: {},
        lastActivity: 0 as Millis,
      };
    }
  }

  private updateDependencyGraph(
    endpointId: EndpointId,
    dependencies: APIDependency[],
  ): void {
    const deps = new Set<EndpointId>();
    for (const dep of dependencies) {
      deps.add(dep.dependencyEndpoint);
    }
    this.dependencyGraph.set(endpointId, deps);
  }

  private updateVersionRegistry(
    service: string,
    version: string,
    endpointId: EndpointId,
  ): void {
    const key = `${service}:${version}`;
    const existing = this.versionRegistry.get(key);

    if (existing) {
      const updatedVersion: APIVersion = {
        ...existing,
        endpoints: [...existing.endpoints, endpointId],
      };
      this.versionRegistry.set(key, updatedVersion);
    } else {
      const newVersion: APIVersion = {
        version,
        endpoints: [endpointId],
        deprecated: false,
        discoveredAt: Date.now() as Millis,
      };
      this.versionRegistry.set(key, newVersion);
    }
  }

  // Bulk operations
  async bulkUpdateHealth(
    tenantId: TenantId,
  ): Promise<{ updated: number; failed: number }> {
    const { entries } = await this.searchEndpoints(
      tenantId,
      {},
      { limit: 1000, offset: 0 },
    );

    let updated = 0;
    let failed = 0;

    const batchSize = 10;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);

      const promises = batch.map(async (entry) => {
        try {
          await this.updateHealthStatus(tenantId, entry.endpoint.id);
          return { success: true };
        } catch (error) {
          console.warn("Health update failed in bulk operation", {
            tenant_id: tenantId,
            endpoint_id: entry.endpoint.id,
            error: (error as Error).message,
          });
          return { success: false };
        }
      });

      const results = await Promise.allSettled(promises);
      updated += results.filter(
        (r) => r.status === "fulfilled" && r.value.success,
      ).length;
      failed += results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.success),
      ).length;

      // Small delay between batches
      if (i + batchSize < entries.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.info("Bulk health update completed", {
      tenant_id: tenantId,
      updated,
      failed,
      total: entries.length,
    });

    return { updated, failed };
  }

  // Cache management
  clearCache(): void {
    this.inventoryCache.clear();
    this.dependencyGraph.clear();
    this.versionRegistry.clear();
    console.info("Inventory cache cleared");
  }

  getCacheStats(): { size: number; memoryUsage: string } {
    const size = this.inventoryCache.size;
    const memoryUsage = `${Math.round(JSON.stringify(Array.from(this.inventoryCache.values())).length / 1024)}KB`;

    return { size, memoryUsage };
  }
}

// Export singleton instance
export const apiInventoryManager = APIInventoryManager.getInstance();

// Main inventory functions
export async function addEndpointToInventory(
  tenantId: TenantId,
  endpoint: APIEndpoint,
  sampleRequest?: JsonValue,
  sampleResponse?: JsonValue,
): Promise<APIInventoryEntry> {
  return apiInventoryManager.addEndpoint(
    tenantId,
    endpoint,
    sampleRequest,
    sampleResponse,
  );
}

export async function getEndpointInventory(
  tenantId: TenantId,
  endpointId: EndpointId,
): Promise<APIInventoryEntry | null> {
  return apiInventoryManager.getEndpoint(tenantId, endpointId);
}

export async function searchInventory(
  tenantId: TenantId,
  filters: InventorySearchFilters = {},
  pagination: { limit: number; offset: number } = { limit: 100, offset: 0 },
): Promise<{ entries: APIInventoryEntry[]; total: number }> {
  return apiInventoryManager.searchEndpoints(tenantId, filters, pagination);
}

export async function getInventoryStatistics(
  tenantId: TenantId,
): Promise<InventoryStats> {
  return apiInventoryManager.getInventoryStats(tenantId);
}

export async function updateEndpointHealth(
  tenantId: TenantId,
  endpointId: EndpointId,
): Promise<APIHealthStatus> {
  return apiInventoryManager.updateHealthStatus(tenantId, endpointId);
}

export async function bulkHealthUpdate(
  tenantId: TenantId,
): Promise<{ updated: number; failed: number }> {
  return apiInventoryManager.bulkUpdateHealth(tenantId);
}
