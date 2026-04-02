"use client";

import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Alert,
  Table,
  Empty,
} from "antd";
import { DollarOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";
import AdminLayout from "./AdminLayout";

const { Title, Text } = Typography;

function RevenueAnalyticsContent() {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({
    totalRevenue: 0,
    monthlyRecurring: 0,
    totalCustomers: 0,
    activeCustomers: 0,
    avgRevenue: 0,
    breakdown: [],
  });

  useEffect(() => {
    loadRealRevenueData();
  }, []);

  const loadRealRevenueData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/revenue");
      if (response.ok) {
        const data = await response.json();
        setRevenueData(data.revenue);
      }
    } catch (error) {
      console.error("Failed to load revenue data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout currentPage="revenue">
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>Revenue Analytics</Title>
          <Text type="secondary">
            Real financial data from your customer database
          </Text>
        </div>

        <Alert
          message="Live Revenue Data"
          description="All revenue metrics are calculated directly from your customer subscription data."
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />

        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={12} sm={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Revenue"
                value={revenueData.totalRevenue}
                prefix={<DollarOutlined />}
                formatter={(value) => `$${value?.toLocaleString()}`}
                valueStyle={{ color: "#52c41a" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card loading={loading}>
              <Statistic
                title="Active Customers"
                value={revenueData.activeCustomers}
                prefix={<UserOutlined />}
                valueStyle={{ color: "#1890ff" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card loading={loading}>
              <Statistic
                title="Total Customers"
                value={revenueData.totalCustomers}
                prefix={<TeamOutlined />}
                valueStyle={{ color: "#722ed1" }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card loading={loading}>
              <Statistic
                title="Avg Revenue/Customer"
                value={revenueData.avgRevenue}
                prefix={<DollarOutlined />}
                formatter={(value) => `$${value}`}
                valueStyle={{ color: "#faad14" }}
              />
            </Card>
          </Col>
        </Row>

        <Card title="Revenue by Subscription Plan" loading={loading}>
          {revenueData.breakdown.length > 0 ? (
            <Table
              dataSource={revenueData.breakdown}
              columns={[
                { title: "Plan", dataIndex: "plan", key: "plan" },
                {
                  title: "Customers",
                  dataIndex: "customers",
                  key: "customers",
                },
                {
                  title: "Revenue",
                  dataIndex: "revenue",
                  key: "revenue",
                  render: (revenue) => `$${revenue.toLocaleString()}`,
                },
                {
                  title: "Share",
                  dataIndex: "percentage",
                  key: "percentage",
                  render: (percentage) => `${percentage}%`,
                },
              ]}
              pagination={false}
              size="small"
            />
          ) : (
            <Empty description="No revenue data available - no active subscriptions found" />
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

export default RevenueAnalyticsContent;
