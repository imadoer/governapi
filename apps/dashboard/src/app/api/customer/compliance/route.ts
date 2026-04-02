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
    // Get compliance reports with scores
    const complianceReports = await database.queryMany(
      `SELECT report_type, status, compliance_score, findings, generated_at
       FROM compliance_reports
       WHERE tenant_id = $1
       ORDER BY report_type`,
      [tenantId],
    );

    // Get all frameworks and join with reports
    const frameworks = await database.queryMany(
      `SELECT cf.id, cf.framework_name, cf.version, cf.category
       FROM compliance_frameworks cf
       ORDER BY cf.framework_name`,
      [],
    );

    // Get audit history
    const auditHistory = await database.queryMany(
      `SELECT id, audit_type, framework_name, conducted_by, status, audit_firm,
              findings_count, started_at, completion_date, executive_summary
       FROM compliance_audits
       WHERE tenant_id = $1
       ORDER BY started_at DESC
       LIMIT 10`,
      [tenantId],
    );

    // Get compliance findings
    const complianceFindings = await database.queryMany(
      `SELECT id, framework_name, control_id, control_name, finding_type, 
              severity, status, description, remediation_steps, discovered_at, due_date
       FROM compliance_findings
       WHERE tenant_id = $1 AND status != 'resolved'
       ORDER BY 
         CASE severity 
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         discovered_at DESC
       LIMIT 20`,
      [tenantId],
    );

    // Calculate overall compliance score from reports
    const reportScores = complianceReports
      .filter((r) => r.status === 'completed' && r.compliance_score !== null)
      .map((r) => parseInt(r.compliance_score));
    
    const overallScore = reportScores.length > 0
      ? Math.round(reportScores.reduce((sum, score) => sum + score, 0) / reportScores.length)
      : 0;

    // Create a map of reports by framework name
    const reportsMap = new Map(
      complianceReports.map((r) => [r.report_type, r])
    );

    // Merge frameworks with their reports
    const formattedFrameworks = frameworks.map((framework) => {
      const report = reportsMap.get(framework.framework_name);
      
      if (report) {
        const findings = report.findings || {};
        const totalFindings = (findings.critical || 0) + (findings.high || 0) + 
                            (findings.medium || 0) + (findings.low || 0);
        
        return {
          frameworkName: framework.framework_name,
          version: framework.version,
          category: framework.category,
          status: report.status === 'completed' ? 'assessed' : report.status,
          compliancePercentage: report.compliance_score,
          lastAssessment: report.generated_at,
          nextAssessment: null,
          findingsCount: totalFindings,
          passedControls: findings.compliant_controls || 0,
          failedControls: (findings.total_controls || 0) - (findings.compliant_controls || 0),
          totalControls: findings.total_controls || 0,
          criticalFindings: findings.critical || 0,
          highFindings: findings.high || 0,
          mediumFindings: findings.medium || 0,
          lowFindings: findings.low || 0,
        };
      }
      
      return {
        frameworkName: framework.framework_name,
        version: framework.version,
        category: framework.category,
        status: 'not_assessed',
        compliancePercentage: null,
        lastAssessment: null,
        nextAssessment: null,
        findingsCount: 0,
      };
    });

    // Calculate statistics from reports
    let totalControls = 0;
    let compliantControls = 0;
    let totalFindings = { critical: 0, high: 0, medium: 0, low: 0 };

    complianceReports.forEach((report) => {
      if (report.findings) {
        const findings = report.findings;
        totalControls += findings.total_controls || 0;
        compliantControls += findings.compliant_controls || 0;
        totalFindings.critical += findings.critical || 0;
        totalFindings.high += findings.high || 0;
        totalFindings.medium += findings.medium || 0;
        totalFindings.low += findings.low || 0;
      }
    });

    const nonCompliantControls = totalControls - compliantControls;

    return NextResponse.json({
      success: true,
      compliance: {
        overallScore,
        frameworks: formattedFrameworks,
        statistics: {
          compliantControls,
          nonCompliantControls,
          pendingControls: 0,
          totalControls,
          findings: totalFindings,
        },
        findings: complianceFindings.map((finding) => ({
          id: finding.id,
          frameworkName: finding.framework_name,
          controlId: finding.control_id,
          controlName: finding.control_name,
          findingType: finding.finding_type,
          severity: finding.severity,
          status: finding.status,
          description: finding.description,
          remediationSteps: finding.remediation_steps,
          discoveredAt: finding.discovered_at,
          dueDate: finding.due_date,
        })),
        auditHistory: auditHistory.map((audit) => ({
          id: audit.id,
          auditType: audit.audit_type,
          frameworkName: audit.framework_name,
          conductedBy: audit.conducted_by,
          auditFirm: audit.audit_firm,
          status: audit.status,
          findingsCount: audit.findings_count,
          startedAt: audit.started_at,
          completionDate: audit.completion_date,
          executiveSummary: audit.executive_summary,
        })),
      },
    });
  } catch (error: any) {
    logger.error("Compliance data fetch error:", { error: error.message });
    return NextResponse.json(
      { error: "Failed to fetch compliance data" },
      { status: 500 },
    );
  }
}
