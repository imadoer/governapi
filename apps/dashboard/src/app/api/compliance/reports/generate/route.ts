import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../../infrastructure/database';
import puppeteer from 'puppeteer';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ success: false, error: 'Tenant ID required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'executive';
    const frameworkId = searchParams.get('frameworkId');
    const format = searchParams.get('format') || 'pdf';

    const tenant = await database.queryOne(`
      SELECT * FROM tenants WHERE id = $1
    `, [tenantId]);

    const companyName = tenant?.name || tenant?.company_name || 'Enterprise Client';

    let reportData: any = {};
    let reportTitle = '';

    switch (reportType) {
      case 'soc2':
        reportTitle = 'SOC 2 Type II Alignment Report';
        reportData = await generateSOC2Report(tenantId, frameworkId);
        break;
      case 'iso27001':
        reportTitle = 'ISO 27001 Gap Analysis Report';
        reportData = await generateISO27001Report(tenantId, frameworkId);
        break;
      case 'api-risk':
        reportTitle = 'API Risk Assessment Report';
        reportData = await generateAPIRiskReport(tenantId);
        break;
      case 'vendor':
        reportTitle = 'Vendor Risk Assessment Report';
        reportData = await generateVendorReport(tenantId);
        break;
      case 'executive':
      default:
        reportTitle = 'Executive Governance Summary';
        reportData = await generateExecutiveReport(tenantId);
        break;
    }

    const html = generateComplianceReportHTML(reportTitle, companyName, reportData, reportType);

    if (format === 'html') {
      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      });
    }

    if (format === 'json') {
      return NextResponse.json({ success: true, report: reportData });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    await browser.close();

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportType}_report_${Date.now()}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function generateExecutiveReport(tenantId: string) {
  const overallScore = await database.queryOne(`
    SELECT COALESCE(ROUND(AVG(compliance_percentage)), 0) as score
    FROM compliance_check_results WHERE tenant_id = $1
  `, [tenantId]);

  const frameworks = await database.queryMany(`
    SELECT cf.framework_name, COALESCE(ccr.compliance_percentage, 0) as score,
      CASE WHEN ccr.compliance_percentage >= 90 THEN 'Compliant'
           WHEN ccr.compliance_percentage >= 70 THEN 'Partial' ELSE 'Non-Compliant' END as status
    FROM compliance_frameworks cf
    LEFT JOIN compliance_check_results ccr ON cf.id = ccr.framework_id AND ccr.tenant_id = $1
    ORDER BY cf.framework_name
  `, [tenantId]);

  const violations = await database.queryOne(`
    SELECT COUNT(*) FILTER (WHERE status = 'open') as open,
           COUNT(*) FILTER (WHERE severity = 'critical') as critical
    FROM compliance_api_violations WHERE tenant_id = $1
  `, [tenantId]);

  const attestations = await database.queryOne(`
    SELECT COUNT(*) FILTER (WHERE attestation_status = 'attested') as current,
           COUNT(*) FILTER (WHERE attestation_status = 'overdue') as overdue,
           COUNT(*) as total
    FROM compliance_attestations WHERE tenant_id = $1
  `, [tenantId]);

  return {
    overallScore: parseInt(overallScore?.score || '0'),
    frameworks,
    violations: {
      open: parseInt(violations?.open || '0'),
      critical: parseInt(violations?.critical || '0'),
    },
    attestations: {
      current: parseInt(attestations?.current || '0'),
      overdue: parseInt(attestations?.overdue || '0'),
      total: parseInt(attestations?.total || '0'),
    },
    generatedAt: new Date().toISOString(),
  };
}

async function generateSOC2Report(tenantId: string, frameworkId: string | null) {
  const fwId = frameworkId || (await database.queryOne(`SELECT id FROM compliance_frameworks WHERE framework_name ILIKE '%SOC%' LIMIT 1`, []))?.id;
  
  const controls = await database.queryMany(`
    SELECT cc.control_id, cc.control_name, cc.category, COALESCE(ccr.status, 'pending') as status
    FROM compliance_controls cc
    LEFT JOIN compliance_check_results ccr ON cc.id = ccr.control_id AND ccr.tenant_id = $1
    WHERE cc.framework_id = $2
    ORDER BY cc.category, cc.control_id
  `, [tenantId, fwId]);

  const stats = {
    passed: controls.filter(c => c.status === 'passed').length,
    failed: controls.filter(c => c.status === 'failed').length,
    pending: controls.filter(c => c.status === 'pending').length,
    total: controls.length,
  };

  return { controls, stats, framework: 'SOC 2 Type II', generatedAt: new Date().toISOString() };
}

async function generateISO27001Report(tenantId: string, frameworkId: string | null) {
  const fwId = frameworkId || (await database.queryOne(`SELECT id FROM compliance_frameworks WHERE framework_name ILIKE '%ISO%27001%' LIMIT 1`, []))?.id;
  
  const controls = await database.queryMany(`
    SELECT cc.control_id, cc.control_name, cc.category, COALESCE(ccr.status, 'pending') as status
    FROM compliance_controls cc
    LEFT JOIN compliance_check_results ccr ON cc.id = ccr.control_id AND ccr.tenant_id = $1
    WHERE cc.framework_id = $2
    ORDER BY cc.category, cc.control_id
  `, [tenantId, fwId]);

  const gaps = controls.filter(c => c.status !== 'passed');

  return { controls, gaps, framework: 'ISO 27001:2022', generatedAt: new Date().toISOString() };
}

async function generateAPIRiskReport(tenantId: string) {
  const violations = await database.queryMany(`
    SELECT violation_type, severity, COALESCE(description, violation_type) as title, endpoint as endpoint_path, status, created_at as detected_at
    FROM compliance_api_violations
    WHERE tenant_id = $1
    ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
  `, [tenantId]);

  const stats = await database.queryOne(`
    SELECT COUNT(*) FILTER (WHERE severity = 'critical') as critical,
           COUNT(*) FILTER (WHERE severity = 'high') as high,
           COUNT(*) FILTER (WHERE severity = 'medium') as medium,
           COUNT(*) FILTER (WHERE severity = 'low') as low,
           COUNT(*) as total
    FROM compliance_api_violations WHERE tenant_id = $1
  `, [tenantId]);

  return { violations, stats, generatedAt: new Date().toISOString() };
}

async function generateVendorReport(tenantId: string) {
  const vendors = await database.queryMany(`
    SELECT vendor_name, vendor_type, risk_tier, risk_score,
           soc2_certified, iso27001_certified, hipaa_compliant, gdpr_compliant,
           last_assessment_date, next_assessment_date, status
    FROM compliance_vendors
    WHERE tenant_id = $1
    ORDER BY CASE risk_tier WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END
  `, [tenantId]);

  const stats = await database.queryOne(`
    SELECT COUNT(*) FILTER (WHERE risk_tier = 'critical') as critical,
           COUNT(*) FILTER (WHERE risk_tier = 'high') as high,
           COUNT(*) FILTER (WHERE next_assessment_date < NOW()) as overdue,
           COUNT(*) as total
    FROM compliance_vendors WHERE tenant_id = $1
  `, [tenantId]);

  return { vendors, stats, generatedAt: new Date().toISOString() };
}

function generateComplianceReportHTML(title: string, companyName: string, data: any, reportType: string): string {
  const scoreColor = (score: number) => score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${title}</title><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; }
.cover-page { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; page-break-after: always; }
.cover-title { font-size: 42px; font-weight: bold; margin-bottom: 20px; text-align: center; }
.cover-subtitle { font-size: 24px; color: #94a3b8; margin-bottom: 60px; }
.cover-meta { background: rgba(255,255,255,0.1); padding: 30px 50px; border-radius: 12px; text-align: center; }
.score-badge { display: inline-block; padding: 12px 30px; border-radius: 8px; font-size: 36px; font-weight: bold; color: white; background: ${scoreColor(data.overallScore || 0)}; margin-top: 20px; }
.page { padding: 50px; max-width: 1000px; margin: 0 auto; }
h1 { font-size: 28px; margin: 30px 0 20px; padding-bottom: 10px; border-bottom: 3px solid #2563eb; }
h2 { font-size: 22px; margin: 25px 0 15px; color: #334155; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; }
th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; }
.status-passed { color: #10b981; font-weight: 600; }
.status-failed { color: #ef4444; font-weight: 600; }
.status-pending { color: #f59e0b; font-weight: 600; }
.severity-critical { background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.severity-high { background: #fed7aa; color: #9a3412; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.severity-medium { background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.severity-low { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 25px 0; }
.stat-card { background: #f8fafc; padding: 20px; border-radius: 10px; border-left: 4px solid #2563eb; text-align: center; }
.stat-value { font-size: 28px; font-weight: bold; color: #1e293b; }
.stat-label { font-size: 13px; color: #64748b; margin-top: 5px; }
.footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 11px; }
.section { margin: 30px 0; }
</style></head><body>

<div class="cover-page">
  <div class="cover-title">${title}</div>
  <div class="cover-subtitle">Compliance Assessment Report</div>
  <div class="cover-meta">
    <div style="margin: 10px 0;"><span style="color: #94a3b8;">Organization:</span> <strong>${companyName}</strong></div>
    <div style="margin: 10px 0;"><span style="color: #94a3b8;">Report Type:</span> <strong>${reportType.toUpperCase()}</strong></div>
    <div style="margin: 10px 0;"><span style="color: #94a3b8;">Generated:</span> <strong>${new Date().toLocaleString()}</strong></div>
    ${data.overallScore !== undefined ? `<div class="score-badge">${data.overallScore}%</div>` : ''}
  </div>
</div>

<div class="page">
  <h1>Report Summary</h1>
  
  ${reportType === 'executive' ? `
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">${data.overallScore}%</div><div class="stat-label">Overall Score</div></div>
    <div class="stat-card"><div class="stat-value">${data.frameworks?.length || 0}</div><div class="stat-label">Frameworks</div></div>
    <div class="stat-card"><div class="stat-value" style="color: #ef4444;">${data.violations?.critical || 0}</div><div class="stat-label">Critical Issues</div></div>
    <div class="stat-card"><div class="stat-value">${data.attestations?.current || 0}/${data.attestations?.total || 0}</div><div class="stat-label">Attestations</div></div>
  </div>
  
  <h2>Framework Coverage</h2>
  <table>
    <thead><tr><th>Framework</th><th>Score</th><th>Status</th></tr></thead>
    <tbody>
      ${(data.frameworks || []).map((f: any) => `
        <tr><td>${f.framework_name}</td><td>${f.score}%</td><td class="status-${f.status?.toLowerCase()}">${f.status}</td></tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  ${(reportType === 'soc2' || reportType === 'iso27001') && data.controls ? `
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value" style="color: #10b981;">${data.stats?.passed || 0}</div><div class="stat-label">Passed</div></div>
    <div class="stat-card"><div class="stat-value" style="color: #ef4444;">${data.stats?.failed || 0}</div><div class="stat-label">Failed</div></div>
    <div class="stat-card"><div class="stat-value" style="color: #f59e0b;">${data.stats?.pending || 0}</div><div class="stat-label">Pending</div></div>
    <div class="stat-card"><div class="stat-value">${data.stats?.total || 0}</div><div class="stat-label">Total Controls</div></div>
  </div>
  
  <h2>Control Assessment</h2>
  <table>
    <thead><tr><th>Control ID</th><th>Name</th><th>Category</th><th>Status</th></tr></thead>
    <tbody>
      ${(data.controls || []).slice(0, 50).map((c: any) => `
        <tr><td>${c.control_id}</td><td>${c.control_name}</td><td>${c.category}</td><td class="status-${c.status}">${c.status?.toUpperCase()}</td></tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  ${reportType === 'api-risk' && data.violations ? `
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value" style="color: #ef4444;">${data.stats?.critical || 0}</div><div class="stat-label">Critical</div></div>
    <div class="stat-card"><div class="stat-value" style="color: #f59e0b;">${data.stats?.high || 0}</div><div class="stat-label">High</div></div>
    <div class="stat-card"><div class="stat-value">${data.stats?.medium || 0}</div><div class="stat-label">Medium</div></div>
    <div class="stat-card"><div class="stat-value">${data.stats?.total || 0}</div><div class="stat-label">Total</div></div>
  </div>
  
  <h2>API Violations</h2>
  <table>
    <thead><tr><th>Severity</th><th>Type</th><th>Title</th><th>Endpoint</th><th>Status</th></tr></thead>
    <tbody>
      ${(data.violations || []).slice(0, 30).map((v: any) => `
        <tr><td><span class="severity-${v.severity}">${v.severity}</span></td><td>${v.violation_type}</td><td>${v.title}</td><td>${v.endpoint_path}</td><td>${v.status}</td></tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}
  
  ${reportType === 'vendor' && data.vendors ? `
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value" style="color: #ef4444;">${data.stats?.critical || 0}</div><div class="stat-label">Critical Risk</div></div>
    <div class="stat-card"><div class="stat-value" style="color: #f59e0b;">${data.stats?.high || 0}</div><div class="stat-label">High Risk</div></div>
    <div class="stat-card"><div class="stat-value" style="color: #ef4444;">${data.stats?.overdue || 0}</div><div class="stat-label">Overdue</div></div>
    <div class="stat-card"><div class="stat-value">${data.stats?.total || 0}</div><div class="stat-label">Total Vendors</div></div>
  </div>
  
  <h2>Vendor Risk Assessment</h2>
  <table>
    <thead><tr><th>Vendor</th><th>Type</th><th>Risk Tier</th><th>Score</th><th>Certifications</th><th>Status</th></tr></thead>
    <tbody>
      ${(data.vendors || []).map((v: any) => `
        <tr>
          <td>${v.vendor_name}</td>
          <td>${v.vendor_type}</td>
          <td><span class="severity-${v.risk_tier}">${v.risk_tier}</span></td>
          <td>${v.risk_score}</td>
          <td>${[v.soc2_certified && 'SOC2', v.iso27001_certified && 'ISO27001', v.hipaa_compliant && 'HIPAA', v.gdpr_compliant && 'GDPR'].filter(Boolean).join(', ') || '-'}</td>
          <td>${v.status}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  <div class="footer">
    <p><strong>CONFIDENTIAL – For Internal Use Only</strong></p>
    <p>Generated by GovernAPI Compliance Hub • ${new Date().toLocaleString()}</p>
    <p>© 2025 GovernAPI. All Rights Reserved.</p>
  </div>
</div>
</body></html>`;
}
