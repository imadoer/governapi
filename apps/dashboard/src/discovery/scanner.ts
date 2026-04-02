/**
 * Network API Discovery Scanner
 * Traffic analysis, endpoint detection, service mesh integration
 */

import { networkInterfaces } from "os";
import { promisify } from "util";
import { exec } from "child_process";
import * as http from "http";
import * as https from "https";
import { URL } from "url";
import { environmentConfig } from "../config/environment";
import { database } from "../infrastructure/database";
import { logger, metrics } from "../infrastructure/monitoring";
import {
  TenantId,
  EndpointId,
  HTTPMethod,
  DiscoverySource,
  DataClassification,
  NetworkEndpoint,
  Millis,
  SystemError,
  calculateRiskScore,
  createEndpointId,
  JsonValue,
} from "../core/types";

const execAsync = promisify(exec);

export interface ScanTarget {
  readonly host: string;
  readonly portRange: readonly [number, number];
  readonly protocols: readonly ("http" | "https")[];
  readonly timeout: Millis;
}

export interface ScanResult {
  readonly target: ScanTarget;
  readonly discoveries: readonly NetworkEndpoint[];
  readonly errors: readonly string[];
  readonly scanDuration: Millis;
  readonly timestamp: Millis;
}

interface TrafficCapture {
  sourceIP: string;
  destinationIP: string;
  destinationPort: number;
  method: HTTPMethod;
  path: string;
  userAgent?: string;
  contentType?: string;
  statusCode?: number;
  responseTime?: number;
  timestamp: Millis;
}

class NetworkScanner {
  private static instance: NetworkScanner;
  private isScanning = false;
  private scanQueue: ScanTarget[] = [];
  private activeScanners = 0;
  private discoveredEndpoints = new Map<string, NetworkEndpoint>();

  private constructor() {}

  static getInstance(): NetworkScanner {
    if (!NetworkScanner.instance) {
      NetworkScanner.instance = new NetworkScanner();
    }
    return NetworkScanner.instance;
  }

  async scanNetwork(
    tenantId: TenantId,
    targets: ScanTarget[],
  ): Promise<ScanResult[]> {
    const config = environmentConfig.getConfig();
    const startTime = Date.now();

    logger.info("Starting network scan", {
      tenant_id: tenantId,
      target_count: targets.length,
      max_concurrent: config.discovery.maxConcurrentScans,
    });

    try {
      const results: ScanResult[] = [];
      const semaphore = new Semaphore(config.discovery.maxConcurrentScans);

      const scanPromises = targets.map(async (target) => {
        await semaphore.acquire();
        try {
          const result = await this.scanTarget(tenantId, target);
          results.push(result);

          metrics.scanDuration.observe(
            { tenant_id: tenantId, scan_type: "network" },
            result.scanDuration,
          );

          return result;
        } finally {
          semaphore.release();
        }
      });

      await Promise.allSettled(scanPromises);

      const totalDuration = Date.now() - startTime;
      logger.info("Network scan completed", {
        tenant_id: tenantId,
        results_count: results.length,
        total_duration_ms: totalDuration,
      });

      return results;
    } catch (error) {
      metrics.scanErrors.inc({
        tenant_id: tenantId,
        error_type: "scan_failure",
        target_host: "multiple",
      });
      throw error;
    }
  }

  private async scanTarget(
    tenantId: TenantId,
    target: ScanTarget,
  ): Promise<ScanResult> {
    const startTime = Date.now();
    const discoveries: NetworkEndpoint[] = [];
    const errors: string[] = [];

    try {
      const openPorts = await this.scanPorts(
        target.host,
        target.portRange,
        target.timeout,
      );

      for (const port of openPorts) {
        for (const protocol of target.protocols) {
          try {
            const endpoint = await this.probeHTTPService(
              target.host,
              port,
              protocol,
              target.timeout,
            );
            if (endpoint) {
              discoveries.push(endpoint);
              await this.storeDiscoveredEndpoint(
                tenantId,
                endpoint,
                "TRAFFIC_ANALYSIS",
              );
            }
          } catch (error) {
            errors.push(
              `${protocol}://${target.host}:${port} - ${(error as Error).message}`,
            );
          }
        }
      }
    } catch (error) {
      errors.push(`Port scan failed: ${(error as Error).message}`);
      metrics.scanErrors.inc({
        tenant_id: tenantId,
        error_type: "port_scan_failure",
        target_host: target.host,
      });
    }

    return {
      target,
      discoveries,
      errors,
      scanDuration: (Date.now() - startTime) as Millis,
      timestamp: Date.now() as Millis,
    };
  }

  private async scanPorts(
    host: string,
    portRange: readonly [number, number],
    timeout: Millis,
  ): Promise<number[]> {
    const [startPort, endPort] = portRange;
    const openPorts: number[] = [];
    const maxConcurrent = 50;
    const semaphore = new Semaphore(maxConcurrent);

    const portPromises: Promise<void>[] = [];

    for (let port = startPort; port <= endPort; port++) {
      const portPromise = semaphore.acquire().then(async () => {
        try {
          const isOpen = await this.checkPort(host, port, timeout);
          if (isOpen) {
            openPorts.push(port);
          }
        } finally {
          semaphore.release();
        }
      });

      portPromises.push(portPromise);
    }

    await Promise.allSettled(portPromises);
    return openPorts.sort((a, b) => a - b);
  }

  private async checkPort(
    host: string,
    port: number,
    timeout: Millis,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new (require("net").Socket)();

      const timer = setTimeout(() => {
        socket.destroy();
        resolve(false);
      }, timeout);

      socket.connect(port, host, () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(true);
      });

      socket.on("error", () => {
        clearTimeout(timer);
        socket.destroy();
        resolve(false);
      });
    });
  }

  private async probeHTTPService(
    host: string,
    port: number,
    protocol: "http" | "https",
    timeout: Millis,
  ): Promise<NetworkEndpoint | null> {
    try {
      const url = `${protocol}://${host}:${port}/`;
      const response = await this.makeHTTPRequest(url, timeout);

      if (response.statusCode && response.statusCode < 500) {
        return {
          host,
          port,
          protocol,
          service: this.detectService(response.headers, response.body),
          version: this.detectVersion(response.headers, response.body),
          healthCheck: this.detectHealthEndpoint(response.body),
        };
      }
    } catch (error) {
      if ((error as Error).message.includes("ECONNREFUSED")) {
        return null;
      }

      const commonPaths = ["/api", "/v1", "/health", "/status", "/docs"];
      for (const path of commonPaths) {
        try {
          const url = `${protocol}://${host}:${port}${path}`;
          const response = await this.makeHTTPRequest(url, timeout);

          if (response.statusCode && response.statusCode < 500) {
            return {
              host,
              port,
              protocol,
              service: this.detectService(response.headers, response.body),
              version: this.detectVersion(response.headers, response.body),
              healthCheck:
                path === "/health" || path === "/status" ? path : undefined,
            };
          }
        } catch {
          continue;
        }
      }
    }

    return null;
  }

  private async makeHTTPRequest(
    url: string,
    timeout: Millis,
  ): Promise<{
    statusCode?: number;
    headers: Record<string, string>;
    body: string;
  }> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port,
        path: urlObj.pathname + urlObj.search,
        method: "GET",
        timeout,
        headers: {
          "User-Agent": "APIGuard-Discovery/1.0",
          Accept: "application/json, text/html, */*",
        },
      };

      const client = urlObj.protocol === "https:" ? https : http;

      const req = client.request(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
          if (body.length > 10000) {
            res.destroy();
          }
        });

        res.on("end", () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers as Record<string, string>,
            body: body.substring(0, 10000),
          });
        });
      });

      req.on("error", reject);
      req.on("timeout", () => {
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.end();
    });
  }

  private detectService(headers: Record<string, string>, body: string): string {
    const server = headers.server || headers["x-powered-by"] || "";
    if (server.includes("nginx")) return "nginx";
    if (server.includes("apache")) return "apache";
    if (server.includes("express")) return "express";
    if (server.includes("spring")) return "spring-boot";
    if (server.includes("django")) return "django";
    if (server.includes("rails")) return "ruby-rails";

    if (body.includes("swagger") || body.includes("openapi"))
      return "api-gateway";
    if (body.includes("grafana")) return "grafana";
    if (body.includes("prometheus")) return "prometheus";
    if (body.includes("elasticsearch")) return "elasticsearch";
    if (body.includes("kibana")) return "kibana";

    if (headers["content-type"]?.includes("application/json"))
      return "api-service";
    if (body.includes("graphql")) return "graphql";
    if (body.includes("rest api") || body.includes("restful"))
      return "rest-api";

    return "unknown";
  }

  private detectVersion(
    headers: Record<string, string>,
    body: string,
  ): string | undefined {
    const versionHeaders = [
      "x-api-version",
      "api-version",
      "version",
      "x-version",
    ];
    for (const header of versionHeaders) {
      if (headers[header]) {
        return headers[header];
      }
    }

    const versionPatterns = [
      /"version":\s*"([^"]+)"/,
      /"api_version":\s*"([^"]+)"/,
      /version:\s*([^\s,}]+)/,
      /v(\d+\.\d+\.\d+)/,
    ];

    for (const pattern of versionPatterns) {
      const match = body.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return undefined;
  }

  private detectHealthEndpoint(body: string): string | undefined {
    if (body.includes("/health")) return "/health";
    if (body.includes("/status")) return "/status";
    if (body.includes("/ping")) return "/ping";
    if (body.includes("/ready")) return "/ready";
    if (body.includes("/live")) return "/live";
    return undefined;
  }

  private async storeDiscoveredEndpoint(
    tenantId: TenantId,
    endpoint: NetworkEndpoint,
    source: DiscoverySource,
  ): Promise<void> {
    try {
      const endpointId = createEndpointId("GET", "/", endpoint.host);

      const existing = await database.getAPIEndpoint(tenantId, endpointId);
      if (existing) {
        await database.updateAPIEndpointMetrics(endpointId, {
          lastSeen: Date.now() as Millis,
        });
        return;
      }

      await database.createAPIEndpoint({
        tenantId,
        method: "GET",
        path: "/",
        host: endpoint.host,
        port: endpoint.port,
        protocol: endpoint.protocol,
        service: endpoint.service || "unknown",
        version: endpoint.version,
        dataClassification: "INTERNAL" as DataClassification,
        riskScore: calculateRiskScore("INTERNAL", false, 0, 0.5),
        discoverySource: source,
        authRequired: false,
        rateLimited: false,
        lastSeen: Date.now() as Millis,
        requestCount: 0,
        avgResponseTime: 0,
        errorRate: 0,
        metadata: {
          discoveredAt: Date.now(),
          scanMethod: "network_probe",
          healthEndpoint: endpoint.healthCheck,
        } as JsonValue,
        createdBy: "system:scanner",
      });

      logger.info("New endpoint discovered", {
        tenant_id: tenantId,
        endpoint_id: endpointId,
        host: endpoint.host,
        port: endpoint.port,
        service: endpoint.service,
      });
    } catch (error) {
      logger.error("Failed to store discovered endpoint", error as Error, {
        tenant_id: tenantId,
        host: endpoint.host,
        port: endpoint.port,
      });
    }
  }
}

class TrafficAnalyzer {
  private static instance: TrafficAnalyzer;
  private captureBuffer: TrafficCapture[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private isCapturing = false;

  private constructor() {}

  static getInstance(): TrafficAnalyzer {
    if (!TrafficAnalyzer.instance) {
      TrafficAnalyzer.instance = new TrafficAnalyzer();
    }
    return TrafficAnalyzer.instance;
  }

  async startTrafficCapture(
    tenantId: TenantId,
    interfaces: string[] = [],
  ): Promise<void> {
    if (this.isCapturing) {
      logger.warn("Traffic capture already running", { tenant_id: tenantId });
      return;
    }

    const config = environmentConfig.getConfig();
    if (!config.discovery.passiveMonitoringEnabled) {
      logger.info("Passive monitoring disabled", { tenant_id: tenantId });
      return;
    }

    try {
      this.isCapturing = true;

      const networkIntfs =
        interfaces.length > 0 ? interfaces : this.getNetworkInterfaces();

      for (const intf of networkIntfs) {
        this.startPacketCapture(tenantId, intf);
      }

      this.processingInterval = setInterval(() => {
        this.processCapturedTraffic(tenantId);
      }, 30000);

      logger.info("Traffic capture started", {
        tenant_id: tenantId,
        interfaces: networkIntfs,
      });
    } catch (error) {
      this.isCapturing = false;
      throw new Error(
        `Failed to start traffic capture: ${(error as Error).message}`,
      );
    }
  }

  private getNetworkInterfaces(): string[] {
    const interfaces = networkInterfaces();
    const validInterfaces: string[] = [];

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs && name !== "lo" && !name.startsWith("docker")) {
        const hasIPv4 = addrs.some(
          (addr) => addr.family === "IPv4" && !addr.internal,
        );
        if (hasIPv4) {
          validInterfaces.push(name);
        }
      }
    }

    return validInterfaces;
  }

  private async startPacketCapture(
    tenantId: TenantId,
    interfaceName: string,
  ): Promise<void> {
    try {
      const tcpdumpCmd = `tcpdump -i ${interfaceName} -n -s 0 -A 'tcp port 80 or tcp port 443 or tcp port 8080' -c 1000`;

      const { stdout, stderr } = await execAsync(tcpdumpCmd, {
        timeout: 60000,
      });

      if (stderr && !stderr.includes("listening on")) {
        logger.warn("tcpdump warnings", {
          tenant_id: tenantId,
          interface: interfaceName,
          stderr,
        });
      }

      this.parseTcpdumpOutput(stdout);
    } catch (error) {
      logger.error("Packet capture failed", error as Error, {
        tenant_id: tenantId,
        interface: interfaceName,
      });

      await this.fallbackNetstatDiscovery(tenantId);
    }
  }

  private parseTcpdumpOutput(output: string): void {
    const lines = output.split("\n");
    let currentPacket: Partial<TrafficCapture> = {};

    for (const line of lines) {
      const timestampMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d+)/);
      const ipMatch = line.match(
        /(\d+\.\d+\.\d+\.\d+)\.(\d+) > (\d+\.\d+\.\d+\.\d+)\.(\d+)/,
      );

      if (timestampMatch && ipMatch) {
        const [, sourceIP, sourcePort, destIP, destPort] = ipMatch;
        currentPacket = {
          sourceIP,
          destinationIP: destIP,
          destinationPort: parseInt(destPort),
          timestamp: Date.now() as Millis,
        };
      }

      const httpMatch = line.match(
        /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+([^\s]+)\s+HTTP/,
      );
      if (httpMatch && currentPacket.sourceIP) {
        const [, method, path] = httpMatch;
        currentPacket.method = method as HTTPMethod;
        currentPacket.path = path;

        const userAgentMatch = line.match(/User-Agent:\s*([^\r\n]+)/);
        if (userAgentMatch) {
          currentPacket.userAgent = userAgentMatch[1].trim();
        }

        const contentTypeMatch = line.match(/Content-Type:\s*([^\r\n]+)/);
        if (contentTypeMatch) {
          currentPacket.contentType = contentTypeMatch[1].trim();
        }

        if (this.isCompleteCapture(currentPacket)) {
          this.captureBuffer.push(currentPacket as TrafficCapture);
        }
      }

      const responseMatch = line.match(/HTTP\/[\d.]+\s+(\d{3})/);
      if (responseMatch && currentPacket.method) {
        currentPacket.statusCode = parseInt(responseMatch[1]);
      }
    }
  }

  private isCompleteCapture(
    capture: Partial<TrafficCapture>,
  ): capture is TrafficCapture {
    return !!(
      capture.sourceIP &&
      capture.destinationIP &&
      capture.destinationPort &&
      capture.method &&
      capture.path &&
      capture.timestamp
    );
  }

  private async processCapturedTraffic(tenantId: TenantId): Promise<void> {
    if (this.captureBuffer.length === 0) return;

    const captures = [...this.captureBuffer];
    this.captureBuffer = [];

    logger.debug("Processing captured traffic", {
      tenant_id: tenantId,
      capture_count: captures.length,
    });

    const endpointGroups = new Map<string, TrafficCapture[]>();

    for (const capture of captures) {
      const key = `${capture.destinationIP}:${capture.destinationPort}`;
      const existing = endpointGroups.get(key) || [];
      existing.push(capture);
      endpointGroups.set(key, existing);
    }

    for (const [endpoint, trafficList] of Array.from(endpointGroups)) {
      await this.analyzeEndpointTraffic(tenantId, endpoint, trafficList);
    }
  }

  private async analyzeEndpointTraffic(
    tenantId: TenantId,
    endpoint: string,
    traffic: TrafficCapture[],
  ): Promise<void> {
    const [host, portStr] = endpoint.split(":");
    const port = parseInt(portStr);

    const methods = new Set(traffic.map((t) => t.method));
    const paths = new Set(traffic.map((t) => t.path));
    const statusCodes = traffic
      .map((t) => t.statusCode)
      .filter((code): code is number => code !== undefined);
    const responseTimes = traffic
      .map((t) => t.responseTime)
      .filter((time): time is number => time !== undefined);

    const avgResponseTime =
      responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

    const errorRate =
      statusCodes.length > 0
        ? statusCodes.filter((code) => code >= 400).length / statusCodes.length
        : 0;

    const isAPI = this.detectAPIPattern(Array.from(paths), traffic);

    if (isAPI) {
      for (const path of Array.from(paths)) {
        for (const method of Array.from(methods)) {
          await this.createOrUpdateEndpoint(
            tenantId,
            method,
            path,
            host,
            port,
            {
              avgResponseTime,
              errorRate,
              requestCount: traffic.filter(
                (t) => t.method === method && t.path === path,
              ).length,
            },
          );
        }
      }
    }
  }

  private detectAPIPattern(
    paths: string[],
    traffic: TrafficCapture[],
  ): boolean {
    const apiIndicators = [
      paths.some((p) => p.startsWith("/api/")),
      paths.some((p) => p.startsWith("/v1/") || p.startsWith("/v2/")),
      paths.some((p) => p.includes("json")),
      traffic.some((t) => t.contentType?.includes("application/json")),
      traffic.some((t) =>
        ["POST", "PUT", "DELETE", "PATCH"].includes(t.method),
      ),
      paths.length > 3,
      new Set(traffic.map((t) => t.method)).size > 1,
    ];

    return apiIndicators.filter(Boolean).length >= 3;
  }

  private async createOrUpdateEndpoint(
    tenantId: TenantId,
    method: string,
    path: string,
    host: string,
    port: number,
    endpointMetrics: {
      avgResponseTime: number;
      errorRate: number;
      requestCount: number;
    },
  ): Promise<void> {
    const endpointId = createEndpointId(method as HTTPMethod, path, host);

    try {
      const existing = await database.getAPIEndpoint(tenantId, endpointId);

      if (existing) {
        await database.updateAPIEndpointMetrics(endpointId, {
          requestCount: existing.requestCount + endpointMetrics.requestCount,
          avgResponseTime:
            (existing.avgResponseTime + endpointMetrics.avgResponseTime) / 2,
          errorRate: (existing.errorRate + endpointMetrics.errorRate) / 2,
          lastSeen: Date.now() as Millis,
        });
      } else {
        await database.createAPIEndpoint({
          tenantId,
          method: method as HTTPMethod,
          path,
          host,
          port,
          protocol: port === 443 ? "https" : "http",
          service: "discovered-service",
          dataClassification: "INTERNAL" as DataClassification,
          riskScore: calculateRiskScore(
            "INTERNAL",
            false,
            endpointMetrics.errorRate,
            0.3,
          ),
          discoverySource: "TRAFFIC_ANALYSIS",
          authRequired: false,
          rateLimited: false,
          lastSeen: Date.now() as Millis,
          requestCount: endpointMetrics.requestCount || 0,
          avgResponseTime: endpointMetrics.avgResponseTime || 0,
          errorRate: endpointMetrics.errorRate || 0,
          metadata: {
            discoveredFromTraffic: true,
            initialMetrics: endpointMetrics,
          } as JsonValue,
          createdBy: "system:traffic-analyzer",
        });
      }
    } catch (error) {
      logger.error(
        "Failed to create/update endpoint from traffic",
        error as Error,
        {
          tenant_id: tenantId,
          endpoint_id: endpointId,
        },
      );
    }
  }

  private async fallbackNetstatDiscovery(tenantId: TenantId): Promise<void> {
    try {
      const { stdout } = await execAsync(
        "netstat -tlnp 2>/dev/null | grep LISTEN",
      );
      const ports = this.parseNetstatOutput(stdout);

      logger.info("Fallback discovery using netstat", {
        tenant_id: tenantId,
        ports_found: ports.length,
      });

      const scanner = NetworkScanner.getInstance();
      const targets: ScanTarget[] = ports.map((port) => ({
        host: "127.0.0.1",
        portRange: [port, port] as [number, number],
        protocols: ["http", "https"] as ("http" | "https")[],
        timeout: 5000 as Millis,
      }));

      await scanner.scanNetwork(tenantId, targets);
    } catch (error) {
      logger.error("Fallback netstat discovery failed", error as Error, {
        tenant_id: tenantId,
      });
    }
  }

  private parseNetstatOutput(output: string): number[] {
    const ports: number[] = [];
    const lines = output.split("\n");

    for (const line of lines) {
      const match = line.match(/:(\d+)\s+.*LISTEN/);
      if (match) {
        const port = parseInt(match[1]);
        if (port > 1024 && port < 65535) {
          ports.push(port);
        }
      }
    }

    return Array.from(new Set(ports)).sort((a, b) => a - b);
  }

  stopTrafficCapture(): void {
    this.isCapturing = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info("Traffic capture stopped");
  }
}

class ServiceMeshIntegrator {
  private static instance: ServiceMeshIntegrator;

  private constructor() {}

  static getInstance(): ServiceMeshIntegrator {
    if (!ServiceMeshIntegrator.instance) {
      ServiceMeshIntegrator.instance = new ServiceMeshIntegrator();
    }
    return ServiceMeshIntegrator.instance;
  }

  async discoverFromIstio(tenantId: TenantId): Promise<NetworkEndpoint[]> {
    try {
      const { stdout } = await execAsync(
        "kubectl get services -o json 2>/dev/null",
      );
      const services = JSON.parse(stdout);

      const endpoints: NetworkEndpoint[] = [];

      for (const service of services.items || []) {
        const serviceName = service.metadata?.name;
        const ports = service.spec?.ports || [];

        for (const port of ports) {
          if (
            port.port &&
            (port.name?.includes("http") ||
              [80, 443, 8080, 8443].includes(port.port))
          ) {
            endpoints.push({
              host: serviceName,
              port: port.port,
              protocol: port.port === 443 ? "https" : "http",
              service: serviceName,
              version: service.metadata?.labels?.version,
            });
          }
        }
      }

      logger.info("Istio service discovery completed", {
        tenant_id: tenantId,
        services_found: endpoints.length,
      });

      return endpoints;
    } catch (error) {
      logger.warn("Istio discovery failed, kubectl not available", {
        tenant_id: tenantId,
      });
      return [];
    }
  }

  async discoverFromConsul(
    tenantId: TenantId,
    consulEndpoint: string,
  ): Promise<NetworkEndpoint[]> {
    try {
      const url = `${consulEndpoint}/v1/catalog/services`;
      const response = await fetch(url);
      const services = await response.json();

      const endpoints: NetworkEndpoint[] = [];

      for (const [serviceName, tags] of Object.entries(services)) {
        try {
          const serviceUrl = `${consulEndpoint}/v1/catalog/service/${serviceName}`;
          const serviceResponse = await fetch(serviceUrl);
          const serviceData = await serviceResponse.json();

          for (const instance of serviceData) {
            if (instance.ServicePort && instance.ServiceAddress) {
              endpoints.push({
                host: instance.ServiceAddress,
                port: instance.ServicePort,
                protocol: instance.ServicePort === 443 ? "https" : "http",
                service: serviceName,
                version: instance.ServiceMeta?.version,
              });
            }
          }
        } catch (error) {
          logger.debug("Failed to query Consul service", {
            service: serviceName,
            error: (error as Error).message,
          });
        }
      }

      logger.info("Consul service discovery completed", {
        tenant_id: tenantId,
        services_found: endpoints.length,
      });

      return endpoints;
    } catch (error) {
      logger.warn("Consul discovery failed", {
        tenant_id: tenantId,
        error: (error as Error).message,
      });
      return [];
    }
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve();
      } else {
        this.waitQueue.push(resolve);
      }
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}

class DiscoveryOrchestrator {
  private static instance: DiscoveryOrchestrator;
  private scheduler: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): DiscoveryOrchestrator {
    if (!DiscoveryOrchestrator.instance) {
      DiscoveryOrchestrator.instance = new DiscoveryOrchestrator();
    }
    return DiscoveryOrchestrator.instance;
  }

  async startDiscovery(tenantId: TenantId): Promise<void> {
    if (this.isRunning) {
      logger.warn("Discovery already running", { tenant_id: tenantId });
      return;
    }

    const config = environmentConfig.getConfig();
    this.isRunning = true;

    logger.info("Starting API discovery orchestrator", { tenant_id: tenantId });

    const trafficAnalyzer = TrafficAnalyzer.getInstance();
    await trafficAnalyzer.startTrafficCapture(tenantId);

    this.scheduler = setInterval(async () => {
      await this.performPeriodicScan(tenantId);
    }, config.discovery.scanIntervalMs);

    await this.performPeriodicScan(tenantId);
  }

  private async performPeriodicScan(tenantId: TenantId): Promise<void> {
    try {
      logger.info("Starting periodic discovery scan", { tenant_id: tenantId });

      const scanner = NetworkScanner.getInstance();
      const serviceMesh = ServiceMeshIntegrator.getInstance();

      const targets = this.generateScanTargets();
      const scanResults = await scanner.scanNetwork(tenantId, targets);

      const istioEndpoints = await serviceMesh.discoverFromIstio(tenantId);

      const consulEndpoint = process.env.CONSUL_ENDPOINT;
      const consulEndpoints = consulEndpoint
        ? await serviceMesh.discoverFromConsul(tenantId, consulEndpoint)
        : [];

      const totalDiscovered =
        scanResults.reduce(
          (sum, result) => sum + result.discoveries.length,
          0,
        ) +
        istioEndpoints.length +
        consulEndpoints.length;

      logger.info("Periodic discovery scan completed", {
        tenant_id: tenantId,
        network_discoveries: scanResults.reduce(
          (sum, result) => sum + result.discoveries.length,
          0,
        ),
        istio_discoveries: istioEndpoints.length,
        consul_discoveries: consulEndpoints.length,
        total_discovered: totalDiscovered,
      });
    } catch (error) {
      logger.error("Periodic discovery scan failed", error as Error, {
        tenant_id: tenantId,
      });
    }
  }

  private generateScanTargets(): ScanTarget[] {
    const config = environmentConfig.getConfig();
    const commonPorts = config.discovery.allowedPorts;

    const targets: ScanTarget[] = [
      {
        host: "127.0.0.1",
        portRange: [commonPorts[0], commonPorts[commonPorts.length - 1]] as [
          number,
          number,
        ],
        protocols: ["http", "https"],
        timeout: config.discovery.networkTimeoutMs as Millis,
      },
    ];

    for (const range of config.discovery.excludedNetworks) {
      if (
        !range.includes("192.168.") &&
        !range.includes("10.") &&
        !range.includes("172.")
      ) {
        targets.push({
          host: range.split("/")[0],
          portRange: [80, 443] as [number, number],
          protocols: ["http", "https"],
          timeout: config.discovery.networkTimeoutMs as Millis,
        });
      }
    }

    return targets;
  }

  stopDiscovery(): void {
    this.isRunning = false;

    if (this.scheduler) {
      clearInterval(this.scheduler);
      this.scheduler = null;
    }

    const trafficAnalyzer = TrafficAnalyzer.getInstance();
    trafficAnalyzer.stopTrafficCapture();

    logger.info("Discovery orchestrator stopped");
  }
}

export const networkScanner = NetworkScanner.getInstance();
export const trafficAnalyzer = TrafficAnalyzer.getInstance();
export const serviceMeshIntegrator = ServiceMeshIntegrator.getInstance();
export const discoveryOrchestrator = DiscoveryOrchestrator.getInstance();

export async function initializeDiscovery(tenantId: TenantId): Promise<void> {
  logger.info("Initializing discovery system", { tenant_id: tenantId });
  await discoveryOrchestrator.startDiscovery(tenantId);
}

export async function performManualScan(
  tenantId: TenantId,
  targets: ScanTarget[],
): Promise<ScanResult[]> {
  return networkScanner.scanNetwork(tenantId, targets);
}

export function stopDiscovery(): void {
  discoveryOrchestrator.stopDiscovery();
}
