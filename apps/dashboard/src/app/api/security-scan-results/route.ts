import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../infrastructure/database";

export async function GET(request: NextRequest) {
  // Get tenant ID from middleware-injected headers
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const url = new URL(request.url);
    const scanId = url.searchParams.get("scan_id");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    let scanResults = [];

    if (scanId) {
      // Get specific scan result
      const result = await database.queryOne(
        "SELECT * FROM scan_results WHERE tenant_id = $1 AND scan_id = $2",
        [tenantId, scanId],
      );
      scanResults = result ? [result] : [];
    } else {
      // Get recent scan results for tenant
      scanResults = await database.queryMany(
        `SELECT scan_id, scan_type, status, vulnerabilities_found, risk_score, 
                completed_at, target_endpoint, analysis 
         FROM scan_results 
         WHERE tenant_id = $1 
         ORDER BY completed_at DESC 
         LIMIT $2`,
        [tenantId, limit],
      );
    }

    if (scanResults.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No scan results available. Run a security scan first.",
        results: [],
      });
    }

    // Format results for response
    const formattedResults = scanResults.map((result) => ({
      scan_id: result.scan_id,
      scan_type: result.scan_type,
      status: result.status,
      target: result.target_endpoint,
      vulnerabilities_found: result.vulnerabilities_found || 0,
      risk_score: result.risk_score || 0,
      completed_at: result.completed_at,
      analysis: result.analysis ? JSON.parse(result.analysis) : null,
    }));

    return NextResponse.json({
      success: true,
      results: scanId ? formattedResults[0] : formattedResults,
      total_scans: formattedResults.length,
    });
  } catch (error) {
    logger.error("Security scan results error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to retrieve scan results",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  // Get tenant ID from middleware-injected headers
  const tenantId = request.headers.get("x-tenant-id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const {
      scan_id,
      scan_type,
      target_endpoint,
      analysis,
      vulnerabilities_found,
      risk_score,
    } = await request.json();

    if (!scan_id || !scan_type || !target_endpoint) {
      return NextResponse.json(
        { error: "scan_id, scan_type, and target_endpoint are required" },
        { status: 400 },
      );
    }

    // Store scan results with tenant isolation
    await database.query(
      `INSERT INTO scan_results (tenant_id, scan_id, scan_type, target_endpoint, 
                                analysis, vulnerabilities_found, risk_score, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       ON CONFLICT (tenant_id, scan_id) 
       DO UPDATE SET analysis = $5, vulnerabilities_found = $6, risk_score = $7, 
                     status = $8, completed_at = NOW()`,
      [
        tenantId,
        scan_id,
        scan_type,
        target_endpoint,
        JSON.stringify(analysis),
        vulnerabilities_found || 0,
        risk_score || 0,
        "completed",
      ],
    );

    return NextResponse.json({
      success: true,
      message: "Scan results stored successfully",
      scan_id,
    });
  } catch (error) {
    logger.error("Scan results storage error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      {
        error: "Failed to store scan results",
      },
      { status: 500 },
    );
  }
}
