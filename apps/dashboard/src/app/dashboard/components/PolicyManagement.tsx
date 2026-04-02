"use client";

import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Row,
  Col,
  Statistic,
  Progress,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";

export function PolicyManagement() {
  const policies = [
    {
      key: 1,
      name: "Rate Limiting Policy",
      status: "active",
      type: "Rate Control",
      requests: "1,247",
      blocked: 23,
      effectiveness: 98,
    },
    {
      key: 2,
      name: "Authentication Required",
      status: "active",
      type: "Security",
      requests: "892",
      blocked: 45,
      effectiveness: 95,
    },
    {
      key: 3,
      name: "CORS Policy",
      status: "active",
      type: "Access Control",
      requests: "2,156",
      blocked: 12,
      effectiveness: 99,
    },
    {
      key: 4,
      name: "Data Validation",
      status: "inactive",
      type: "Input Validation",
      requests: "0",
      blocked: 0,
      effectiveness: 0,
    },
  ];

  const policyTemplates = [
    {
      name: "PCI DSS Compliance",
      description: "Payment card industry security standards",
    },
    {
      name: "GDPR Data Protection",
      description: "European data privacy regulations",
    },
    {
      name: "SOC2 Controls",
      description: "Service organization control standards",
    },
    {
      name: "API Rate Limiting",
      description: "Prevent API abuse and DoS attacks",
    },
  ];

  const columns = [
    { title: "Policy Name", dataIndex: "name", key: "name" },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "active" ? "green" : "gray"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    { title: "Type", dataIndex: "type", key: "type" },
    { title: "Requests Processed", dataIndex: "requests", key: "requests" },
    { title: "Blocked", dataIndex: "blocked", key: "blocked" },
    {
      title: "Effectiveness",
      dataIndex: "effectiveness",
      key: "effectiveness",
      render: (value: number) => `${value}%`,
    },
    {
      title: "Actions",
      key: "actions",
      render: () => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>
            Edit
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Active Policies" value={3} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Requests Protected" value="4,295" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Threats Blocked" value={80} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Avg Effectiveness" value={97} suffix="%" />
          </Card>
        </Col>
      </Row>

      <Card
        title="Security Policies"
        extra={
          <Button type="primary" icon={<PlusOutlined />}>
            Create Policy
          </Button>
        }
      >
        <Table
          dataSource={policies}
          columns={columns}
          pagination={false}
          size="small"
        />
      </Card>

      <Card title="Policy Templates" style={{ marginTop: 16 }}>
        <Row gutter={[16, 16]}>
          {policyTemplates.map((template, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card size="small" hoverable>
                <Card.Meta
                  title={template.name}
                  description={template.description}
                />
                <Button type="link" style={{ padding: 0, marginTop: 8 }}>
                  Use Template
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  );
}
