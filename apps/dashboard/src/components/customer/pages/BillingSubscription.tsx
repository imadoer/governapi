"use client";

import * as React from "react";
import { useState } from "react";
import {
  Card,
  Button,
  Typography,
  Tag,
  Row,
  Col,
  Progress,
  Table,
  Modal,
  Form,
  Input,
  message,
} from "antd";
import {
  CreditCardOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function BillingSubscription() {
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPlan = {
    name: "Professional",
    price: "$79/month",
    features: [
      "Up to 1M API calls/month",
      "Advanced threat detection",
      "99.9% SLA guarantee",
      "Email & chat support",
      "Custom integrations",
    ],
  };

  const billingHistory = [
    {
      key: "1",
      invoice: "INV-2024-001",
      date: "2024-01-01",
      amount: "$79.00",
      status: "Paid",
    },
    {
      key: "2",
      invoice: "INV-2023-012",
      date: "2023-12-01",
      amount: "$79.00",
      status: "Paid",
    },
    {
      key: "3",
      invoice: "INV-2023-011",
      date: "2023-11-01",
      amount: "$79.00",
      status: "Paid",
    },
  ];

  const handleUpgrade = async (values: any) => {
    setLoading(true);
    try {
      // Upgrade logic here
      message.success("Plan upgrade initiated!");
      setUpgradeModal(false);
    } catch (error) {
      message.error("Upgrade failed");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: "Invoice", dataIndex: "invoice", key: "invoice" },
    { title: "Date", dataIndex: "date", key: "date" },
    { title: "Amount", dataIndex: "amount", key: "amount" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Paid" ? "green" : "orange"}>{status}</Tag>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3}>Billing & Subscription</Title>
        <Text type="secondary">
          Manage your subscription plan and billing information
        </Text>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Current Plan" style={{ height: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <TrophyOutlined
                style={{ fontSize: 48, color: "#1890ff", marginBottom: 16 }}
              />
              <Title level={2} style={{ margin: 0 }}>
                {currentPlan.name}
              </Title>
              <Text style={{ fontSize: 18, color: "#52c41a" }}>
                {currentPlan.price}
              </Text>
            </div>

            <div style={{ marginBottom: 16 }}>
              <Text strong>Plan Features:</Text>
              <ul style={{ marginTop: 8 }}>
                {currentPlan.features.map((feature, index) => (
                  <li key={index} style={{ marginBottom: 4 }}>
                    <CheckCircleOutlined
                      style={{ color: "#52c41a", marginRight: 8 }}
                    />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <Button
              type="primary"
              icon={<TrophyOutlined />}
              onClick={() => setUpgradeModal(true)}
              block
              size="large"
            >
              Upgrade Plan
            </Button>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Usage This Month" style={{ height: "100%" }}>
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>API Calls</Text>
                <Text strong>450,000 / 1,000,000</Text>
              </div>
              <Progress percent={45} strokeColor="#1890ff" />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>Bandwidth</Text>
                <Text strong>2.3 GB / 10 GB</Text>
              </div>
              <Progress percent={23} strokeColor="#52c41a" />
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <Text>Support Tickets</Text>
                <Text strong>3 / Unlimited</Text>
              </div>
              <Progress percent={100} strokeColor="#722ed1" />
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="Billing History">
        <Table
          dataSource={billingHistory}
          columns={columns}
          rowKey="key"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="Upgrade Subscription"
        open={upgradeModal}
        onCancel={() => setUpgradeModal(false)}
        footer={null}
      >
        <Form onFinish={handleUpgrade} layout="vertical">
          <Form.Item
            label="Select Plan"
            name="plan"
            rules={[{ required: true, message: "Please select a plan" }]}
          >
            <div>
              <div
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  padding: "16px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Text strong>Enterprise</Text>
                    <div>
                      <Text type="secondary">Unlimited API calls</Text>
                    </div>
                  </div>
                  <Text strong style={{ color: "#52c41a" }}>
                    $199/month
                  </Text>
                </div>
              </div>

              <div
                style={{
                  border: "1px solid #d9d9d9",
                  borderRadius: "6px",
                  padding: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <Text strong>Enterprise Pro</Text>
                    <div>
                      <Text type="secondary">Priority support & SLA</Text>
                    </div>
                  </div>
                  <Text strong style={{ color: "#52c41a" }}>
                    $299/month
                  </Text>
                </div>
              </div>
            </div>
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginTop: 24 }}>
            <Button
              onClick={() => setUpgradeModal(false)}
              style={{ marginRight: 8 }}
            >
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Upgrade Now
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
