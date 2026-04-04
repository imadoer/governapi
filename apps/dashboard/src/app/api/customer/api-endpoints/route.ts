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
    const status = url.searchParams.get("status");
    const method = url.searchParams.get("method");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build dynamic query with filters
    let query = `
      SELECT a.*,
             COALESCE(sr_agg.scan_count, 0) as scan_count,
             sr_agg.last_scan_date,
             sr_agg.avg_security_score,
             COALESCE(v_agg.vulnerability_count, 0) as vulnerability_count
      FROM apis a
      LEFT JOIN (
        SELECT target, COUNT(*) as scan_count,
               MAX(created_at) as last_scan_date,
               AVG(security_score) as avg_security_score
        FROM scan_results WHERE tenant_id = $1
        GROUP BY target
      ) sr_agg ON a.url = sr_agg.target
      LEFT JOIN (
        SELECT endpoint, COUNT(*) as vulnerability_count
        FROM vulnerabilities WHERE tenant_id = $1 AND status != 'resolved'
        GROUP BY endpoint
      ) v_agg ON a.url = v_agg.endpoint
      WHERE a.tenant_id = $1`;

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND a.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (method) {
      query += ` AND a.method = $${paramIndex}`;
      params.push(method.toUpperCase());
      paramIndex++;
    }

    query += ` ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit.toString(), offset.toString());

    const endpoints = await database.queryMany(query, params);

    // Get endpoint statistics
    const endpointStats = await database.queryOne(
      `SELECT
         COUNT(*) as total_endpoints,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_endpoints,
         COUNT(DISTINCT method) as unique_methods
       FROM apis WHERE tenant_id = $1`,
      [tenantId],
    );

    // Get method distribution
    const methodDistribution = await database.queryMany(
      `SELECT method, COUNT(*) as count
       FROM apis 
       WHERE tenant_id = $1 
       GROUP BY method 
       ORDER BY count DESC`,
      [tenantId],
    );

    // Get security status summary
    const securitySummary = await database.queryOne(
      `SELECT
         COUNT(CASE WHEN severity = 'CRITICAL' OR severity = 'critical' THEN 1 END) as critical_vulns,
         COUNT(CASE WHEN severity = 'HIGH' OR severity = 'high' THEN 1 END) as high_vulns,
         COUNT(CASE WHEN severity = 'MEDIUM' OR severity = 'medium' THEN 1 END) as medium_vulns,
         COUNT(CASE WHEN severity = 'LOW' OR severity = 'low' THEN 1 END) as low_vulns
       FROM vulnerabilities
       WHERE tenant_id = $1 AND status != 'resolved'`,
      [tenantId],
    );

    const formattedEndpoints = endpoints.map((endpoint) => ({
      id: endpoint.id,
      name: endpoint.name,
      path: endpoint.url,
      url: endpoint.url,
      method: endpoint.method,
      description: endpoint.description,
      status: endpoint.status,
      createdAt: endpoint.created_at,
      updatedAt: endpoint.updated_at,
      scan_count: parseInt(endpoint.scan_count || "0"),
      last_scan_date: endpoint.last_scan_date,
      avg_security_score: endpoint.avg_security_score
        ? Math.round(parseFloat(endpoint.avg_security_score))
        : null,
      vulnerability_count: parseInt(endpoint.vulnerability_count || "0"),
    }));

    return NextResponse.json({
      success: true,
      endpoints: formattedEndpoints,
      statistics: {
        total: parseInt(endpointStats?.total_endpoints || "0"),
        active: parseInt(endpointStats?.active_endpoints || "0"),
        uniqueMethods: parseInt(endpointStats?.unique_methods || "0"),
      },
      methodDistribution: methodDistribution.map((dist) => ({
        method: dist.method,
        count: parseInt(dist.count || "0"),
      })),
      securitySummary: {
        critical: parseInt(securitySummary?.critical_vulns || "0"),
        high: parseInt(securitySummary?.high_vulns || "0"),
        medium: parseInt(securitySummary?.medium_vulns || "0"),
        low: parseInt(securitySummary?.low_vulns || "0"),
      },
      pagination: {
        limit,
        offset,
        hasMore: formattedEndpoints.length === limit,
      },
    });
  } catch (error) {
    logger.error("API endpoints fetch error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch API endpoints" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const { name, url, method, description, tags = [] } = await request.json();

    if (!name || !url || !method) {
      return NextResponse.json(
        { error: "Name, URL, and method are required" },
        { status: 400 },
      );
    }

    // Validate URL format
    try {
      const parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { error: "Invalid URL protocol. Only HTTP and HTTPS are allowed" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 },
      );
    }

    // Validate HTTP method
    const validMethods = [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "HEAD",
      "OPTIONS",
    ];
    if (!validMethods.includes(method.toUpperCase())) {
      return NextResponse.json(
        { error: "Invalid HTTP method" },
        { status: 400 },
      );
    }

    // Check for duplicate endpoint
    const existingEndpoint = await database.queryOne(
      "SELECT id FROM apis WHERE tenant_id = $1 AND url = $2 AND method = $3",
      [tenantId, url, method.toUpperCase()],
    );

    if (existingEndpoint) {
      return NextResponse.json(
        { error: "API endpoint with this URL and method already exists" },
        { status: 409 },
      );
    }

    // Create new API endpoint
    const newEndpoint = await database.queryOne(
      `INSERT INTO apis (tenant_id, name, url, method, description, tags, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW()) RETURNING *`,
      [
        tenantId,
        name,
        url,
        method.toUpperCase(),
        description || "",
        JSON.stringify(tags),
        "active",
        userId || "system",
      ],
    );

    if (!newEndpoint) {
      return NextResponse.json(
        { error: "Failed to create API endpoint" },
        { status: 500 },
      );
    }

    // Auto-trigger a quick security scan on the new endpoint
    if (url.startsWith("http")) {
      fetch(`http://localhost:3000/api/customer/security-scans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
          "x-internal-request": "true",
          "x-request-id": `auto-scan-${newEndpoint.id}`,
        },
        body: JSON.stringify({ url, scanType: "quick" }),
      }).catch((err) => {
        logger.error("Auto-scan trigger failed:", {
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }

    return NextResponse.json({
      success: true,
      endpoint: {
        id: newEndpoint.id,
        name: newEndpoint.name,
        url: newEndpoint.url,
        method: newEndpoint.method,
        description: newEndpoint.description,
        tags: Array.isArray(newEndpoint.tags) ? newEndpoint.tags : [],
        status: newEndpoint.status,
        createdAt: newEndpoint.created_at,
      },
      message: "API endpoint created successfully. A security scan has been queued automatically.",
    });
  } catch (error) {
    logger.error("API endpoint creation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create API endpoint" },
      { status: 500 },
    );
  }
}
