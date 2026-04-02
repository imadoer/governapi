"use client";
import * as React from "react";
import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Tag,
  Space,
  Typography,
  Input,
  Select,
  Modal,
  Form,
  Switch,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  KeyOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

export default function APIManagement({
  stats,
  refreshData,
  refreshing,
  company,
  apiKeys = [],
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);

  // Use real API keys from props
  // Use real API keys from props

  const columns = [
    {
      title: "API Key Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.key}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "active" ? "green" : "red"}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Usage",
      key: "usage",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>{record.requests.toLocaleString()} requests</Text>
          <Text type="secondary">{record.rateLimit}</Text>
        </Space>
      ),
    },
    {
      title: "Last Used",
      dataIndex: "lastUsed",
      key: "lastUsed",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small" />
          <Button icon={<EditOutlined />} size="small" />
          <Button icon={<DeleteOutlined />} size="small" danger />
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header Section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
          API Management
        </Title>
        <Paragraph
          style={{
            marginTop: 8,
            marginBottom: 0,
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          Manage your API keys, monitor usage, configure rate limits, and
          control access to your enterprise security platform. Track real-time
          API performance and maintain secure authentication across all your
          integrations.
        </Paragraph>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total API Keys"
              value={apiKeys.length}
              prefix={<KeyOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Keys"
              value={apiKeys.filter((k) => k.status === "active").length}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Monthly Requests"
              value={apiKeys.reduce((sum, k) => sum + k.requests, 0)}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Rate Limit Usage"
              value={75}
              suffix="%"
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Search placeholder="Search API keys..." style={{ width: 300 }} />
              <Select defaultValue="all" style={{ width: 120 }}>
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="active">Active</Select.Option>
                <Select.Option value="inactive">Inactive</Select.Option>
              </Select>
              <Button icon={<FilterOutlined />}>Filters</Button>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button icon={<DownloadOutlined />}>Export</Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsModalVisible(true)}
              >
                Create API Key
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* API Keys Table */}
      <Card
        title="API Keys"
        extra={
          <Button onClick={refreshData} loading={refreshing}>
            Refresh
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={apiKeys}
          rowKey="id"
          pagination={{
            total: apiKeys.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </Card>

      {/* Create API Key Modal */}
      <Modal
        title="Create New API Key"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form layout="vertical">
          <Form.Item label="API Key Name" required>
            <Input placeholder="Enter a descriptive name" />
          </Form.Item>
          <Form.Item label="Rate Limit">
            <Select defaultValue="1000" style={{ width: "100%" }}>
              <Select.Option value="100">100 requests/hour</Select.Option>
              <Select.Option value="500">500 requests/hour</Select.Option>
              <Select.Option value="1000">1,000 requests/hour</Select.Option>
              <Select.Option value="5000">5,000 requests/hour</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Permissions">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Switch defaultChecked /> Read API Access
              </div>
              <div>
                <Switch defaultChecked /> Write API Access
              </div>
              <div>
                <Switch /> Admin API Access
              </div>
              <div>
                <Switch /> Webhook Access
              </div>
            </Space>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary">Create API Key</Button>
              <Button onClick={() => setIsModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
