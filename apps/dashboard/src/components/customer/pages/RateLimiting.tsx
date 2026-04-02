"use client";
import * as React from "react";
import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
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
  InputNumber,
  Progress,
} from "antd";
import {
  ThunderboltOutlined,
  SettingOutlined,
  SaveOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  AlertOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

interface RateLimit {
  id: string;
  endpoint: string;
  method: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  isActive: boolean;
  currentUsage: number;
  burstLimit?: number;
}

interface RateLimitSettings {
  globalEnabled: boolean;
  defaultLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  burstAllowance: number;
}

interface RateLimitingProps {
  rateLimits: {
    settings: RateLimitSettings;
    endpoints: RateLimit[];
    stats: {
      totalRequests: number;
      blockedRequests: number;
      averageUsage: number;
    };
  };
  loading: boolean;
}

interface SettingsFormValues {
  globalEnabled: boolean;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstAllowance: number;
}

interface EndpointFormValues {
  endpoint: string;
  method: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit?: number;
}

export default function RateLimiting({
  rateLimits,
  loading,
}: RateLimitingProps) {
  const [settingsModal, setSettingsModal] = useState(false);
  const [endpointModal, setEndpointModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<RateLimit | null>(
    null,
  );
  const [form] = Form.useForm();

  const settings = rateLimits?.settings || {
    globalEnabled: true,
    defaultLimits: {
      requestsPerMinute: 100,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
    },
    burstAllowance: 20,
  };

  const endpoints = rateLimits?.endpoints || [];
  const stats = rateLimits?.stats || {
    totalRequests: 0,
    blockedRequests: 0,
    averageUsage: 0,
  };

  const handleSaveSettings = async (values: SettingsFormValues) => {
    setSaving(true);
    try {
      const response = await fetch("/api/customer/rate-limits/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "gapi_hx6zmpncm6j",
          settings: values,
        }),
      });

      if (response.ok) {
        message.success("Rate limiting settings updated successfully!");
        setSettingsModal(false);
      } else {
        message.error("Failed to update settings");
      }
    } catch (error) {
      console.error("Settings update error:", error);
      message.error("Error updating settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEndpoint = async (values: EndpointFormValues) => {
    setSaving(true);
    try {
      const method = selectedEndpoint ? "PUT" : "POST";
      const url = selectedEndpoint
        ? `/api/customer/rate-limits/endpoints/${selectedEndpoint.id}`
        : "/api/customer/rate-limits/endpoints";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "gapi_hx6zmpncm6j",
          ...values,
        }),
      });

      if (response.ok) {
        message.success(
          `Endpoint rate limit ${selectedEndpoint ? "updated" : "created"} successfully!`,
        );
        setEndpointModal(false);
        setSelectedEndpoint(null);
        form.resetFields();
      } else {
        message.error("Failed to save endpoint rate limit");
      }
    } catch (error) {
      console.error("Endpoint save error:", error);
      message.error("Error saving endpoint rate limit");
    } finally {
      setSaving(false);
    }
  };

  const handleEndpointAction = async (action: string, value: RateLimit) => {
    try {
      switch (action) {
        case "edit":
          setSelectedEndpoint(value);
          form.setFieldsValue(value);
          setEndpointModal(true);
          break;
        case "toggle":
          const response = await fetch(
            `/api/customer/rate-limits/endpoints/${value.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: "gapi_hx6zmpncm6j",
                isActive: !value.isActive,
              }),
            },
          );
          if (response.ok) {
            message.success(
              `Rate limit ${!value.isActive ? "enabled" : "disabled"}`,
            );
          }
          break;
        case "delete":
          const deleteResponse = await fetch(
            `/api/customer/rate-limits/endpoints/${value.id}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ apiKey: "gapi_hx6zmpncm6j" }),
            },
          );
          if (deleteResponse.ok) {
            message.success("Rate limit deleted");
          }
          break;
      }
    } catch (error) {
      console.error("Endpoint action error:", error);
      message.error("Action failed");
    }
  };

  const getUsageColor = (usage: number, limit: number) => {
    const percentage = (usage / limit) * 100;
    if (percentage >= 90) return "#ff4d4f";
    if (percentage >= 75) return "#faad14";
    return "#52c41a";
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "blue",
      POST: "green",
      PUT: "orange",
      DELETE: "red",
      PATCH: "purple",
    };
    return colors[method as keyof typeof colors] || "default";
  };

  const columns = [
    {
      title: "Endpoint",
      dataIndex: "endpoint",
      key: "endpoint",
      render: (endpoint: string) => <code>{endpoint}</code>,
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      render: (method: string) => (
        <Tag color={getMethodColor(method)}>{method}</Tag>
      ),
    },
    {
      title: "Per Minute",
      dataIndex: "requestsPerMinute",
      key: "requestsPerMinute",
      render: (limit: number, record: RateLimit) => (
        <div>
          <div>{limit} req/min</div>
          <Progress
            percent={Math.min(100, (record.currentUsage / limit) * 100)}
            strokeColor={getUsageColor(record.currentUsage, limit)}
            showInfo={false}
            size="small"
          />
        </div>
      ),
    },
    {
      title: "Per Hour",
      dataIndex: "requestsPerHour",
      key: "requestsPerHour",
      render: (limit: number) => `${limit} req/hr`,
    },
    {
      title: "Per Day",
      dataIndex: "requestsPerDay",
      key: "requestsPerDay",
      render: (limit: number) => `${limit} req/day`,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: RateLimit) => (
        <Switch
          checked={isActive}
          onChange={() => handleEndpointAction("toggle", record)}
          checkedChildren="Active"
          unCheckedChildren="Disabled"
        />
      ),
    },
    {
      title: "Current Usage",
      dataIndex: "currentUsage",
      key: "currentUsage",
      render: (usage: number, record: RateLimit) => (
        <span style={{ color: getUsageColor(usage, record.requestsPerMinute) }}>
          {usage.toLocaleString()}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: RateLimit) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEndpointAction("edit", record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleEndpointAction("delete", record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card>
            <Title level={3}>
              <ThunderboltOutlined /> Rate Limiting
            </Title>
            <Text type="secondary">
              Manage API request limits and traffic control policies
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Requests"
              value={stats.totalRequests}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Blocked Requests"
              value={stats.blockedRequests}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<AlertOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Average Usage"
              value={stats.averageUsage}
              suffix="%"
              valueStyle={{
                color: stats.averageUsage > 80 ? "#ff4d4f" : "#52c41a",
              }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Limits"
              value={endpoints.filter((e) => e.isActive).length}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title="Rate Limit Configuration"
            extra={
              <Space>
                <Button
                  icon={<SettingOutlined />}
                  onClick={() => {
                    form.setFieldsValue(settings);
                    setSettingsModal(true);
                  }}
                >
                  Global Settings
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSelectedEndpoint(null);
                    form.resetFields();
                    setEndpointModal(true);
                  }}
                >
                  Add Endpoint Limit
                </Button>
              </Space>
            }
          >
            <Table
              columns={columns}
              dataSource={endpoints}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Global Settings Modal */}
      <Modal
        title="Global Rate Limiting Settings"
        open={settingsModal}
        onCancel={() => setSettingsModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSaveSettings} layout="vertical">
          <Form.Item name="globalEnabled" valuePropName="checked">
            <Switch checkedChildren="Enabled" unCheckedChildren="Disabled" />
            <Text style={{ marginLeft: 8 }}>Global Rate Limiting</Text>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Per Minute"
                name={["defaultLimits", "requestsPerMinute"]}
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Per Hour"
                name={["defaultLimits", "requestsPerHour"]}
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Per Day"
                name={["defaultLimits", "requestsPerDay"]}
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Burst Allowance"
            name="burstAllowance"
            rules={[{ required: true, message: "Required" }]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                Save Settings
              </Button>
              <Button onClick={() => setSettingsModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Endpoint Modal */}
      <Modal
        title={`${selectedEndpoint ? "Edit" : "Add"} Endpoint Rate Limit`}
        open={endpointModal}
        onCancel={() => {
          setEndpointModal(false);
          setSelectedEndpoint(null);
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSaveEndpoint} layout="vertical">
          <Form.Item
            label="Endpoint"
            name="endpoint"
            rules={[{ required: true, message: "Please enter endpoint path" }]}
          >
            <Input placeholder="/api/v1/users" />
          </Form.Item>

          <Form.Item
            label="Method"
            name="method"
            rules={[{ required: true, message: "Please select method" }]}
          >
            <Select placeholder="Select HTTP method">
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
              <Option value="PATCH">PATCH</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                label="Per Minute"
                name="requestsPerMinute"
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Per Hour"
                name="requestsPerHour"
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label="Per Day"
                name="requestsPerDay"
                rules={[{ required: true, message: "Required" }]}
              >
                <InputNumber min={1} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Burst Limit (Optional)" name="burstLimit">
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                {selectedEndpoint ? "Update" : "Create"} Rate Limit
              </Button>
              <Button onClick={() => setEndpointModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
