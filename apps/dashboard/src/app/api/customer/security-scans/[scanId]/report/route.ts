import { NextRequest, NextResponse } from "next/server";
import { database } from "../../../../../../infrastructure/database";
import { logger } from "../../../../../../utils/logging/logger";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ scanId: string }> }
) {
  const tenantId = request.headers.get("x-tenant-id");
  
  if (!tenantId) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    const { scanId: scanIdStr } = await context.params;
    const scanId = parseInt(scanIdStr);

    // Get scan data
    const scan = await database.queryOne(
      `SELECT 
        ss.id,
        ss.url as target,
        ss.scan_type,
        ss.status,
        ss.security_score,
        ss.vulnerability_count,
        ss.created_at,
        ss.completed_at,
        ss.scan_duration as duration
       FROM security_scans ss
       WHERE ss.id = $1 AND ss.tenant_id = $2`,
      [scanId, tenantId]
    );

    if (!scan) {
      return NextResponse.json(
        { error: "Scan not found" },
        { status: 404 }
      );
    }

    // Get vulnerabilities for this scan
    const vulnerabilities = await database.queryMany(
      `SELECT 
        id,
        vulnerability_type,
        severity,
        title,
        description,
        affected_url,
        remediation,
        cwe_id,
        cvss_score
       FROM vulnerabilities
       WHERE scan_id = $1
       ORDER BY 
         CASE severity
           WHEN 'CRITICAL' THEN 1
           WHEN 'HIGH' THEN 2
           WHEN 'MEDIUM' THEN 3
           WHEN 'LOW' THEN 4
         END`,
      [scanId]
    );

    const scanData = {
      id: scan.id,
      target: scan.target,
      scanType: scan.scan_type,
      status: scan.status,
      securityScore: scan.security_score || 0,
      vulnerabilityCount: scan.vulnerability_count || 0,
      createdAt: scan.created_at,
      completedAt: scan.completed_at,
      duration: scan.duration || 0,
      vulnerabilities: vulnerabilities,
      tenantId: tenantId,
      companyName: "Enterprise Client"
    };

    // Check if Puppeteer is available
    try {
      const { generateVulnerabilityReport } = await import('../../../../../../services/report-generator');
      const result = await generateVulnerabilityReport(scanData);

      // Return PDF
      return new NextResponse(result.pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="security-report-${scanId}.pdf"`,
        },
      });

    } catch (error) {
      // Puppeteer not ready, return JSON for now
      logger.warn("PDF generation not available, returning JSON", { error });
      
      return NextResponse.json({
        success: true,
        message: "PDF generation in progress. Returning JSON data.",
        scanData,
        note: "Install Puppeteer to enable PDF export"
      });
    }

  } catch (error: any) {
    logger.error("Report generation error:", { error: error.message });
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
