import puppeteer from 'puppeteer';

export interface VulnerabilityData {
  id: string;
  vulnerability_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  affected_url: string;
  remediation: string;
  cwe_id?: string;
  cvss_score?: number;
}

export interface ScanData {
  id: number;
  target: string;
  scanType: string;
  securityScore: number;
  vulnerabilityCount: number;
  createdAt: string;
  completedAt: string;
  duration: number;
  vulnerabilities: VulnerabilityData[];
  tenantId: string;
  companyName?: string;
}

interface ReportResult {
  html: string;
  pdfBuffer: Buffer;
}

function generateReportHTML(scanData: ScanData, aiSummary?: string): string {
  const { 
    target, 
    scanType, 
    securityScore, 
    vulnerabilityCount,
    createdAt,
    completedAt,
    duration,
    vulnerabilities,
    companyName = 'Enterprise Client'
  } = scanData;

  const severityBreakdown = {
    CRITICAL: vulnerabilities.filter(v => v.severity === 'CRITICAL').length,
    HIGH: vulnerabilities.filter(v => v.severity === 'HIGH').length,
    MEDIUM: vulnerabilities.filter(v => v.severity === 'MEDIUM').length,
    LOW: vulnerabilities.filter(v => v.severity === 'LOW').length,
  };

  const scoreColor = securityScore >= 90 ? '#10b981' : 
                    securityScore >= 75 ? '#06b6d4' : 
                    securityScore >= 60 ? '#f59e0b' : '#ef4444';

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>GovernAPI Security Report</title><style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; color: #1e293b; }
.cover-page { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: linear-gradient(135deg, #1e293b 0%, #334155 100%); color: white; page-break-after: always; }
.cover-title { font-size: 48px; font-weight: bold; margin-bottom: 20px; }
.cover-subtitle { font-size: 24px; color: #94a3b8; margin-bottom: 60px; }
.cover-meta { background: rgba(255,255,255,0.1); padding: 30px 50px; border-radius: 12px; }
.score-badge { display: inline-block; padding: 8px 20px; border-radius: 8px; font-size: 32px; font-weight: bold; color: white; background: ${scoreColor}; }
.page { padding: 60px; max-width: 1200px; margin: 0 auto; }
h1 { font-size: 32px; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 3px solid #2563eb; }
table { width: 100%; border-collapse: collapse; margin: 20px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
th { background: #f1f5f9; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
td { padding: 12px; border-bottom: 1px solid #e2e8f0; }
.severity-badge { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
.severity-critical { background: #fee2e2; color: #991b1b; }
.severity-high { background: #fed7aa; color: #9a3412; }
.severity-medium { background: #fef3c7; color: #92400e; }
.severity-low { background: #e0e7ff; color: #3730a3; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 30px 0; }
.stat-card { background: #f8fafc; padding: 20px; border-radius: 12px; border-left: 4px solid #2563eb; }
.stat-value { font-size: 28px; font-weight: bold; }
.ai-summary { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #2563eb; padding: 25px; border-radius: 8px; margin: 20px 0; }
.footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #e2e8f0; text-align: center; color: #64748b; font-size: 12px; }
</style></head><body>

<div class="cover-page">
  <div class="cover-title">GovernAPI Security Intelligence Report</div>
  <div class="cover-subtitle">Vulnerability Assessment Summary</div>
  <div class="cover-meta">
    <div style="margin: 10px 0;"><span style="color: #94a3b8;">Company:</span> <strong>${companyName}</strong></div>
    <div style="margin: 10px 0;"><span style="color: #94a3b8;">Scan Type:</span> <strong>${scanType.toUpperCase()}</strong></div>
    <div style="margin: 10px 0;"><span style="color: #94a3b8;">Generated:</span> <strong>${new Date().toLocaleString()}</strong></div>
    <div style="margin: 10px 0;"><span style="color: #94a3b8;">Duration:</span> <strong>${duration}s</strong></div>
    <div style="margin-top: 20px;"><span style="color: #94a3b8;">Overall Security Score:</span>
      <div class="score-badge" style="margin-top: 10px;">${securityScore}/100</div>
    </div>
  </div>
</div>

<div class="page">
  <h1>Executive Summary</h1>
  ${aiSummary ? `<div class="ai-summary"><strong>🤖 GovernAI Intelligence Brief</strong><p>${aiSummary}</p></div>` : ''}
  
  <div class="stats-grid">
    <div class="stat-card"><div style="font-size: 14px; color: #64748b;">Security Score</div><div class="stat-value" style="color: ${scoreColor}">${securityScore}/100</div></div>
    <div class="stat-card"><div style="font-size: 14px; color: #64748b;">Critical</div><div class="stat-value" style="color: #ef4444">${severityBreakdown.CRITICAL}</div></div>
    <div class="stat-card"><div style="font-size: 14px; color: #64748b;">High</div><div class="stat-value" style="color: #f59e0b">${severityBreakdown.HIGH}</div></div>
    <div class="stat-card"><div style="font-size: 14px; color: #64748b;">Total Findings</div><div class="stat-value">${vulnerabilityCount}</div></div>
  </div>

  <h1>Scan Details</h1>
  <table>
    <tr><td><strong>Target URL</strong></td><td>${target}</td></tr>
    <tr><td><strong>Scan Type</strong></td><td>${scanType}</td></tr>
    <tr><td><strong>Started</strong></td><td>${new Date(createdAt).toLocaleString()}</td></tr>
    <tr><td><strong>Completed</strong></td><td>${new Date(completedAt).toLocaleString()}</td></tr>
    <tr><td><strong>Duration</strong></td><td>${duration}s</td></tr>
  </table>

  <h1>Detailed Findings</h1>
  <table>
    <thead><tr><th>Vulnerability</th><th>Severity</th><th>Affected URL</th><th>Recommendation</th></tr></thead>
    <tbody>
      ${vulnerabilities.map(v => `<tr>
        <td><strong>${v.title}</strong><br><small style="color: #64748b;">${v.description}</small></td>
        <td><span class="severity-badge severity-${v.severity.toLowerCase()}">${v.severity}</span></td>
        <td><small>${v.affected_url}</small></td>
        <td><small>${v.remediation}</small></td>
      </tr>`).join('')}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>CONFIDENTIAL – For Internal Review Only</strong></p>
    <p>© 2025 GovernAPI. All Rights Reserved.</p>
  </div>
</div>
</body></html>`;
}

export async function generateVulnerabilityReport(scanData: ScanData): Promise<ReportResult> {
  const criticalCount = scanData.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
  const highCount = scanData.vulnerabilities.filter(v => v.severity === 'HIGH').length;
  
  const aiSummary = `Your API security assessment reveals ${scanData.securityScore}/100 security score with ${criticalCount} critical and ${highCount} high-severity vulnerabilities. Immediate action required on input validation and authentication gaps.`;

  const html = generateReportHTML(scanData, aiSummary);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdfUint8Array = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });

  await browser.close();

  const pdfBuffer = Buffer.from(pdfUint8Array);

  return { html, pdfBuffer };
}
