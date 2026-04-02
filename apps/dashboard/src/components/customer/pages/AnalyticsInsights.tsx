"use client";
import * as React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Progress,
  DatePicker,
  Space,
  Button,
  Typography,
  Badge,
  Tag,
  Tabs,
} from "antd";
import {
  LineChartOutlined,
  DownloadOutlined,
  BarChartOutlined,
  TrophyOutlined,
  GlobalOutlined,
  AlertOutlined,
  RiseOutlined,
  FallOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface ThreatOverview {
  totalThreats: number;
  blockedAttacks: number;
  severityScore: number;
  trendsUp: boolean;
  changePercentage: number;
}

interface GeographicThreat {
  country: string;
  threatCount: number;
  severity: "low" | "medium" | "high" | "critical";
  percentage: number;
}

interface ThreatType {
  [key: string]: {
    count: number;
    percentage: number;
    trend: "up" | "down" | "stable";
  };
}

interface AttackPattern {
  [key: string]: {
    frequency: number;
    lastSeen: string;
    blocked: number;
    severity: string;
  };
}

interface BotAnalytics {
  totalBots: number;
  maliciousBots: number;
  goodBots: number;
  suspiciousBots: number;
}

interface AnalyticsInsightsProps {
  threatTrends: {
    overview: ThreatOverview;
    geographicThreats: GeographicThreat[];
    threatTypes: ThreatType;
    attackPatterns: AttackPattern;
    botAnalytics: BotAnalytics;
  };
  loading: boolean;
}

export default function AnalyticsInsights({
  threatTrends,
  loading,
}: AnalyticsInsightsProps) {
  const overview = threatTrends?.overview || {
    totalThreats: 0,
    blockedAttacks: 0,
    severityScore: 0,
    trendsUp: false,
    changePercentage: 0,
  };

  const geographicThreats = threatTrends?.geographicThreats || [];
  const threatTypes = threatTrends?.threatTypes || {};
  const attackPatterns = threatTrends?.attackPatterns || {};
  const botAnalytics = threatTrends?.botAnalytics || {
    totalBots: 0,
    maliciousBots: 0,
    goodBots: 0,
    suspiciousBots: 0,
  };

  const handleExport = (format: string) => {
    console.log(`Exporting analytics data in ${format} format...`);
    // Export functionality would be implemented here
  };

  const getSeverityColor = (severity: string) => {
    const colors = {
      low: "#52c41a",
      medium: "#faad14",
      high: "#ff7a45",
      critical: "#ff4d4f",
    };
    return colors[severity as keyof typeof colors] || "#d9d9d9";
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <RiseOutlined style={{ color: "#ff4d4f" }} />;
      case "down":
        return <FallOutlined style={{ color: "#52c41a" }} />;
      default:
        return null;
    }
  };

  const geographicColumns: any[] = [
    {
      title: "Country",
      dataIndex: "country",
      key: "country",
      render: (country: string) => (
        <Space>
          <GlobalOutlined />
          {country}
        </Space>
      ),
    },
    {
      title: "Threat Count",
      dataIndex: "threatCount",
      key: "threatCount",
      render: (count: number) => count.toLocaleString(),
      sorter: (a: GeographicThreat, b: GeographicThreat) =>
        a.threatCount - b.threatCount,
    },
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)}>{severity.toUpperCase()}</Tag>
      ),
      filters: [
        { text: "Low", value: "low" },
        { text: "Medium", value: "medium" },
        { text: "High", value: "high" },
        { text: "Critical", value: "critical" },
      ],
      onFilter: (value: string | number | boolean, record: GeographicThreat) =>
        record.severity === value,
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      key: "percentage",
      render: (percentage: number) => (
        <div>
          <Text>{percentage.toFixed(1)}%</Text>
          <Progress
            percent={percentage}
            showInfo={false}
            strokeColor={getSeverityColor("medium")}
            size="small"
          />
        </div>
      ),
    },
  ];

  const threatTypeData = Object.entries(threatTypes).map(([type, data]) => ({
    key: type,
    type,
    count: (data as any).count || 0,
    percentage: (data as any).percentage || 0,
    trend: (data as any).trend || "stable",
  }));

  const attackPatternData = Object.entries(attackPatterns).map(
    ([pattern, data]) => ({
      key: pattern,
      pattern,
      frequency: (data as any).frequency || 0,
      lastSeen: (data as any).lastSeen || "Unknown",
      blocked: (data as any).blocked || 0,
      severity: (data as any).severity || "low",
    }),
  );

  const tabItems = [
    {
      key: "geographic",
      label: "Geographic Analysis",
      children: (
        <Table
          columns={geographicColumns}
          dataSource={geographicThreats}
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      ),
    },
    {
      key: "threats",
      label: "Threat Types",
      children: (
        <div>
          {threatTypeData.map((item) => (
            <Card key={item.key} size="small" style={{ marginBottom: 8 }}>
              <Space style={{ width: "100%", justifyContent: "space-between" }}>
                <div>
                  <Text strong>{item.type}</Text>
                  <br />
                  <Text type="secondary">
                    {item.count.toLocaleString()} incidents
                  </Text>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div>{item.percentage.toFixed(1)}%</div>
                  {getTrendIcon(item.trend)}
                </div>
              </Space>
            </Card>
          ))}
        </div>
      ),
    },
    {
      key: "patterns",
      label: "Attack Patterns",
      children: (
        <div>
          {attackPatternData.map((item) => (
            <Card key={item.key} size="small" style={{ marginBottom: 8 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>{item.pattern}</Text>
                  <br />
                  <Text type="secondary">Frequency: {item.frequency}</Text>
                </Col>
                <Col span={6}>
                  <Text>Blocked: {item.blocked}</Text>
                </Col>
                <Col span={6}>
                  <Tag color={getSeverityColor(item.severity)}>
                    {item.severity.toUpperCase()}
                  </Tag>
                </Col>
              </Row>
            </Card>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card>
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              <div>
                <Title level={3}>
                  <BarChartOutlined /> Analytics & Insights
                </Title>
                <Text type="secondary">
                  Comprehensive threat analytics and security insights
                </Text>
              </div>
              <Space>
                <RangePicker />
                <Button
                  icon={<DownloadOutlined />}
                  onClick={() => handleExport("pdf")}
                >
                  Export Report
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Threats"
              value={overview.totalThreats}
              prefix={<AlertOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
            <div style={{ marginTop: 8 }}>
              <Badge
                status={overview.trendsUp ? "error" : "success"}
                text={`${overview.changePercentage}% ${overview.trendsUp ? "increase" : "decrease"}`}
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Blocked Attacks"
              value={overview.blockedAttacks}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Severity Score"
              value={overview.severityScore}
              suffix="/100"
              valueStyle={{
                color: overview.severityScore > 70 ? "#ff4d4f" : "#52c41a",
              }}
            />
            <Progress
              percent={overview.severityScore}
              strokeColor={overview.severityScore > 70 ? "#ff4d4f" : "#52c41a"}
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Bot Traffic"
              value={botAnalytics.totalBots}
              prefix={<LineChartOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
            <div style={{ marginTop: 8, fontSize: "12px" }}>
              <Text type="success">Good: {botAnalytics.goodBots}</Text> |{" "}
              <Text type="danger">Malicious: {botAnalytics.maliciousBots}</Text>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Threat Analysis Dashboard">
            <Tabs items={tabItems} />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Bot Analytics" style={{ marginBottom: 16 }}>
            <div style={{ padding: "16px 0" }}>
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text>Good Bots</Text>
                  <Text strong style={{ color: "#52c41a" }}>
                    {botAnalytics.goodBots}
                  </Text>
                </div>
                <Progress
                  percent={
                    (botAnalytics.goodBots / botAnalytics.totalBots) * 100
                  }
                  strokeColor="#52c41a"
                  showInfo={false}
                  size="small"
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text>Malicious Bots</Text>
                  <Text strong style={{ color: "#ff4d4f" }}>
                    {botAnalytics.maliciousBots}
                  </Text>
                </div>
                <Progress
                  percent={
                    (botAnalytics.maliciousBots / botAnalytics.totalBots) * 100
                  }
                  strokeColor="#ff4d4f"
                  showInfo={false}
                  size="small"
                />
              </div>

              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 4,
                  }}
                >
                  <Text>Suspicious Bots</Text>
                  <Text strong style={{ color: "#faad14" }}>
                    {botAnalytics.suspiciousBots}
                  </Text>
                </div>
                <Progress
                  percent={
                    (botAnalytics.suspiciousBots / botAnalytics.totalBots) * 100
                  }
                  strokeColor="#faad14"
                  showInfo={false}
                  size="small"
                />
              </div>
            </div>
          </Card>

          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: "100%" }}>
              <Button
                block
                icon={<DownloadOutlined />}
                onClick={() => handleExport("csv")}
              >
                Export CSV Data
              </Button>
              <Button block icon={<BarChartOutlined />}>
                Generate Custom Report
              </Button>
              <Button block icon={<AlertOutlined />}>
                Configure Alerts
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
