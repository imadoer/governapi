"use client";

import { Card, Table, Badge, Typography, Progress, Divider } from "antd";

const { Title, Paragraph } = Typography;

interface ScanResult {
  target: string;
  timestamp: string;
  overall_risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  vulnerabilities: Array<{
    category: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    finding: string;
    description: string;
    recommendation: string;
  }>;
  owasp_findings: Array<{
    owasp_category: string;
    vulnerable: boolean;
    details: string;
  }>;
}

interface SecurityScanResultsProps {
  results: ScanResult | null;
}

export function SecurityScanResults({ results }: SecurityScanResultsProps) {
  if (!results) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "CRITICAL":
        return "#ff4d4f";
      case "HIGH":
        return "#fa8c16";
      case "MEDIUM":
        return "#faad14";
      case "LOW":
        return "#52c41a";
      default:
        return "#d9d9d9";
    }
  };

  const getRiskBadge = (severity: string) => {
    const colors = {
      CRITICAL: "red",
      HIGH: "orange",
      MEDIUM: "gold",
      LOW: "green",
    };
    return (
      <Badge
        color={colors[severity as keyof typeof colors] || "default"}
        text={severity}
      />
    );
  };

  const vulnerabilityColumns = [
    { title: "Category", dataIndex: "category", key: "category" },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (severity: string) => getRiskBadge(severity),
    },
    { title: "Finding", dataIndex: "finding", key: "finding" },
    {
      title: "Recommendation",
      dataIndex: "recommendation",
      key: "recommendation",
    },
  ];

  const owaspColumns = [
    {
      title: "OWASP Category",
      dataIndex: "owasp_category",
      key: "owasp_category",
    },
    {
      title: "Status",
      dataIndex: "vulnerable",
      key: "vulnerable",
      render: (vulnerable: boolean) =>
        vulnerable ? (
          <Badge status="error" text="Vulnerable" />
        ) : (
          <Badge status="success" text="Secure" />
        ),
    },
    { title: "Details", dataIndex: "details", key: "details" },
  ];

  return (
    <div style={{ marginTop: 24 }}>
      <Card>
        <Title level={3}>Security Scan Results</Title>
        <Paragraph>
          <strong>Target:</strong> {results.target}
        </Paragraph>
        <Paragraph>
          <strong>Scan Time:</strong>{" "}
          {new Date(results.timestamp).toLocaleString()}
        </Paragraph>

        <div style={{ marginBottom: 24 }}>
          <Title level={4}>Overall Risk Assessment</Title>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <Badge
              color={getRiskColor(results.overall_risk)}
              text={`${results.overall_risk} RISK`}
            />
            <span>{results.vulnerabilities.length} vulnerabilities found</span>
          </div>
        </div>

        <Divider />

        <Title level={4}>
          Vulnerabilities ({results.vulnerabilities.length})
        </Title>
        <Table
          dataSource={results.vulnerabilities}
          columns={vulnerabilityColumns}
          rowKey={(record, index) => index?.toString() || "0"}
          pagination={false}
          size="small"
        />

        <Divider />

        <Title level={4}>OWASP API Security Top 10 Analysis</Title>
        <Table
          dataSource={results.owasp_findings}
          columns={owaspColumns}
          rowKey={(record, index) => index?.toString() || "0"}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
}
