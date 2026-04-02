"use client";

import { Card, Select, Button, message, Spin } from "antd";
import { useState } from "react";

export function PDFReportGenerator() {
  const [selectedReportType, setSelectedReportType] = useState("security");
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_type: selectedReportType }),
      });

      const result = await response.json();

      if (result.success) {
        const reportData = result.report_data;

        // Generate and display PDF using browser's print functionality
        const printWindow = window.open("", "_blank");
        printWindow?.document.write(`
          <html>
            <head>
              <title>GovernAPI ${selectedReportType.toUpperCase()} Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .header { text-align: center; border-bottom: 2px solid #1890ff; padding-bottom: 20px; margin-bottom: 30px; }
                .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
                .metric-box { border: 1px solid #d9d9d9; padding: 15px; text-align: center; border-radius: 6px; }
                .metric-value { font-size: 24px; font-weight: bold; color: #1890ff; margin-bottom: 5px; }
                .metric-label { font-size: 14px; color: #666; }
                .section { margin: 20px 0; }
                .recommendations { background: #f6ffed; border: 1px solid #b7eb8f; padding: 15px; border-radius: 6px; }
                .data-source { font-size: 12px; color: #999; margin-top: 10px; font-style: italic; }
                h3 { color: #1890ff; border-bottom: 1px solid #e8e8e8; padding-bottom: 5px; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>GovernAPI ${selectedReportType.toUpperCase()} Report</h1>
                <p>Generated on ${new Date(reportData.generated_at).toLocaleDateString()}</p>
                <div class="data-source">Report contains real data from your security scans, API discovery, and monitoring systems</div>
              </div>
              
              <div class="metrics">
                <div class="metric-box">
                  <div class="metric-value">${reportData.metrics.total_apis}</div>
                  <div class="metric-label">Total APIs Discovered</div>
                </div>
                <div class="metric-box">
                  <div class="metric-value">${reportData.metrics.compliance_score}%</div>
                  <div class="metric-label">Compliance Score</div>
                </div>
                <div class="metric-box">
                  <div class="metric-value">${reportData.metrics.security_score}/100</div>
                  <div class="metric-label">Security Score</div>
                </div>
                <div class="metric-box">
                  <div class="metric-value">${reportData.metrics.bots_blocked}</div>
                  <div class="metric-label">Bots Blocked</div>
                </div>
              </div>
              
              ${
                reportData.scan_summary
                  ? `
                <div class="section">
                  <h3>Latest Security Assessment</h3>
                  <p><strong>Target:</strong> ${reportData.scan_summary.target}</p>
                  <p><strong>Overall Risk Level:</strong> ${reportData.scan_summary.overall_risk}</p>
                  <p><strong>Total Vulnerabilities:</strong> ${reportData.metrics.total_vulnerabilities}</p>
                  <p><strong>Critical Vulnerabilities:</strong> ${reportData.metrics.critical_vulnerabilities}</p>
                  <p><strong>High Risk Vulnerabilities:</strong> ${reportData.metrics.high_vulnerabilities}</p>
                  <p><strong>OWASP Security Tests:</strong> ${reportData.scan_summary.owasp_findings} performed</p>
                  <p><strong>Scan Date:</strong> ${new Date(reportData.scan_summary.scan_date).toLocaleString()}</p>
                </div>
              `
                  : `
                <div class="section">
                  <h3>Security Assessment Status</h3>
                  <p>No security scan data available. Run a security scan to include detailed vulnerability findings in future reports.</p>
                </div>
              `
              }
              
              <div class="section">
                <h3>Traffic Analysis</h3>
                <p><strong>Total Traffic Analyzed:</strong> ${reportData.metrics.total_traffic} requests</p>
                <p><strong>Bot Detection Rate:</strong> ${reportData.metrics.bot_detection_rate}%</p>
                <p><strong>Automated Threats Blocked:</strong> ${reportData.metrics.bots_blocked}</p>
              </div>
              
              <div class="section recommendations">
                <h3>Security Recommendations</h3>
                <ul>
                  ${reportData.recommendations.map((rec: string) => `<li>${rec}</li>`).join("")}
                </ul>
              </div>
              
              <div class="section">
                <h3>Report Methodology</h3>
                <p>This report is generated from live data collected by your GovernAPI platform including:</p>
                <ul>
                  <li>OWASP API Security Top 10 vulnerability assessments</li>
                  <li>Real-time bot detection and traffic analysis</li>
                  <li>API discovery and inventory management</li>
                  <li>Security header and SSL/TLS configuration analysis</li>
                </ul>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
          printWindow?.print();
          printWindow?.close();
        }, 500);

        message.success("Report generated with real platform data");
      } else {
        message.error("Failed to generate report: " + result.error);
      }
    } catch (error) {
      message.error("Error generating report: " + (error as Error)?.message);
    }
    setLoading(false);
  };

  return (
    <Card title="Generate Reports">
      <div style={{ marginBottom: 16 }}>
        <Select
          value={selectedReportType}
          onChange={setSelectedReportType}
          style={{ width: "100%" }}
        >
          <Select.Option value="security">Security Assessment</Select.Option>
          <Select.Option value="compliance">Compliance Report</Select.Option>
          <Select.Option value="executive">Executive Summary</Select.Option>
        </Select>
      </div>

      <Button
        type="primary"
        onClick={handleGenerateReport}
        loading={loading}
        block
        icon={loading ? <Spin /> : null}
      >
        {loading ? "Generating Report..." : "Generate Report"}
      </Button>

      <div style={{ marginTop: 16, fontSize: "12px", color: "#666" }}>
        Reports contain real data from your security scans, API discovery, bot
        detection, and monitoring systems. Run security scans first for
        comprehensive vulnerability data.
      </div>
    </Card>
  );
}
