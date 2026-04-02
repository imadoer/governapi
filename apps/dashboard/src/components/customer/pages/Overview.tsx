"use client";
import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Typography,
  Progress,
  Tag,
  Space,
  Table,
  Modal,
  Tooltip,
  Divider,
} from "antd";
import {
  BarChartOutlined,
  LockOutlined,
  BugOutlined,
  ApiOutlined,
  ReloadOutlined,
  SafetyOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface VulnBreakdown {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface ScoreBreakdown {
  baseScan: number;
  vulnPenalty: number;
  coveragePenalty: number;
  stalenessPenalty: number;
  incidentPenalty: number;
  controlBonus: number;
  postureScore: number;
  avgScanScore: number;
}

export default function Overview({
  stats,
  scoreBreakdown,
  vulnerabilities: vulnBreakdown,
  refreshData,
  refreshing,
  company,
  apiKeys = [],
  blockedThreats = [],
  botEvents = [],
  apiEndpoints = [],
  vulnerabilities: vulnerabilitiesArray = [],
  securityScans = [],
  performanceMetrics = {},
}) {
  const [timeRange, setTimeRange] = useState("24h");
  const [breakdownVisible, setBreakdownVisible] = useState(false);

  // Use the new stats from API
  const totalEndpoints = stats?.totalEndpoints || 0;
  const totalThreatsBlocked = stats?.totalThreats || 0;
  const totalScans = stats?.totalScans || 0;
  const totalRequests = stats?.totalRequests || 0;

  // Get both scores from API
  const avgScanScore = stats?.avgSecurityScore || 0;
  const postureScore = stats?.postureScore || 0;

  const getScoreColor = (score) => {
    if (score >= 90) return "#52c41a";
    if (score >= 80) return "#1890ff";
    if (score >= 70) return "#faad14";
    if (score >= 60) return "#fa8c16";
    return "#f5222d";
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Fair";
    if (score >= 60) return "Poor";
    return "Critical";
  };

  const getRiskLevel = (score) => {
    if (score >= 80) return { text: "Low Risk", color: "success" };
    if (score >= 60) return { text: "Medium Risk", color: "warning" };
    if (score >= 40) return { text: "High Risk", color: "error" };
    return { text: "Critical Risk", color: "error" };
  };

  const breakdownData: ScoreBreakdown = (scoreBreakdown || {
    baseScan: avgScanScore,
    vulnPenalty: 0,
    coveragePenalty: 0,
    stalenessPenalty: 0,
    incidentPenalty: 0,
    controlBonus: 0,
    postureScore: avgScanScore,
    avgScanScore: avgScanScore,
  }) as ScoreBreakdown;

  const vulnData: VulnBreakdown = (vulnBreakdown && typeof vulnBreakdown === 'object' && 'total' in vulnBreakdown 
    ? vulnBreakdown 
    : {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  }) as VulnBreakdown;

  const riskLevel = getRiskLevel(postureScore);

  return (
    <div style={{ padding: "24px" }}>
      {/* Header with Refresh */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Security Overview
          </Title>
          <Text type="secondary">
            Real-time security metrics and posture analysis
          </Text>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<ReloadOutlined spin={refreshing} />}
            onClick={refreshData}
            loading={refreshing}
          >
            Refresh Data
          </Button>
        </Col>
      </Row>

      {/* Dual Score Display */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        {/* Average Scan Score */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: 12,
            }}
          >
            <div style={{ textAlign: "center", color: "white" }}>
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <SafetyOutlined style={{ fontSize: 24 }} />
                  <Title level={4} style={{ margin: 0, color: "white" }}>
                    Average Scan Score
                  </Title>
                  <Tooltip title="Simple average of all security scan scores">
                    <InfoCircleOutlined style={{ fontSize: 16, cursor: "pointer" }} />
                  </Tooltip>
                </div>
                <div style={{ fontSize: 64, fontWeight: "bold", lineHeight: 1 }}>
                  {avgScanScore}
                </div>
                <Progress
                  percent={avgScanScore}
                  strokeColor={getScoreColor(avgScanScore)}
                  trailColor="rgba(255,255,255,0.3)"
                  showInfo={false}
                  style={{ marginTop: 16 }}
                />
                <Tag
                  color={getScoreColor(avgScanScore)}
                  style={{ fontSize: 14, padding: "4px 16px", marginTop: 8 }}
                >
                  {getScoreLabel(avgScanScore)}
                </Tag>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12 }}>
                  Based on {totalScans} security scans
                </Text>
              </Space>
            </div>
          </Card>
        </Col>

        {/* Security Posture Score */}
        <Col xs={24} md={12}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
              borderRadius: 12,
            }}
          >
            <div style={{ textAlign: "center", color: "white" }}>
              <Space direction="vertical" size="small" style={{ width: "100%" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <LockOutlined style={{ fontSize: 24 }} />
                  <Title level={4} style={{ margin: 0, color: "white" }}>
                    Security Posture Score
                  </Title>
                  <Tooltip title="Holistic security score including vulnerabilities, coverage, and threats">
                    <InfoCircleOutlined 
                      style={{ fontSize: 16, cursor: "pointer" }} 
                      onClick={() => setBreakdownVisible(true)}
                    />
                  </Tooltip>
                </div>
                <div style={{ fontSize: 64, fontWeight: "bold", lineHeight: 1 }}>
                  {postureScore}
                </div>
                <Progress
                  percent={postureScore}
                  strokeColor={getScoreColor(postureScore)}
                  trailColor="rgba(255,255,255,0.3)"
                  showInfo={false}
                  style={{ marginTop: 16 }}
                />
                <Tag
                  color={riskLevel.color}
                  style={{ fontSize: 14, padding: "4px 16px", marginTop: 8 }}
                >
                  {riskLevel.text}
                </Tag>
                <Button
                  type="link"
                  style={{ color: "white", textDecoration: "underline", padding: 0 }}
                  onClick={() => setBreakdownVisible(true)}
                >
                  View Breakdown
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <ApiOutlined style={{ fontSize: 32, color: "#1890ff" }} />
              <Title level={2} style={{ margin: 0 }}>
                {totalEndpoints}
              </Title>
              <Text type="secondary">Protected Endpoints</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <SafetyOutlined style={{ fontSize: 32, color: "#52c41a" }} />
              <Title level={2} style={{ margin: 0 }}>
                {totalScans}
              </Title>
              <Text type="secondary">Security Scans</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <LockOutlined style={{ fontSize: 32, color: "#fa8c16" }} />
              <Title level={2} style={{ margin: 0 }}>
                {totalThreatsBlocked}
              </Title>
              <Text type="secondary">Threats Blocked</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <BugOutlined style={{ fontSize: 32, color: "#f5222d" }} />
              <Title level={2} style={{ margin: 0 }}>
                {Number(vulnData.total)}
              </Title>
              <Text type="secondary">Vulnerabilities</Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Vulnerability Breakdown */}
      {Number(vulnData.total) > 0 && (
        <Card title="Vulnerability Distribution" style={{ marginBottom: 24 }}>
          <Row gutter={16}>
            <Col span={6}>
              <Space direction="vertical" align="center" style={{ width: "100%" }}>
                <Title level={3} style={{ color: "#f5222d", margin: 0 }}>
                  {Number(vulnData.critical)}
                </Title>
                <Text type="secondary">Critical</Text>
              </Space>
            </Col>
            <Col span={6}>
              <Space direction="vertical" align="center" style={{ width: "100%" }}>
                <Title level={3} style={{ color: "#fa8c16", margin: 0 }}>
                  {Number(vulnData.high)}
                </Title>
                <Text type="secondary">High</Text>
              </Space>
            </Col>
            <Col span={6}>
              <Space direction="vertical" align="center" style={{ width: "100%" }}>
                <Title level={3} style={{ color: "#faad14", margin: 0 }}>
                  {Number(vulnData.medium)}
                </Title>
                <Text type="secondary">Medium</Text>
              </Space>
            </Col>
            <Col span={6}>
              <Space direction="vertical" align="center" style={{ width: "100%" }}>
                <Title level={3} style={{ color: "#52c41a", margin: 0 }}>
                  {Number(vulnData.low)}
                </Title>
                <Text type="secondary">Low</Text>
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* Score Breakdown Modal */}
      <Modal
        title="Security Posture Score Breakdown"
        open={breakdownVisible}
        onCancel={() => setBreakdownVisible(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setBreakdownVisible(false)}>
            Close
          </Button>,
        ]}
        width={600}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Text strong>Your Security Posture Score: </Text>
            <Text style={{ fontSize: 24, fontWeight: "bold", color: getScoreColor(postureScore) }}>
              {postureScore}
            </Text>
          </div>

          <Divider />

          <div>
            <Title level={5}>Score Calculation</Title>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Base Scan Score (time-weighted)</Text>
                <Text strong style={{ color: "#52c41a" }}>+{breakdownData.baseScan}</Text>
              </div>
              <Progress percent={breakdownData.baseScan} strokeColor="#52c41a" showInfo={false} />

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <Text>Vulnerability Penalty</Text>
                <Text strong style={{ color: "#f5222d" }}>-{breakdownData.vulnPenalty}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {Number(vulnData.critical)} critical (6pt ea), {Number(vulnData.high)} high (3pt ea), {Number(vulnData.medium)} medium (1pt ea)
              </Text>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <Text>Coverage Penalty</Text>
                <Text strong style={{ color: "#fa8c16" }}>-{breakdownData.coveragePenalty}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Based on API endpoint monitoring coverage
              </Text>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <Text>Staleness Penalty</Text>
                <Text strong style={{ color: "#fa8c16" }}>-{breakdownData.stalenessPenalty}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Penalty for infrequent security scans
              </Text>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <Text>Incident Penalty</Text>
                <Text strong style={{ color: "#f5222d" }}>-{breakdownData.incidentPenalty}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Recent critical security incidents
              </Text>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                <Text>Control Bonus</Text>
                <Text strong style={{ color: "#52c41a" }}>+{breakdownData.controlBonus}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Credit for active security controls and protections
              </Text>
            </Space>
          </div>

          <Divider />

          <div style={{ background: "#f0f2f5", padding: 16, borderRadius: 8 }}>
            <Text strong>Final Score: </Text>
            <Text style={{ fontSize: 20, fontWeight: "bold", color: getScoreColor(postureScore) }}>
              {postureScore} / 100
            </Text>
            <br />
            <Tag color={riskLevel.color} style={{ marginTop: 8 }}>
              {riskLevel.text}
            </Tag>
          </div>
        </Space>
      </Modal>
    </div>
  );
}
