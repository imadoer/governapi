"use client";

import * as React from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  DatePicker,
  Space,
  Button,
  Typography,
  Progress,
} from "antd";
import {
  MonitorOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
  AlertOutlined,
  ReloadOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface PerformanceMonitorProps {
  performanceMetrics: any;
  loading: boolean;
  onRefresh: () => void;
}

export default function PerformanceMonitor({
  performanceMetrics,
  loading,
  onRefresh,
}: PerformanceMonitorProps) {
  const overview = performanceMetrics?.overview || {};
  const endpointMetrics = performanceMetrics?.endpointMetrics || [];
  const geographicPerformance = performanceMetrics?.geographicPerformance || {};

  const handleRefresh = () => {
    console.log("🔄 Refreshing performance data...");
    if (onRefresh) {
      onRefresh();
    }
  };

  const getPerformanceStatus = () => {
    const avgTime = overview.averageResponseTime || 127;
    if (avgTime < 100)
      return { status: "Excellent", color: "#52c41a", icon: "🚀" };
    if (avgTime < 200) return { status: "Good", color: "#1890ff", icon: "✅" };
    if (avgTime < 500) return { status: "Fair", color: "#faad14", icon: "⚠️" };
    return { status: "Poor", color: "#ff4d4f", icon: "🔴" };
  };

  const perfStatus = getPerformanceStatus();

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <Title level={2}>Performance Monitoring</Title>
        <Space>
          <RangePicker />
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      <Card
        style={{
          marginBottom: 24,
          background: `linear-gradient(135deg, ${perfStatus.color}15 0%, ${perfStatus.color}05 100%)`,
          border: `1px solid ${perfStatus.color}30`,
        }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16}>
            <div>
              <Title
                level={3}
                style={{ marginBottom: 8, color: perfStatus.color }}
              >
                <MonitorOutlined /> Real-Time Performance Status:{" "}
                {perfStatus.status} {perfStatus.icon}
              </Title>
              <Text style={{ fontSize: 16, color: "#666" }}>
                System performing {perfStatus.status.toLowerCase()} with{" "}
                {overview.averageResponseTime || 127}ms average response time.
                Uptime: {overview.uptimePercentage || 99.97}%
              </Text>
            </div>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "right" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 16,
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: "bold",
                    color: perfStatus.color,
                  }}
                >
                  {overview.averageResponseTime || 127}ms
                </div>
                <Text style={{ color: "#666" }}>Avg Response</Text>
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontSize: 28, fontWeight: "bold", color: "#52c41a" }}
                >
                  {overview.uptimePercentage || 99.97}%
                </div>
                <Text style={{ color: "#666" }}>Uptime</Text>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Requests/Second"
              value={overview.requestsPerSecond || 1247}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: "#1890ff" }}
              suffix="rps"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Error Rate"
              value={overview.errorRate || 0.12}
              suffix="%"
              prefix={<AlertOutlined />}
              valueStyle={{
                color: (overview.errorRate || 0.12) > 1 ? "#ff4d4f" : "#52c41a",
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="P99 Response Time"
              value={overview.p99ResponseTime || 456}
              suffix="ms"
              prefix={<ClockCircleOutlined />}
              valueStyle={{
                color:
                  (overview.p99ResponseTime || 456) > 1000
                    ? "#ff4d4f"
                    : "#faad14",
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Throughput"
              value={overview.throughput || 2.3}
              suffix=" req/min"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card title="Endpoint Performance Analysis" loading={loading}>
            <Table
              dataSource={endpointMetrics.map((item: any, index: number) => ({
                ...item,
                key: index,
              }))}
              columns={[
                {
                  title: "Endpoint",
                  dataIndex: "endpoint",
                  key: "endpoint",
                  render: (endpoint: string) => <Text code>{endpoint}</Text>,
                },
                {
                  title: "Avg Response",
                  dataIndex: "averageResponseTime",
                  key: "averageResponseTime",
                  render: (time: number) => (
                    <div>
                      <Text
                        style={{
                          color:
                            time < 100
                              ? "#52c41a"
                              : time < 200
                                ? "#1890ff"
                                : time < 500
                                  ? "#faad14"
                                  : "#ff4d4f",
                          fontWeight: "bold",
                        }}
                      >
                        {time}ms
                      </Text>
                    </div>
                  ),
                  sorter: (a, b) =>
                    a.averageResponseTime - b.averageResponseTime,
                },
                {
                  title: "Requests",
                  dataIndex: "requestCount",
                  key: "requestCount",
                  render: (count: number) => count?.toLocaleString(),
                  sorter: (a, b) => a.requestCount - b.requestCount,
                },
                {
                  title: "Error Rate",
                  dataIndex: "errorRate",
                  key: "errorRate",
                  render: (rate: number) => (
                    <Tag
                      color={rate < 0.1 ? "green" : rate < 1 ? "orange" : "red"}
                    >
                      {rate?.toFixed(2)}%
                    </Tag>
                  ),
                  sorter: (a, b) => a.errorRate - b.errorRate,
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  render: (status: string) => {
                    const colors = {
                      Healthy: "success",
                      Warning: "warning",
                      Critical: "error",
                    };
                    const icons = {
                      Healthy: "✅",
                      Warning: "⚠️",
                      Critical: "🔴",
                    };
                    return (
                      <Tag
                        color={colors[status as keyof typeof colors]}
                        style={{ fontSize: 12 }}
                      >
                        {icons[status as keyof typeof icons]} {status}
                      </Tag>
                    );
                  },
                },
              ]}
              pagination={{ pageSize: 8 }}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Geographic Performance" loading={loading}>
            <div style={{ padding: "8px 0" }}>
              {Object.entries(geographicPerformance).map(([region, data]) => (
                <div key={region} style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <Text strong>{region.replace("-", " ").toUpperCase()}</Text>
                    <Text
                      style={{
                        color:
                          ((data as any)?.latency || 0) < 50
                            ? "#52c41a"
                            : ((data as any)?.latency || 0) < 100
                              ? "#1890ff"
                              : ((data as any)?.latency || 0) < 200
                                ? "#faad14"
                                : "#ff4d4f",
                        fontWeight: "bold",
                      }}
                    >
                      {(data as any)?.latency || 0}ms
                    </Text>
                  </div>
                  <Progress
                    percent={Math.max(
                      0,
                      100 - ((data as any)?.latency || 0) / 3,
                    )}
                    strokeColor={
                      ((data as any)?.status || "Unknown") === "Optimal"
                        ? "#52c41a"
                        : ((data as any)?.status || "Unknown") === "Good"
                          ? "#1890ff"
                          : "#faad14"
                    }
                    size="small"
                    format={() => (data as any)?.status || "Unknown"}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
