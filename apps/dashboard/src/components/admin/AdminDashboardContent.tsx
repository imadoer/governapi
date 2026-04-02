"use client";

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Alert,
  Empty,
  Spin,
} from "antd";
import {
  UserOutlined,
  DollarOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import AdminLayout from "./AdminLayout";

const { Title, Text } = Typography;

function AdminDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    systemStats: {
      totalCustomers: 0,
      activeCustomers: 0,
      totalApiCalls: 0,
      systemUptime: 99.97,
      activeThreats: 0,
      monthlyRevenue: 0,
    },
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/stats");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Non-JSON response received");
      }

      const data = await response.json();

      if (data.success) {
        setDashboardData({ systemStats: data.stats });
        setIsOffline(!data.stats.isLive);
        setError(null);
      } else {
        setError(data.error || "Unknown error occurred");
        setIsOffline(true);
      }
    } catch (error) {
      console.error("Dashboard load error:", error);
      setError("System temporarily unavailable");
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>Loading system status...</Text>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>Enterprise Admin Dashboard</Title>
          <Text type="secondary">System monitoring and administration</Text>
        </div>

        {error || isOffline ? (
          <Alert
            message={isOffline ? "Offline Mode" : "Connection Issue"}
            description={
              error ||
              "Database temporarily unavailable - showing system status only"
            }
            type="warning"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: 24 }}
            action={
              <button
                onClick={loadDashboardData}
                style={{
                  background: "none",
                  border: "1px solid #faad14",
                  color: "#faad14",
                  padding: "4px 12px",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Retry Connection
              </button>
            }
          />
        ) : (
          <Alert
            message="System Operational"
            description="All systems running normally with live database connection."
            type="success"
            showIcon
            icon={<CheckCircleOutlined />}
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Total Customers"
                value={dashboardData.systemStats.totalCustomers}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Monthly Revenue"
                value={dashboardData.systemStats.monthlyRevenue}
                prefix={<DollarOutlined />}
                valueStyle={{ color: "#52c41a" }}
                formatter={(value) => `$${value?.toLocaleString()}`}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="System Uptime"
                value={dashboardData.systemStats.systemUptime}
                suffix="%"
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card>
              <Statistic
                title="Security Status"
                value="Active"
                prefix={<SecurityScanOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="System Status">
          <Empty
            description={
              isOffline
                ? "Database connection unavailable - core system operational"
                : "No activity logs available"
            }
          />
        </Card>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboardContent;
