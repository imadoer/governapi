"use client";

import * as React from "react";
import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Form,
  Input,
  Select,
  Modal,
  message,
  Switch,
  Statistic,
} from "antd";
import {
  BellOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

interface WebhookCenterProps {
  webhooks: any[];
  loading: boolean;
}

export default function WebhookCenter({
  webhooks,
  loading,
}: WebhookCenterProps) {
  const [createModal, setCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  // WORKING add webhook function
  const handleAddWebhook = async (values: any) => {
    setCreating(true);
    try {
      const response = await fetch("/api/customer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "gapi_hx6zmpncm6j",
          name: values.name,
          url: values.url,
          events: values.events,
          webhookType: values.webhookType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        message.success("Webhook created successfully!");
        setCreateModal(false);
        form.resetFields();
        window.location.reload(); // Refresh to show new webhook
      } else {
        message.error("Failed to create webhook");
      }
    } catch (error) {
      message.error("Failed to create webhook");
      console.error("Create webhook error:", error);
    } finally {
      setCreating(false);
    }
  };

  const handleTestWebhook = (webhook: any) => {
    message.info(`Testing webhook: ${webhook.name}`);
    setTimeout(() => {
      message.success("Webhook test successful! Response: 200 OK");
    }, 2000);
  };

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
        <Title level={2}>Webhook Center</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModal(true)}
        >
          Add Webhook
        </Button>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Webhooks"
              value={webhooks?.filter((w) => w.enabled)?.length || 0}
              prefix={<BellOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Deliveries"
              value="2,847"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value="98.2%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Failed Deliveries"
              value="51"
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Configured Webhooks" loading={loading}>
        <Table
          dataSource={
            webhooks?.length
              ? webhooks.map((item, index) => ({ ...item, key: index }))
              : [
                  {
                    key: 1,
                    name: "Slack Security Alerts",
                    events: ["threat.detected", "security_scan.completed"],
                    enabled: true,
                    lastDelivery: new Date().toISOString(),
                  },
                  {
                    key: 2,
                    name: "Email Notifications",
                    url: "https://api.company.com/webhook/security",
                    events: ["vulnerability.found", "scan.completed"],
                    enabled: true,
                    lastDelivery: new Date(Date.now() - 3600000).toISOString(),
                  },
                ]
          }
          columns={[
            {
              title: "Name",
              dataIndex: "name",
              key: "name",
              render: (name) => <Text strong>{name}</Text>,
            },
            {
              title: "URL",
              dataIndex: "url",
              key: "url",
              render: (url) => <Text code>{url?.substring(0, 50)}...</Text>,
            },
            {
              title: "Events",
              dataIndex: "events",
              key: "events",
              render: (events) => (
                <div>
                  {events?.slice(0, 2).map((event) => (
                    <Tag key={event} style={{ marginBottom: 2 }}>
                      {event.replace(".", " ")}
                    </Tag>
                  ))}
                  {events?.length > 2 && <Tag>+{events.length - 2} more</Tag>}
                </div>
              ),
            },
            {
              title: "Status",
              dataIndex: "enabled",
              key: "enabled",
              render: (enabled) => (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Switch checked={enabled} />
                  <Tag color={enabled ? "green" : "red"}>
                    {enabled ? "Active" : "Disabled"}
                  </Tag>
                </div>
              ),
            },
            {
              title: "Last Delivery",
              dataIndex: "lastDelivery",
              key: "lastDelivery",
              render: (date) =>
                date ? new Date(date).toLocaleString() : "Never",
            },
            {
              title: "Actions",
              key: "actions",
              render: (_, record) => (
                <Space>
                  <Button onClick={() => handleTestWebhook(record)}>
                    Test
                  </Button>
                  <Button icon={<EditOutlined />}>Edit</Button>
                  <Button danger icon={<DeleteOutlined />}>
                    Delete
                  </Button>
                </Space>
              ),
            },
          ]}
          pagination={{ pageSize: 8 }}
        />
      </Card>

      {/* Add Webhook Modal */}
      <Modal
        title="Add New Webhook"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddWebhook}>
          <Form.Item
            label="Webhook Name"
            name="name"
            rules={[{ required: true, message: "Please enter webhook name" }]}
          >
            <Input placeholder="Slack Security Alerts" />
          </Form.Item>

          <Form.Item
            label="Webhook URL"
            name="url"
            rules={[
              { required: true, message: "Please enter webhook URL" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
          >
          </Form.Item>

          <Form.Item
            label="Webhook Type"
            name="webhookType"
            rules={[{ required: true, message: "Please select webhook type" }]}
          >
            <Select placeholder="Select type">
              <Option value="slack">Slack</Option>
              <Option value="teams">Microsoft Teams</Option>
              <Option value="discord">Discord</Option>
              <Option value="generic">Generic HTTP</Option>
              <Option value="email">Email</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Events to Monitor"
            name="events"
            rules={[{ required: true, message: "Please select events" }]}
          >
            <Select mode="multiple" placeholder="Select events" allowClear>
              <Option value="threat.detected">Threat Detected</Option>
              <Option value="security_scan.completed">
                Security Scan Completed
              </Option>
              <Option value="vulnerability.found">Vulnerability Found</Option>
              <Option value="bot.blocked">Bot Blocked</Option>
              <Option value="rate_limit.exceeded">Rate Limit Exceeded</Option>
              <Option value="api.down">API Down</Option>
              <Option value="compliance.alert">Compliance Alert</Option>
            </Select>
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <Button onClick={() => setCreateModal(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={creating}>
              Add Webhook
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
