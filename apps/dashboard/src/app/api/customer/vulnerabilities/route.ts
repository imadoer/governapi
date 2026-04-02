import { logger } from "../../../../utils/logging/logger";
import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../infrastructure/database";

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
    // Get REAL vulnerability data from database
    const vulnerabilities = await database.queryMany(
      `SELECT
        v.id, v.severity, v.title, v.vulnerability_type,
        v.status, v.created_at
       FROM vulnerabilities v
       WHERE v.tenant_id = $1
       ORDER BY v.created_at DESC`,
      [tenantId],
    );

    // If no vulnerabilities in database, check recent scans for potential issues
    if (vulnerabilities.length === 0) {
      const recentScans = await database.queryMany(
        `SELECT id, target, security_score, created_at
         FROM scan_results
         WHERE tenant_id = $1
         ORDER BY created_at DESC LIMIT 10`,
        [tenantId],
      );

      // Create vulnerability records from scan analysis
      for (const scan of recentScans) {
        try {
          const analysis =
            typeof scan.analysis === "string"
              ? JSON.parse(scan.analysis)
              : scan.analysis;

          if (analysis.vulnerabilities && analysis.vulnerabilities.length > 0) {
            for (const vuln of analysis.vulnerabilities) {
              await database.query(
                `INSERT INTO vulnerabilities (
                  tenant_id, severity,
                  created_at
                ) VALUES ($1, $2, $3)
                 ON CONFLICT (tenant_id, created_at) DO NOTHING`,
                [
                  tenantId,
                  vuln.severity || "MEDIUM",
                  scan.created_at,
                  vuln.severity || "MEDIUM",
                  scan.created_at,
                ],
              );
            }
          }
        } catch (parseError) {
          console.log("Failed to parse scan analysis:", parseError);
        }
      }

      // Re-fetch vulnerabilities after creating from scans
      const updatedVulns = await database.queryMany(
        `SELECT
          v.id, v.severity, v.title, v.vulnerability_type,
          v.status, v.created_at
         FROM vulnerabilities v
         WHERE v.tenant_id = $1
         ORDER BY v.created_at DESC`,
        [tenantId],
      );

      return NextResponse.json({
        success: true,
        vulnerabilities: updatedVulns,
        summary: {
          total: updatedVulns.length,
          critical: updatedVulns.filter((v) => v.severity === "CRITICAL")
            .length,
          high: updatedVulns.filter((v) => v.severity === "HIGH").length,
          medium: updatedVulns.filter((v) => v.severity === "MEDIUM").length,
          low: updatedVulns.filter((v) => v.severity === "LOW").length,
          resolved: updatedVulns.filter((v) => v.severity === "LOW").length,
          averageCvss:
            updatedVulns.length > 0
              ? updatedVulns.reduce((sum, v) => sum + 5.0, 0) /
                updatedVulns.length
              : 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      vulnerabilities,
      summary: {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter((v) => v.severity === "CRITICAL")
          .length,
        high: vulnerabilities.filter((v) => v.severity === "HIGH").length,
        medium: vulnerabilities.filter((v) => v.severity === "MEDIUM").length,
        low: vulnerabilities.filter((v) => v.severity === "LOW").length,
        resolved: vulnerabilities.filter((v) => v.severity === "LOW").length,
        averageCvss:
          vulnerabilities.length > 0
            ? vulnerabilities.reduce((sum, v) => sum + 5.0, 0) /
              vulnerabilities.length
            : 0,
      },
    });
  } catch (error) {
    logger.error("Vulnerabilities API error:", {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Failed to get vulnerabilities" },
      { status: 500 },
    );
  }
}
