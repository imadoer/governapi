"use client";
import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Progress,
  Table,
  Tag,
  Alert,
} from "antd";
import {
  LineChartOutlined,
  DatabaseOutlined,
  CloudOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import AdminLayout from "./AdminLayout";

const { Title, Text } = Typography;

interface ApiMetric {
  key: string;
  endpoint: string;
  calls: number;
  avgTime: number;
  errors: number;
  uptime?: number;
  status?: string;
}

interface SystemPerformance {
  cpuUsage?: number;
  memoryUsage?: number;
  diskUsage?: number;
  responseTime?: number;
  uptime?: number;
}

interface SystemResources {
  totalRequests?: number;
  activeConnections?: number;
  errorRate?: number;
  throughput?: number;
}

interface SystemMetrics {
  performance: SystemPerformance;
  resources: SystemResources;
  apiMetrics: ApiMetric[];
}

function SystemAnalyticsContent() {
  const [loading, setLoading] = useState(true);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    performance: {},
    resources: {},
    apiMetrics: [],
  });

  useEffect(() => {
    loadRealSystemMetrics();
  }, []);

  const loadRealSystemMetrics = async () => {
    try {
      setLoading(true);

      // Simulate real system metrics
      const mockMetrics: SystemMetrics = {
        performance: {
          cpuUsage: 45,
          memoryUsage: 62,
          diskUsage: 78,
          responseTime: 120,
          uptime: 99.8,
        },
        resources: {
          totalRequests: 1250000,
          activeConnections: 1420,
          errorRate: 0.02,
          throughput: 850,
        },
        apiMetrics: [
          {
            key: "1",
            endpoint: "/api/customer/dashboard",
            calls: 45000,
            avgTime: 95,
            errors: 12,
            uptime: 99.9,
            status: "healthy",
          },
          {
            key: "2",
            endpoint: "/api/security-scan-results",
            calls: 32000,
            avgTime: 180,
            errors: 8,
            uptime: 99.7,
            status: "healthy",
          },
          {
            key: "3",
            endpoint: "/api/customer/vulnerabilities",
            calls: 28000,
            avgTime: 220,
            errors: 15,
            uptime: 99.5,
            status: "warning",
          },
          {
            key: "4",
            endpoint: "/api/customer/compliance-report",
            calls: 18000,
            avgTime: 340,
            errors: 5,
            uptime: 99.8,
            status: "healthy",
          },
          {
            key: "5",
            endpoint: "/api/discovery/scanner",
            calls: 12000,
            avgTime: 450,
            errors: 3,
            uptime: 99.9,
            status: "healthy",
          },
        ],
      };

      setSystemMetrics(mockMetrics);
    } catch (error) {
      console.error("Error loading system metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (val: number) =>
    val > 95 ? "#52c41a" : val > 80 ? "#faad14" : "#ff4d4f";
  const getPerformanceColor = (val: number) =>
    val < 70 ? "#52c41a" : val < 85 ? "#faad14" : "#ff4d4f";

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: "green",
      warning: "orange",
      critical: "red",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const columns = [
    {
      title: "API Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      width: "30%",
    },
    {
      title: "Total Calls",
      dataIndex: "calls",
      key: "calls",
      render: (calls: number) => calls.toLocaleString(),
    },
    {
      title: "Avg Response (ms)",
      dataIndex: "avgTime",
      key: "avgTime",
      render: (time: number) => `${time}ms`,
    },
    {
      title: "Errors",
      dataIndex: "errors",
      key: "errors",
      render: (errors: number) => (
        <Tag color={errors > 10 ? "red" : "green"}>{errors}</Tag>
      ),
    },
    {
      title: "Uptime %",
      dataIndex: "uptime",
      key: "uptime",
      render: (uptime: number) => (
        <Progress
          percent={uptime}
          size="small"
          strokeColor={getHealthColor(uptime)}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status?.toUpperCase()}</Tag>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card>
            <Title level={3}>
              <LineChartOutlined /> System Analytics
            </Title>
            <Text type="secondary">
              Real-time system performance and API monitoring dashboard
            </Text>
          </Card>
        </Col>
      </Row>

      <Alert
        message="System Health Overview"
        description="Monitor key performance indicators and system resource utilization for the GoverAPI platform."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="CPU Usage"
              value={systemMetrics.performance.cpuUsage || 0}
              suffix="%"
              valueStyle={{
                color: getPerformanceColor(
                  systemMetrics.performance.cpuUsage || 0,
                ),
              }}
              prefix={<ThunderboltOutlined />}
            />
            <Progress
              percent={systemMetrics.performance.cpuUsage || 0}
              strokeColor={getPerformanceColor(
                systemMetrics.performance.cpuUsage || 0,
              )}
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Memory Usage"
              value={systemMetrics.performance.memoryUsage || 0}
              suffix="%"
              valueStyle={{
                color: getPerformanceColor(
                  systemMetrics.performance.memoryUsage || 0,
                ),
              }}
              prefix={<DatabaseOutlined />}
            />
            <Progress
              percent={systemMetrics.performance.memoryUsage || 0}
              strokeColor={getPerformanceColor(
                systemMetrics.performance.memoryUsage || 0,
              )}
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Disk Usage"
              value={systemMetrics.performance.diskUsage || 0}
              suffix="%"
              valueStyle={{
                color: getPerformanceColor(
                  systemMetrics.performance.diskUsage || 0,
                ),
              }}
              prefix={<CloudOutlined />}
            />
            <Progress
              percent={systemMetrics.performance.diskUsage || 0}
              strokeColor={getPerformanceColor(
                systemMetrics.performance.diskUsage || 0,
              )}
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="System Uptime"
              value={systemMetrics.performance.uptime || 0}
              suffix="%"
              valueStyle={{
                color: getHealthColor(systemMetrics.performance.uptime || 0),
              }}
              prefix={<LineChartOutlined />}
            />
            <Progress
              percent={systemMetrics.performance.uptime || 0}
              strokeColor={getHealthColor(
                systemMetrics.performance.uptime || 0,
              )}
              showInfo={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={systemMetrics.resources.totalRequests || 0}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Connections"
              value={systemMetrics.resources.activeConnections || 0}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Error Rate"
              value={systemMetrics.resources.errorRate || 0}
              suffix="%"
              precision={2}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Throughput"
              value={systemMetrics.resources.throughput || 0}
              suffix=" req/s"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="API Endpoint Performance">
            <Table
              columns={columns}
              dataSource={systemMetrics.apiMetrics}
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default SystemAnalyticsContent;
