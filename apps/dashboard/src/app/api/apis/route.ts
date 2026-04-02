import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { startRequestTimer, endRequestTimer } from "../../../utils/performance";
import { database } from "../../../infrastructure/database";

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
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const status = url.searchParams.get("status");
    const method = url.searchParams.get("method");

    // Build dynamic query with filters
    let query = `
      SELECT a.id, a.name, a.url, a.method, a.description, a.status, a.created_at, a.updated_at,
             a.last_scanned, a.security_score, a.response_time, a.uptime_percentage,
             COUNT(sr.id) as scan_count,
             AVG(sr.security_score) as avg_security_score,
             MAX(sr.created_at) as last_scan_date
      FROM apis a
      LEFT JOIN scan_results sr ON a.id = sr.api_id
      WHERE a.tenant_id = $1`;

    const params: (string | number)[] = [tenantId];
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

    query += ` GROUP BY a.id ORDER BY a.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit.toString(), offset.toString());

    const apis = await database.queryMany(query, params);

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM apis WHERE tenant_id = $1";
    const countParams: (string | number)[] = [tenantId];
    let countIndex = 2;

    if (status) {
      countQuery += ` AND status = $${countIndex}`;
      countParams.push(status);
      countIndex++;
    }

    if (method) {
      countQuery += ` AND method = $${countIndex}`;
      countParams.push(method.toUpperCase());
    }

    const totalCount = await database.queryOne(countQuery, countParams);

    // Get API statistics
    const stats = await database.queryOne(
      `SELECT 
         COUNT(*) as total_apis,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_apis,
         COUNT(CASE WHEN last_scanned IS NOT NULL THEN 1 END) as scanned_apis,
         AVG(security_score) as avg_security_score,
         AVG(response_time) as avg_response_time,
         AVG(uptime_percentage) as avg_uptime
       FROM apis WHERE tenant_id = $1`,
      [tenantId],
    );

    const formattedApis = apis.map((api) => ({
      id: api.id,
      name: api.name,
      url: api.url,
      method: api.method,
      description: api.description,
      status: api.status,
      createdAt: api.created_at,
      updatedAt: api.updated_at,
      lastScanned: api.last_scanned,
      securityScore: api.security_score,
      responseTime: api.response_time,
      uptimePercentage: api.uptime_percentage,
      scanCount: parseInt(api.scan_count || "0"),
      averageSecurityScore: api.avg_security_score
        ? Math.round(parseFloat(api.avg_security_score))
        : null,
      lastScanDate: api.last_scan_date,
    }));

    return NextResponse.json({
      success: true,
      apis: formattedApis,
      pagination: {
        total: parseInt(totalCount?.total || "0"),
        limit,
        offset,
        hasMore: offset + limit < parseInt(totalCount?.total || "0"),
      },
      statistics: {
        total: parseInt(stats?.total_apis || "0"),
        active: parseInt(stats?.active_apis || "0"),
        scanned: parseInt(stats?.scanned_apis || "0"),
        averageSecurityScore: stats?.avg_security_score
          ? Math.round(parseFloat(stats.avg_security_score))
          : null,
        averageResponseTime: stats?.avg_response_time
          ? Math.round(parseFloat(stats.avg_response_time))
          : null,
        averageUptime: stats?.avg_uptime
          ? Math.round(parseFloat(stats.avg_uptime))
          : null,
      },
    });
  } catch (error) {
    logger.error("APIs fetch error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch APIs" },
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
    const { name, url, method, description } = await request.json();

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

    // Check for duplicate API
    const existingApi = await database.queryOne(
      "SELECT id FROM apis WHERE tenant_id = $1 AND url = $2 AND method = $3",
      [tenantId, url, method.toUpperCase()],
    );

    if (existingApi) {
      return NextResponse.json(
        { error: "API with this URL and method already exists" },
        { status: 409 },
      );
    }

    // Create new API
    const newApi = await database.queryOne(
      `INSERT INTO apis (tenant_id, name, url, method, description, status, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [
        tenantId,
        name,
        url,
        method.toUpperCase(),
        description || "",
        "active",
        userId || "system",
      ],
    );

    if (!newApi) {
      return NextResponse.json(
        { error: "Failed to create API" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      api: {
        id: newApi.id,
        name: newApi.name,
        url: newApi.url,
        method: newApi.method,
        description: newApi.description,
        status: newApi.status,
        createdAt: newApi.created_at,
      },
      message: "API created successfully",
    });
  } catch (error) {
    logger.error("API creation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create API" },
      { status: 500 },
    );
  }
}
