import { NextRequest, NextResponse } from 'next/server';
import { database } from '../../../../../infrastructure/database';
import { assessCompliance } from '../../../../../lib/compliance-mapper';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
    const authHeader = request.headers.get('authorization');

    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID required' },
        { status: 401 }
      );
    }

    // Fetch all security data in parallel
    const [metricsRow, vulns, threats, scans, complianceData] = await Promise.all([
      // Overall security score
      database.queryOne(
        `SELECT
           COALESCE(AVG(security_score), 0) as avg_score,
           COUNT(*) as total_scans
         FROM security_scans
         WHERE tenant_id = $1 AND status = 'completed'`,
        [tenantId]
      ),

      // Vulnerabilities by severity
      database.queryMany(
        `SELECT severity, COUNT(*) as count,
           string_agg(DISTINCT endpoint, ', ' ORDER BY endpoint) as endpoints
         FROM vulnerabilities
         WHERE tenant_id = $1 AND status = 'open'
         GROUP BY severity
         ORDER BY CASE severity
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
           ELSE 5 END`,
        [tenantId]
      ),

      // Recent threats
      database.queryMany(
        `SELECT event_type as threat_type,
           CASE WHEN risk_score >= 80 THEN 'critical'
                WHEN risk_score >= 60 THEN 'high'
                WHEN risk_score >= 40 THEN 'medium'
                ELSE 'low' END as severity,
           COUNT(*) as count
         FROM threat_events_enhanced
         WHERE tenant_id = $1
         AND detected_at > NOW() - INTERVAL '30 days'
         GROUP BY event_type, severity
         ORDER BY count DESC
         LIMIT 10`,
        [tenantId]
      ),

      // Recent scans with results
      database.queryMany(
        `SELECT scan_type, status, security_score, target as target_url, created_at
         FROM security_scans
         WHERE tenant_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [tenantId]
      ),

      // Compliance data (OWASP categories)
      database.queryMany(
        `SELECT DISTINCT owasp_category, COUNT(*) as count
         FROM vulnerabilities
         WHERE tenant_id = $1 AND status = 'open' AND owasp_category IS NOT NULL
         GROUP BY owasp_category
         ORDER BY count DESC`,
        [tenantId]
      ),
    ]);

    // Build full compliance assessment with endpoint URLs
    const vulnSummariesForCompliance = await database.queryMany(
      `SELECT vulnerability_type as type, severity, title, COUNT(*) as count,
         array_agg(DISTINCT affected_url) FILTER (WHERE affected_url IS NOT NULL) as affected_urls
       FROM vulnerabilities
       WHERE tenant_id = $1 AND status = 'open'
       GROUP BY vulnerability_type, severity, title
       ORDER BY count DESC`,
      [tenantId]
    );
    const recentScanCount = await database.queryOne(
      `SELECT COUNT(*) as count FROM security_scans WHERE tenant_id = $1 AND status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'`,
      [tenantId]
    );
    const complianceFrameworks = assessCompliance(
      vulnSummariesForCompliance.map((v: any) => ({
        type: v.type, severity: v.severity, title: v.title,
        count: parseInt(v.count), affectedUrls: v.affected_urls || [],
      })),
      parseInt(recentScanCount?.count || '0') > 0,
    );

    const securityScore = Math.round(Number(metricsRow?.avg_score) || 0);
    const totalScans = Number(metricsRow?.total_scans) || 0;

    const vulnCounts = { critical: 0, high: 0, medium: 0, low: 0 };
    const vulnList: { severity: string; count: number; endpoints: string }[] = [];
    for (const v of (vulns || [])) {
      const sev = (v.severity || '').toLowerCase();
      if (sev in vulnCounts) vulnCounts[sev as keyof typeof vulnCounts] = Number(v.count);
      vulnList.push({ severity: sev, count: Number(v.count), endpoints: v.endpoints || '' });
    }
    const totalVulns = vulnCounts.critical + vulnCounts.high + vulnCounts.medium + vulnCounts.low;

    // Determine compliance status
    const hasCompliance = (complianceData || []).length > 0;
    const complianceScore = totalVulns === 0 ? 100 :
      Math.max(0, 100 - (vulnCounts.critical * 25) - (vulnCounts.high * 10) - (vulnCounts.medium * 3) - (vulnCounts.low * 1));

    // Generate PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // --- Header ---
    doc.setFontSize(24);
    doc.setTextColor(20, 60, 120);
    doc.text('GovernAPI Security Report', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, margin, y);
    y += 3;
    doc.text(`Tenant: ${tenantId}`, margin, y);
    y += 8;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 12;

    // --- Security Score with Letter Grade ---
    // Letter grade calculation
    const gradeInfo = securityScore >= 90 ? { letter: 'A', rgb: [16, 185, 129] }
      : securityScore >= 80 ? { letter: 'B', rgb: [45, 212, 191] }
      : securityScore >= 70 ? { letter: 'C', rgb: [234, 179, 8] }
      : securityScore >= 60 ? { letter: 'D', rgb: [249, 115, 22] }
      : { letter: 'F', rgb: [239, 68, 68] };

    doc.setFontSize(16);
    doc.setTextColor(20, 60, 120);
    doc.text('Security Score', margin, y);
    y += 10;

    // Letter grade
    doc.setFontSize(42);
    doc.setTextColor(gradeInfo.rgb[0], gradeInfo.rgb[1], gradeInfo.rgb[2]);
    doc.text(gradeInfo.letter, margin + 5, y + 8);

    // Numeric score
    const scoreColor = securityScore >= 70 ? [34, 197, 94] : securityScore >= 40 ? [245, 158, 11] : [239, 68, 68];
    doc.setFontSize(28);
    doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.text(`${securityScore}`, margin + 25, y + 5);
    doc.setFontSize(14);
    doc.text('/ 100', margin + 48, y + 5);

    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Based on ${totalScans} completed scan${totalScans !== 1 ? 's' : ''}`, margin + 80, y);
    doc.text(`${totalVulns} open vulnerabilit${totalVulns !== 1 ? 'ies' : 'y'} found`, margin + 80, y + 6);
    y += 20;

    // --- Vulnerability Summary ---
    doc.setFontSize(16);
    doc.setTextColor(20, 60, 120);
    doc.text('Vulnerability Summary', margin, y);
    y += 8;

    // Summary boxes
    const boxWidth = (pageWidth - 2 * margin - 15) / 4;
    const severities = [
      { label: 'Critical', count: vulnCounts.critical, color: [220, 38, 38] },
      { label: 'High', count: vulnCounts.high, color: [245, 158, 11] },
      { label: 'Medium', count: vulnCounts.medium, color: [59, 130, 246] },
      { label: 'Low', count: vulnCounts.low, color: [34, 197, 94] },
    ];

    severities.forEach((sev, i) => {
      const x = margin + i * (boxWidth + 5);
      doc.setFillColor(sev.color[0], sev.color[1], sev.color[2]);
      doc.roundedRect(x, y, boxWidth, 22, 2, 2, 'F');
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(`${sev.count}`, x + boxWidth / 2, y + 11, { align: 'center' });
      doc.setFontSize(8);
      doc.text(sev.label, x + boxWidth / 2, y + 18, { align: 'center' });
    });
    y += 30;

    // Vulnerability detail table
    if (vulnList.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [['Severity', 'Count', 'Affected Endpoints']],
        body: vulnList.map(v => [
          v.severity.charAt(0).toUpperCase() + v.severity.slice(1),
          v.count.toString(),
          v.endpoints.length > 80 ? v.endpoints.substring(0, 77) + '...' : v.endpoints,
        ]),
        headStyles: { fillColor: [20, 60, 120], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 15, halign: 'center' },
          2: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    } else {
      doc.setFontSize(10);
      doc.setTextColor(34, 197, 94);
      doc.text('No open vulnerabilities found.', margin, y);
      y += 10;
    }

    // --- Compliance Status ---
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFontSize(16);
    doc.setTextColor(20, 60, 120);
    doc.text('Compliance Status', margin, y);
    y += 10;

    doc.setFontSize(11);
    const compStatusColor = complianceScore >= 80 ? [34, 197, 94] : complianceScore >= 50 ? [245, 158, 11] : [239, 68, 68];
    doc.setTextColor(compStatusColor[0], compStatusColor[1], compStatusColor[2]);
    doc.text(`Compliance Score: ${complianceScore}%`, margin, y);
    y += 10;

    // Framework-level compliance findings with endpoint URLs
    for (const fw of complianceFrameworks) {
      if (y > 240) { doc.addPage(); y = 20; }
      const failingReqs = fw.requirements.filter(r => r.status === 'fail');
      if (failingReqs.length === 0) continue;

      doc.setFontSize(11);
      doc.setTextColor(20, 60, 120);
      doc.text(`${fw.shortName} — ${fw.score}% (${fw.failing} failing)`, margin, y);
      y += 6;

      for (const req of failingReqs) {
        if (y > 265) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setTextColor(220, 38, 38);
        doc.text(`FAIL`, margin + 2, y);
        doc.setTextColor(60, 60, 60);
        doc.text(`${req.id} ${req.name}`, margin + 16, y);
        y += 5;

        // Evidence line with endpoint URLs
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const evidenceLines = doc.splitTextToSize(req.evidence, pageWidth - 2 * margin - 6);
        for (const line of evidenceLines) {
          if (y > 270) { doc.addPage(); y = 20; }
          doc.text(line, margin + 6, y);
          y += 4;
        }
        y += 2;
      }
      y += 4;
    }

    if (complianceFrameworks.every(fw => fw.failing === 0)) {
      doc.setFontSize(9);
      doc.setTextColor(34, 197, 94);
      doc.text('All compliance framework checks are passing.', margin, y);
      y += 6;
    }
    y += 5;

    // --- Recent Scans ---
    if (y > 220) { doc.addPage(); y = 20; }

    if (scans && scans.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(20, 60, 120);
      doc.text('Recent Scans', margin, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Type', 'Target', 'Score', 'Status', 'Date']],
        body: scans.map((s: any) => [
          s.scan_type || 'N/A',
          (s.target_url || '').length > 40 ? (s.target_url || '').substring(0, 37) + '...' : (s.target_url || 'N/A'),
          s.security_score != null ? `${s.security_score}` : '-',
          s.status || 'N/A',
          s.created_at ? new Date(s.created_at).toLocaleDateString() : 'N/A',
        ]),
        headStyles: { fillColor: [20, 60, 120], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- Threats ---
    if (threats && threats.length > 0) {
      if (y > 220) { doc.addPage(); y = 20; }

      doc.setFontSize(16);
      doc.setTextColor(20, 60, 120);
      doc.text('Threat Activity (Last 30 Days)', margin, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [['Threat Type', 'Severity', 'Occurrences']],
        body: threats.map((t: any) => [
          t.threat_type || 'Unknown',
          t.severity || 'N/A',
          t.count.toString(),
        ]),
        headStyles: { fillColor: [20, 60, 120], fontSize: 9 },
        bodyStyles: { fontSize: 8 },
        margin: { left: margin, right: margin },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    // --- Disclaimer ---
    if (y > 250) { doc.addPage(); y = 20; }

    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    const disclaimer = 'This report reflects issues identified in the provided configuration and does not constitute a security audit or guarantee.';
    const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 2 * margin);
    doc.text(disclaimerLines, margin, y);
    y += disclaimerLines.length * 4 + 4;

    doc.setFontSize(7);
    doc.text(`GovernAPI - ${new Date().getFullYear()}. All rights reserved.`, margin, y);

    // Output PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="governapi-security-report-${new Date().toISOString().split('T')[0]}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error generating security report PDF:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate security report PDF' },
      { status: 500 }
    );
  }
}
