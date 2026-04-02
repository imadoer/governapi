import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

export async function GET(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);
    const domain = url.searchParams.get("domain");
    const scanType = url.searchParams.get("scanType") || "comprehensive";

    if (!domain) {
      return NextResponse.json(
        { error: "Domain is required for API discovery" },
        { status: 400 },
      );
    }

    // Validate domain format
    try {
      new URL(`https://${domain}`);
    } catch {
      return NextResponse.json(
        { error: "Invalid domain format" },
        { status: 400 },
      );
    }

    // Check for existing discovery results
    const existingDiscovery = await database.queryOne(
      `SELECT * FROM api_discovery_results 
       WHERE tenant_id = $1 AND target_domain = $2 
       ORDER BY created_at DESC LIMIT 1`,
      [tenantId, domain],
    );

    // If recent discovery exists (within last 24 hours), return cached results
    if (
      existingDiscovery &&
      new Date(existingDiscovery.created_at).getTime() >
        Date.now() - 24 * 60 * 60 * 1000
    ) {
      return NextResponse.json({
        success: true,
        discovery: {
          id: existingDiscovery.id,
          domain: existingDiscovery.target_domain,
          status: existingDiscovery.status,
          discoveredEndpoints:
            typeof existingDiscovery.discovered_endpoints === "string"
              ? JSON.parse(existingDiscovery.discovered_endpoints)
              : existingDiscovery.discovered_endpoints,
          summary:
            typeof existingDiscovery.summary === "string"
              ? JSON.parse(existingDiscovery.summary)
              : existingDiscovery.summary,
          createdAt: existingDiscovery.created_at,
          cached: true,
        },
      });
    }

    // Create new discovery scan
    const discovery = await database.queryOne(
      `INSERT INTO api_discovery_results (tenant_id, target_domain, scan_type, status, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [tenantId, domain, scanType, "running"],
    );

    // Start API discovery process
    const discoveryResults = await performApiDiscovery(domain, scanType);

    // Update discovery with results
    const updatedDiscovery = await database.queryOne(
      `UPDATE api_discovery_results 
       SET status = $1, discovered_endpoints = $2, summary = $3, completed_at = NOW()
       WHERE id = $4 RETURNING *`,
      [
        "completed",
        JSON.stringify(discoveryResults.endpoints),
        JSON.stringify(discoveryResults.summary),
        discovery.id,
      ],
    );

    // Store discovered endpoints as APIs if requested
    if (discoveryResults.endpoints.length > 0) {
      for (const endpoint of discoveryResults.endpoints) {
        await database.query(
          `INSERT INTO apis (tenant_id, name, url, method, description, status, discovered_via, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (tenant_id, url, method) DO NOTHING`,
          [
            tenantId,
            endpoint.name || `${endpoint.method} ${endpoint.path}`,
            endpoint.fullUrl,
            endpoint.method,
            endpoint.description || "Discovered via API discovery",
            "discovered",
            "api_discovery",
          ],
        );
      }
    }

    return NextResponse.json({
      success: true,
      discovery: {
        id: updatedDiscovery.id,
        domain: updatedDiscovery.target_domain,
        status: updatedDiscovery.status,
        discoveredEndpoints: discoveryResults.endpoints,
        summary: discoveryResults.summary,
        createdAt: updatedDiscovery.created_at,
        completedAt: updatedDiscovery.completed_at,
      },
    });
  } catch (error) {
    logger.error("API discovery error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to perform API discovery" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { endpoints } = await request.json();

    if (!endpoints || !Array.isArray(endpoints)) {
      return NextResponse.json(
        { error: "Endpoints array is required" },
        { status: 400 },
      );
    }

    const addedEndpoints = [];
    const errors = [];

    for (const endpoint of endpoints) {
      try {
        const newApi = await database.queryOne(
          `INSERT INTO apis (tenant_id, name, url, method, description, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
          [
            tenantId,
            endpoint.name || `${endpoint.method} ${endpoint.path}`,
            endpoint.url,
            endpoint.method.toUpperCase(),
            endpoint.description || "",
            "active",
          ],
        );
        addedEndpoints.push(newApi);
      } catch (error) {
        errors.push({
          endpoint: endpoint.url,
          error: "Failed to add endpoint - may already exist",
        });
      }
    }

    return NextResponse.json({
      success: true,
      results: {
        added: addedEndpoints.length,
        errors: errors.length,
        addedEndpoints: addedEndpoints.map((api) => ({
          id: api.id,
          name: api.name,
          url: api.url,
          method: api.method,
        })),
        errorDetails: errors,
      },
    });
  } catch (error) {
    logger.error("Endpoint addition error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to add endpoints" },
      { status: 500 },
    );
  }
}

async function performApiDiscovery(domain: string, scanType: string) {
  const endpoints = [];
  const baseUrl = `https://${domain}`;

  // Common API paths to check
  const commonPaths = [
    "/api",
    "/api/v1",
    "/api/v2",
    "/api/v3",
    "/rest",
    "/graphql",
    "/webhook",
    "/webhooks",
    "/health",
    "/status",
    "/ping",
    "/metrics",
    "/docs",
    "/swagger",
    "/openapi.json",
    "/api-docs",
  ];

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  for (const path of commonPaths) {
    for (const method of methods) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${baseUrl}${path}`, {
          method: method === "GET" ? "HEAD" : method,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.status < 500) {
          // API exists if not server error
          endpoints.push({
            name: `${method} ${path}`,
            path,
            method,
            fullUrl: `${baseUrl}${path}`,
            statusCode: response.status,
            responseHeaders: {},
            discovered: true,
            description: `Discovered ${method} endpoint at ${path}`,
          });
        }
      } catch (error) {
        // Endpoint doesn't exist or is unreachable
        continue;
      }
    }
  }

  // Try to discover OpenAPI/Swagger documentation
  const docPaths = [
    "/swagger.json",
    "/openapi.json",
    "/api-docs",
    "/docs/swagger.json",
  ];
  let openApiDoc = null;

  for (const docPath of docPaths) {
    try {
      const response = await fetch(`${baseUrl}${docPath}`);
      if (response.ok) {
        openApiDoc = await response.json();
        break;
      }
    } catch (error) {
      continue;
    }
  }

  // Parse OpenAPI documentation if found
  if (openApiDoc && openApiDoc.paths) {
    for (const [path, pathItem] of Object.entries(openApiDoc.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (methods.map((m) => m.toLowerCase()).includes(method)) {
          endpoints.push({
            name:
              (operation as any).operationId ||
              `${method.toUpperCase()} ${path}`,
            path,
            method: method.toUpperCase(),
            fullUrl: `${baseUrl}${path}`,
            description:
              (operation as any).summary ||
              (operation as any).description ||
              "",
            discovered: true,
            source: "openapi",
          });
        }
      }
    }
  }

  const summary = {
    totalEndpoints: endpoints.length,
    methodDistribution: endpoints.reduce(
      (acc, ep) => {
        acc[ep.method] = (acc[ep.method] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    ),
    hasOpenApiDoc: !!openApiDoc,
    discoveryType: scanType,
    domain,
  };

  return { endpoints, summary };
}
