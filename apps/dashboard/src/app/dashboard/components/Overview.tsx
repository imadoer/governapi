"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Progress,
  Table,
  Tag,
  Space,
  Timeline,
  Divider,
  Button,
  Statistic,
  Badge,
  Alert,
  Tooltip,
  Empty,
} from "antd";
import { Typography } from "antd";
import {
  RiseOutlined,
  FallOutlined,
  FireOutlined,
  BugOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  GlobalOutlined,
  DashboardOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { ForecastWidget } from "../../../components/shared/ForecastWidget";
import { IncidentBanner } from "../../../components/shared/IncidentBanner";

const { Text, Title } = Typography;

interface OverviewProps {
  apiInventory: any;
  complianceScores: any;
  policyViolations: any;
  costAnalytics: any;
  recentActivity: any;
  company?: any;
}

export function OverviewTab({
  apiInventory,
  complianceScores,
  policyViolations,
  costAnalytics,
  recentActivity,
  company,
}: OverviewProps) {
  // ========== STATE ==========
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchOverviewData();
  }, [company]);

  const fetchOverviewData = async () => {
    try {
      setRefreshing(true);
      const tenantId = company?.id || "1";

      // Fetch security metrics
      const metricsRes = await fetch("/api/customer/security-metrics", {
        headers: { "x-tenant-id": tenantId },
      });
      const metricsData = await metricsRes.json();
      if (metricsData.success) {
        setSecurityMetrics(metricsData.metrics);
      }

      // Fetch forecast data
      const forecastRes = await fetch("/api/forecast/security", {
        headers: { "x-tenant-id": tenantId },
      });
      const forecastResData = await forecastRes.json();
      if (forecastResData.success) {
        setForecastData(forecastResData.forecast);
      }

      // Fetch system health
      const healthRes = await fetch("/api/system/health", {
        headers: { "x-tenant-id": tenantId },
      });
      const healthData = await healthRes.json();
      if (healthData.success) {
        setSystemHealth(healthData.health);
      }

      // Fetch critical alerts
      const alertsRes = await fetch("/api/dashboard/critical-alerts", {
        headers: { "x-tenant-id": tenantId },
      });
      const alertsData = await alertsRes.json();
      if (alertsData.success) {
        setCriticalAlerts(alertsData.alerts || []);
      }

      // Check for active incidents
      const incidentsRes = await fetch("/api/incidents?active=true", {
        headers: { "x-tenant-id": tenantId },
      });
      const incidentsData = await incidentsRes.json();
      if (incidentsData.success && incidentsData.incidents.length > 0) {
        setActiveIncident(incidentsData.incidents[0]);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ========== UTILITY FUNCTIONS ==========
  const getScoreColor = (score: number) => {
    if (score >= 90) return "#52c41a";
    if (score >= 80) return "#1890ff";
    if (score >= 70) return "#faad14";
    return "#ff4d4f";
  };

  // ========== RENDER ==========
  return (
    <div style={{ padding: "24px" }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
              <DashboardOutlined style={{ color: "#1890ff" }} />
              Mission Control
            </Title>
            <Text type="secondary">Executive overview of your security and compliance posture</Text>
          </div>
          <Button icon={<ReloadOutlined />} loading={refreshing} onClick={fetchOverviewData}>
            Refresh Dashboard
          </Button>
        </div>
      </div>

      {/* INCIDENT BANNER */}
      {activeIncident && (
        <IncidentBanner
          incident={activeIncident}
          onResolve={() => setActiveIncident(null)}
          onViewDetails={() => window.location.href = "/dashboard?tab=threat-intelligence"}
        />
      )}

      {/* CRITICAL ALERTS */}
      {criticalAlerts.length > 0 && (
        <Alert
          message="Critical Alerts Requiring Attention"
          description={
            <Space direction="vertical" style={{ width: "100%" }}>
              {criticalAlerts.slice(0, 3).map((alert, idx) => (
                <div key={idx}>
                  <Tag color="red">URGENT</Tag>
                  <Text>{alert.message}</Text>
                </div>
              ))}
            </Space>
          }
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 24 }}
          closable
        />
      )}

      {/* TOP METRICS ROW */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Security Score */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} align="center">
              <SafetyCertificateOutlined style={{ fontSize: 32, color: getScoreColor(securityMetrics?.securityScore || 0) }} />
              <Statistic
                title="Security Score"
                value={securityMetrics?.securityScore || 0}
                suffix="/100"
                valueStyle={{ color: getScoreColor(securityMetrics?.securityScore || 0), textAlign: "center" }}
              />
              {securityMetrics?.securityScoreTrend !== undefined && (
                <Tag color={securityMetrics.securityScoreTrend > 0 ? "success" : "error"}>
                  {securityMetrics.securityScoreTrend > 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(securityMetrics.securityScoreTrend)}%
                </Tag>
              )}
            </Space>
          </Card>
        </Col>

        {/* Threats Blocked Today */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} align="center">
              <FireOutlined style={{ fontSize: 32, color: "#ff4d4f" }} />
              <Statistic
                title="Threats Blocked Today"
                value={securityMetrics?.threatsBlockedToday || 0}
                valueStyle={{ color: "#ff4d4f", textAlign: "center" }}
              />
              <Button type="link" size="small" href="/dashboard?tab=threat-intelligence">
                View Details →
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Open Vulnerabilities */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} align="center">
              <BugOutlined style={{ fontSize: 32, color: "#fa8c16" }} />
              <Statistic
                title="Open Vulnerabilities"
                value={securityMetrics?.openVulnerabilities || 0}
                valueStyle={{ color: "#fa8c16", textAlign: "center" }}
              />
              <Badge count={securityMetrics?.criticalVulns || 0} showZero style={{ backgroundColor: "#ff4d4f" }}>
                <Tag>Critical</Tag>
              </Badge>
            </Space>
          </Card>
        </Col>

        {/* Compliance Score */}
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} align="center">
              <SafetyCertificateOutlined
                style={{ fontSize: 32, color: getScoreColor(securityMetrics?.complianceScore || 0) }}
              />
              <Statistic
                title="Compliance Score"
                value={securityMetrics?.complianceScore || 0}
                suffix="%"
                valueStyle={{ color: getScoreColor(securityMetrics?.complianceScore || 0), textAlign: "center" }}
              />
              <Button type="link" size="small" href="/dashboard?tab=compliance-hub">
                View Compliance →
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* GOVERNIQ FORECASTING ROW */}
      {forecastData && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: "#faad14" }} />
                  <span>GovernIQ Predictive Forecasts</span>
                  <Badge status="processing" text="AI-Powered" />
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <ForecastWidget
                    title="Security Score (7 days)"
                    currentValue={forecastData.securityScore.current}
                    predictedValue={forecastData.securityScore.predicted}
                    confidence={forecastData.securityScore.confidence}
                    trend={forecastData.securityScore.trend}
                  />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <ForecastWidget
                    title="Vulnerabilities (7 days)"
                    currentValue={forecastData.vulnerabilities.current}
                    predictedValue={forecastData.vulnerabilities.predicted}
                    confidence={forecastData.vulnerabilities.confidence}
                    trend={forecastData.vulnerabilities.trend}
                  />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Card size="small">
                    <Space direction="vertical" style={{ width: "100%" }}>
                      <Text strong>Cost Forecast (This Month)</Text>
                      <Statistic
                        value={costAnalytics?.totalMonthly || 0}
                        prefix="$"
                        valueStyle={{ fontSize: 20 }}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Projected: ${((costAnalytics?.totalMonthly || 0) * 1.12).toFixed(0)}
                      </Text>
                      <Tag color="green">12% increase projected</Tag>
                    </Space>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* SYSTEM HEALTH ROW */}
      {systemHealth && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24}>
            <Card title="System Health Status">
              <Row gutter={[16, 16]}>
                <Col xs={12} sm={6}>
                  <Space direction="vertical" align="center" style={{ width: "100%" }}>
                    <Badge status={systemHealth.scanner ? "success" : "error"} />
                    <Text>Security Scanner</Text>
                    <Tag color={systemHealth.scanner ? "green" : "red"}>
                      {systemHealth.scanner ? "OPERATIONAL" : "DOWN"}
                    </Tag>
                  </Space>
                </Col>
                <Col xs={12} sm={6}>
                  <Space direction="vertical" align="center" style={{ width: "100%" }}>
                    <Badge status={systemHealth.threatIntel ? "success" : "error"} />
                    <Text>Threat Intelligence</Text>
                    <Tag color={systemHealth.threatIntel ? "green" : "red"}>
                      {systemHealth.threatIntel ? "OPERATIONAL" : "DOWN"}
                    </Tag>
                  </Space>
                </Col>
                <Col xs={12} sm={6}>
                  <Space direction="vertical" align="center" style={{ width: "100%" }}>
                    <Badge status={systemHealth.compliance ? "success" : "warning"} />
                    <Text>Compliance Engine</Text>
                    <Tag color={systemHealth.compliance ? "green" : "orange"}>
                      {systemHealth.compliance ? "OPERATIONAL" : "DEGRADED"}
                    </Tag>
                  </Space>
                </Col>
                <Col xs={12} sm={6}>
                  <Space direction="vertical" align="center" style={{ width: "100%" }}>
                    <Badge status={systemHealth.botProtection ? "success" : "error"} />
                    <Text>Bot Protection</Text>
                    <Tag color={systemHealth.botProtection ? "green" : "red"}>
                      {systemHealth.botProtection ? "OPERATIONAL" : "DOWN"}
                    </Tag>
                  </Space>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* QUICK ACTIONS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Quick Actions">
            <Space size="large" wrap>
              <Button type="primary" icon={<FireOutlined />} href="/dashboard?tab=security-center">
                Start Security Scan
              </Button>
              <Button icon={<BugOutlined />} href="/dashboard?tab=vulnerability-scanner">
                View Vulnerabilities
              </Button>
              <Button icon={<GlobalOutlined />} href="/dashboard?tab=threat-intelligence">
                View Live Threats
              </Button>
              <Button icon={<SafetyCertificateOutlined />} href="/dashboard?tab=compliance-hub">
                Check Compliance
              </Button>
              <Button icon={<ApiOutlined />} href="/dashboard?tab=api-management">
                Manage APIs
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* ORIGINAL CONTENT (Enhanced) */}
      <Row gutter={[16, 16]}>
        {/* API Inventory Summary */}
        <Col xs={24} lg={12}>
          <Card title="API Inventory" extra={<a href="/dashboard?tab=api-management">View All</a>}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div style={{ textAlign: "center" }}>
                  <Progress
                    type="circle"
                    percent={Math.round((apiInventory.classified / apiInventory.total) * 100)}
                    width={120}
                  />
                  <div style={{ marginTop: 8 }}>
                    <Text>Classification Status</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text>Critical APIs:</Text>
                    <Text strong>{apiInventory.critical}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text>Internal APIs:</Text>
                    <Text strong>{apiInventory.internal}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text>External APIs:</Text>
                    <Text strong>{apiInventory.external}</Text>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text>Unclassified:</Text>
                    <Text strong type="warning">
                      {apiInventory.unclassified}
                    </Text>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Compliance Status */}
        <Col xs={24} lg={12}>
          <Card title="Compliance Status" extra={<a href="/dashboard?tab=compliance-hub">Configure</a>}>
            <Space direction="vertical" style={{ width: "100%" }} size="middle">
              {complianceScores.map((framework: any, index: number) => (
                <div key={index}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <Text strong>{framework.framework}</Text>
                    <Space>
                      <Text
                        type={
                          framework.trend === "up" ? "success" : framework.trend === "down" ? "danger" : "secondary"
                        }
                      >
                        {framework.trend === "up" ? (
                          <RiseOutlined />
                        ) : framework.trend === "down" ? (
                          <FallOutlined />
                        ) : (
                          "-"
                        )}
                        {Math.abs(framework.change)}%
                      </Text>
                      <Text strong>{framework.score}%</Text>
                    </Space>
                  </div>
                  <Progress
                    percent={framework.score}
                    strokeColor={framework.score >= 80 ? "#52c41a" : "#faad14"}
                    showInfo={false}
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Policy Violations */}
        <Col xs={24}>
          <Card
            title="Active Policy Violations"
            extra={
              <Space>
                <Button size="small" href="/dashboard?tab=custom-rules">
                  View All
                </Button>
              </Space>
            }
          >
            <Table
              dataSource={policyViolations}
              pagination={false}
              size="small"
              columns={[
                { title: "ID", dataIndex: "id", key: "id", width: 100 },
                { title: "API", dataIndex: "api", key: "api" },
                { title: "Policy", dataIndex: "policy", key: "policy" },
                {
                  title: "Severity",
                  dataIndex: "severity",
                  key: "severity",
                  render: (severity: string) => (
                    <Tag
                      color={
                        severity === "critical" ? "error" : severity === "high" ? "warning" : "default"
                      }
                    >
                      {severity.toUpperCase()}
                    </Tag>
                  ),
                },
                { title: "Age", dataIndex: "age", key: "age" },
                {
                  title: "Action",
                  key: "action",
                  render: () => (
                    <Space>
                      <a>Review</a>
                      <a>Exempt</a>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Cost Analytics */}
        <Col xs={24} lg={12}>
          <Card title="API Cost Analytics" extra={<Text type="secondary">This Month</Text>}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Title level={4}>${costAnalytics.totalMonthly.toLocaleString()}</Title>
                <Text type="secondary">Total API Costs</Text>
              </Col>
              <Col span={12}>
                <Title level={4} style={{ color: "#52c41a" }}>
                  ${costAnalytics.savings.toLocaleString()}
                </Title>
                <Text type="secondary">Cost Savings</Text>
              </Col>
            </Row>
            <Divider />
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Legitimate Traffic:</Text>
                <Text>${costAnalytics.legitimate.toLocaleString()}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Suspicious Traffic:</Text>
                <Text type="warning">${costAnalytics.suspicious.toLocaleString()}</Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Blocked Threats:</Text>
                <Text type="danger">${costAnalytics.blocked.toLocaleString()}</Text>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Recent Activity */}
        <Col xs={24} lg={12}>
          <Card title="Recent Activity" extra={<a>View All</a>}>
            <Timeline>
              {recentActivity?.map((activity: any, index: number) => (
                <Timeline.Item
                  key={index}
                  color={
                    activity.type === "security"
                      ? "red"
                      : activity.type === "discovery"
                        ? "blue"
                        : activity.type === "policy"
                          ? "orange"
                          : "green"
                  }
                >
                  <div>
                    <Text type="secondary">{activity.time}</Text>
                    <br />
                    <Text>{activity.event}</Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
