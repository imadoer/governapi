import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function POST(request: NextRequest) {
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const {
      target,
      scanType = "comprehensive",
      priority = "normal",
    } = await request.json();

    if (!target) {
      return NextResponse.json(
        { error: "Target URL is required" },
        { status: 400 },
      );
    }

    // Validate target URL
    try {
      const parsedUrl = new URL(target);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { error: "Invalid URL protocol. Only HTTP and HTTPS are allowed" },
          { status: 400 },
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid target URL format" },
        { status: 400 },
      );
    }

    // Validate scan type and priority
    const validScanTypes = [
      "comprehensive",
      "quick",
      "deep",
      "owasp",
      "performance",
    ];
    if (!validScanTypes.includes(scanType)) {
      return NextResponse.json(
        { error: "Invalid scan type. Allowed: " + validScanTypes.join(", ") },
        { status: 400 },
      );
    }

    const validPriorities = ["low", "normal", "high", "urgent"];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority. Allowed: " + validPriorities.join(", ") },
        { status: 400 },
      );
    }

    // Check for existing pending/running scans on same target
    const existingScan = await database.queryOne(
      `SELECT id FROM scan_results 
       WHERE tenant_id = $1 AND target = $2 AND status IN ('pending', 'running')`,
      [tenantId, target],
    );

    if (existingScan) {
      return NextResponse.json(
        {
          error: "A scan is already running for this target",
          existingScanId: existingScan.id,
        },
        { status: 409 },
      );
    }

    // Create new scan with database-generated ID
    const scan = await database.queryOne(
      `INSERT INTO scan_results (tenant_id, target, scan_type, priority, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [tenantId, target, scanType, priority, "pending"],
    );

    if (!scan) {
      return NextResponse.json(
        { error: "Failed to create scan" },
        { status: 500 },
      );
    }

    // Add to scan queue
    await database.query(
      `INSERT INTO scan_queue (scan_id, tenant_id, priority, status, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [scan.id, tenantId, priority, "queued"],
    );

    // Log scan creation
    await database.query(
      `INSERT INTO scan_audit_log (scan_id, tenant_id, action, details, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        scan.id,
        tenantId,
        "SCAN_CREATED",
        JSON.stringify({ target, scanType, priority }),
      ],
    );

    return NextResponse.json({
      success: true,
      scan: {
        id: scan.id,
        target: scan.target,
        scanType: scan.scan_type,
        priority: scan.priority,
        status: scan.status,
        createdAt: scan.created_at,
        estimatedDuration: getScanDuration(scanType),
      },
      message: "Scan queued successfully",
    });
  } catch (error) {
    logger.error("Scans API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create scan" },
      { status: 500 },
    );
  }
}

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
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = `
      SELECT sr.*, sq.position_in_queue
      FROM scan_results sr
      LEFT JOIN scan_queue sq ON sr.id = sq.scan_id
      WHERE sr.tenant_id = $1`;

    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (status) {
      query += ` AND sr.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY sr.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit.toString(), offset.toString());

    const scans = await database.queryMany(query, params);

    // Get scan statistics
    const stats = await database.queryOne(
      `SELECT 
         COUNT(*) as total_scans,
         COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_scans,
         COUNT(CASE WHEN status = 'running' THEN 1 END) as running_scans,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_scans,
         COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_scans,
         AVG(security_score) as avg_security_score
       FROM scan_results WHERE tenant_id = $1`,
      [tenantId],
    );

    return NextResponse.json({
      success: true,
      scans: scans.map((scan) => ({
        id: scan.id,
        target: scan.target,
        scanType: scan.scan_type,
        priority: scan.priority,
        status: scan.status,
        securityScore: scan.security_score,
        createdAt: scan.created_at,
        completedAt: scan.completed_at,
        queuePosition: scan.position_in_queue,
      })),
      statistics: {
        total: parseInt(stats?.total_scans || "0"),
        pending: parseInt(stats?.pending_scans || "0"),
        running: parseInt(stats?.running_scans || "0"),
        completed: parseInt(stats?.completed_scans || "0"),
        failed: parseInt(stats?.failed_scans || "0"),
        averageSecurityScore: stats?.avg_security_score
          ? Math.round(parseFloat(stats.avg_security_score))
          : null,
      },
      pagination: {
        limit,
        offset,
        hasMore: scans.length === limit,
      },
    });
  } catch (error) {
    logger.error("Scans fetch error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch scans" },
      { status: 500 },
    );
  }
}

function getScanDuration(scanType: string): string {
  const durations = {
    quick: "2-5 minutes",
    comprehensive: "10-20 minutes",
    deep: "30-60 minutes",
    owasp: "15-30 minutes",
    performance: "5-10 minutes",
  };
  return durations[scanType as keyof typeof durations] || "10-20 minutes";
}
