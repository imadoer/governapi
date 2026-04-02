import { logger } from "../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
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
    // Get real security reports for this tenant
    const reports = await database.queryMany(
      `SELECT id, name, report_type, status, generated_at, file_path, file_size,
              parameters, created_by, summary
       FROM security_reports 
       WHERE tenant_id = $1 
       ORDER BY generated_at DESC`,
      [tenantId],
    );

    // Get report generation statistics
    const reportStats = await database.queryOne(
      `SELECT 
         COUNT(*) as total_reports,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_reports,
         COUNT(CASE WHEN generated_at >= NOW() - INTERVAL '30 days' THEN 1 END) as recent_reports,
         COUNT(CASE WHEN report_type = 'compliance' THEN 1 END) as compliance_reports,
         COUNT(CASE WHEN report_type = 'vulnerability' THEN 1 END) as vulnerability_reports,
         COUNT(CASE WHEN report_type = 'threat_analysis' THEN 1 END) as threat_reports
       FROM security_reports 
       WHERE tenant_id = $1`,
      [tenantId],
    );

    // Get recent scan data for report context
    const recentScans = await database.queryMany(
      `SELECT id, target_url, security_score, status, created_at,
              (analysis->>'total_vulnerabilities')::int as vulnerability_count
       FROM scan_results 
       WHERE tenant_id = $1 AND status = 'completed'
       ORDER BY created_at DESC 
       LIMIT 10`,
      [tenantId],
    );

    const formattedReports = reports.map((report) => ({
      id: report.id,
      name: report.name,
      type: report.report_type,
      status: report.status,
      generatedAt: report.generated_at,
      filePath: report.file_path,
      fileSize: report.file_size,
      parameters:
        typeof report.parameters === "string"
          ? JSON.parse(report.parameters)
          : report.parameters,
      createdBy: report.created_by,
      summary:
        typeof report.summary === "string"
          ? JSON.parse(report.summary)
          : report.summary,
    }));

    return NextResponse.json({
      success: true,
      reports: formattedReports,
      statistics: {
        total: parseInt(reportStats?.total_reports || "0"),
        completed: parseInt(reportStats?.completed_reports || "0"),
        recent: parseInt(reportStats?.recent_reports || "0"),
        byType: {
          compliance: parseInt(reportStats?.compliance_reports || "0"),
          vulnerability: parseInt(reportStats?.vulnerability_reports || "0"),
          threatAnalysis: parseInt(reportStats?.threat_reports || "0"),
        },
      },
      recentScans: recentScans.map((scan) => ({
        id: scan.id,
        targetUrl: scan.target_url,
        securityScore: scan.security_score,
        vulnerabilityCount: scan.vulnerability_count || 0,
        completedAt: scan.created_at,
      })),
    });
  } catch (error) {
    logger.error("Reports API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to fetch security reports" },
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
    const { name, reportType, parameters = {} } = await request.json();

    if (!name || !reportType) {
      return NextResponse.json(
        { error: "Report name and type are required" },
        { status: 400 },
      );
    }

    // Validate report type
    const validTypes = [
      "compliance",
      "vulnerability",
      "threat_analysis",
      "security_summary",
      "api_usage",
    ];
    if (!validTypes.includes(reportType)) {
      return NextResponse.json(
        { error: "Invalid report type. Allowed: " + validTypes.join(", ") },
        { status: 400 },
      );
    }

    // Create report generation request
    const reportRequest = await database.queryOne(
      `INSERT INTO security_reports (tenant_id, name, report_type, status, parameters, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        tenantId,
        name,
        reportType,
        "pending",
        JSON.stringify(parameters),
        userId || "system",
      ],
    );

    if (!reportRequest) {
      return NextResponse.json(
        { error: "Failed to create report request" },
        { status: 500 },
      );
    }

    // Queue report generation (in production, this would trigger background processing)
    await database.query(
      `INSERT INTO report_generation_queue (report_id, tenant_id, priority, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [reportRequest.id, tenantId, "normal"],
    );

    return NextResponse.json({
      success: true,
      report: {
        id: reportRequest.id,
        name: reportRequest.name,
        type: reportRequest.report_type,
        status: reportRequest.status,
        parameters:
          typeof reportRequest.parameters === "string"
            ? JSON.parse(reportRequest.parameters)
            : reportRequest.parameters,
        createdAt: reportRequest.created_at,
      },
      message: "Report generation queued successfully",
    });
  } catch (error) {
    logger.error("Report creation error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to create report request" },
      { status: 500 },
    );
  }
}
