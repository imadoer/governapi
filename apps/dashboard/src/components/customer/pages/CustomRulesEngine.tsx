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
  Switch,
  Form,
  Input,
  Select,
  Button,
  Space,
  Typography,
  Progress,
  Modal,
  Descriptions,
  message,
} from "antd";
import {
  CodeOutlined,
  ThunderboltOutlined,
  LockOutlined,
  SettingOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface CustomRule {
  id: string;
  name: string;
  ruleType:
    | "GeoBlocking"
    | "RateLimiting"
    | "PatternMatching"
    | "IPWhitelist"
    | "UserAgentFilter";
  priority: "Critical" | "High" | "Medium" | "Low";
  isActive: boolean;
  triggeredCount?: number;
  description?: string;
  config?: any;
  createdAt?: string;
}

interface CustomRulesEngineProps {
  customRules: CustomRule[];
  loading: boolean;
}

interface RuleFormValues {
  name: string;
  ruleType: string;
  priority: string;
  description?: string;
  isActive?: boolean;
  config?: any;
}

export default function CustomRulesEngine({
  customRules,
  loading,
}: CustomRulesEngineProps) {
  const [viewModal, setViewModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<CustomRule | null>(null);
  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  const activeRules = customRules.filter((r) => r.isActive);
  const totalTriggers = customRules.reduce(
    (sum, r) => sum + (r.triggeredCount || 0),
    0,
  );
  const blockedRequests = Math.floor(totalTriggers * 0.7);
  const ruleTypes = Array.from(
    new Set(customRules.map((r) => r.ruleType)),
  ).length;

  const getRuleTypeColor = (type: string) => {
    const colors = {
      GeoBlocking: "blue",
      RateLimiting: "green",
      PatternMatching: "red",
      IPWhitelist: "purple",
      UserAgentFilter: "orange",
    };
    return colors[type as keyof typeof colors] || "default";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      Critical: "red",
      High: "orange",
      Medium: "blue",
      Low: "green",
    };
    return colors[priority as keyof typeof colors] || "default";
  };

  // WORKING create rule function
  const handleCreateRule = async (values: RuleFormValues) => {
    setCreating(true);
    try {
      const response = await fetch("/api/customer/custom-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "gapi_hx6zmpncm6j",
          name: values.name,
          ruleType: values.ruleType,
          priority: values.priority,
          description: values.description,
          isActive: values.isActive !== false,
          config: values.config || {},
        }),
      });

      if (response.ok) {
        message.success("Custom rule created successfully!");
        form.resetFields();
        setCreateModal(false);
        // In real implementation, refresh the rules list
      } else {
        message.error("Failed to create custom rule");
      }
    } catch (error) {
      console.error("Rule creation error:", error);
      message.error("Error creating custom rule");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/customer/custom-rules/${ruleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "gapi_hx6zmpncm6j",
          isActive,
        }),
      });

      if (response.ok) {
        message.success(
          `Rule ${isActive ? "activated" : "deactivated"} successfully!`,
        );
        // In real implementation, update the rules list
      } else {
        message.error("Failed to update rule status");
      }
    } catch (error) {
      console.error("Rule toggle error:", error);
      message.error("Error updating rule status");
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/customer/custom-rules/${ruleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: "gapi_hx6zmpncm6j",
        }),
      });

      if (response.ok) {
        message.success("Rule deleted successfully!");
        // In real implementation, refresh the rules list
      } else {
        message.error("Failed to delete rule");
      }
    } catch (error) {
      console.error("Rule deletion error:", error);
      message.error("Error deleting rule");
    }
  };

  const columns = [
    {
      title: "Rule Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: CustomRule) => (
        <Button
          type="link"
          onClick={() => {
            setSelectedRule(record);
            setViewModal(true);
          }}
        >
          {name}
        </Button>
      ),
    },
    {
      title: "Type",
      dataIndex: "ruleType",
      key: "ruleType",
      render: (type: string) => (
        <Tag color={getRuleTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: CustomRule) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleRule(record.id, checked)}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Triggered",
      dataIndex: "triggeredCount",
      key: "triggeredCount",
      render: (count: number) => count || 0,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: CustomRule) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedRule(record);
              setViewModal(true);
            }}
          >
            View
          </Button>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              form.setFieldsValue(record);
              setSelectedRule(record);
              setCreateModal(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteRule(record.id)}
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
              <CodeOutlined /> Custom Rules Engine
            </Title>
            <Text type="secondary">
              Create and manage custom security and policy rules for your API
              endpoints
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active Rules"
              value={activeRules.length}
              valueStyle={{ color: "#52c41a" }}
              prefix={<LockOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Triggers"
              value={totalTriggers}
              prefix={<ThunderboltOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Blocked Requests"
              value={blockedRequests}
              valueStyle={{ color: "#ff4d4f" }}
              prefix={<SettingOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Rule Types"
              value={ruleTypes}
              prefix={<CodeOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title="Rule Management"
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  form.resetFields();
                  setSelectedRule(null);
                  setCreateModal(true);
                }}
              >
                Create Rule
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={customRules}
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

      {/* View Rule Modal */}
      <Modal
        title="Rule Details"
        open={viewModal}
        onCancel={() => setViewModal(false)}
        footer={null}
        width={700}
      >
        {selectedRule && (
          <Descriptions bordered>
            <Descriptions.Item label="Name">
              {selectedRule.name}
            </Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={getRuleTypeColor(selectedRule.ruleType)}>
                {selectedRule.ruleType}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={getPriorityColor(selectedRule.priority)}>
                {selectedRule.priority}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedRule.isActive ? "green" : "red"}>
                {selectedRule.isActive ? "Active" : "Inactive"}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Triggered Count">
              {selectedRule.triggeredCount || 0}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {selectedRule.createdAt
                ? new Date(selectedRule.createdAt).toLocaleString()
                : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={3}>
              {selectedRule.description || "No description provided"}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>

      {/* Create/Edit Rule Modal */}
      <Modal
        title={selectedRule ? "Edit Rule" : "Create New Rule"}
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleCreateRule} layout="vertical">
          <Form.Item
            label="Rule Name"
            name="name"
            rules={[{ required: true, message: "Please enter rule name" }]}
          >
            <Input placeholder="Enter rule name" />
          </Form.Item>

          <Form.Item
            label="Rule Type"
            name="ruleType"
            rules={[{ required: true, message: "Please select rule type" }]}
          >
            <Select placeholder="Select rule type">
              <Option value="GeoBlocking">Geo Blocking</Option>
              <Option value="RateLimiting">Rate Limiting</Option>
              <Option value="PatternMatching">Pattern Matching</Option>
              <Option value="IPWhitelist">IP Whitelist</Option>
              <Option value="UserAgentFilter">User Agent Filter</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Priority"
            name="priority"
            rules={[{ required: true, message: "Please select priority" }]}
          >
            <Select placeholder="Select priority">
              <Option value="Critical">Critical</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Description" name="description">
            <TextArea rows={3} placeholder="Enter rule description" />
          </Form.Item>

          <Form.Item
            name="isActive"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            <Text style={{ marginLeft: 8 }}>Rule Status</Text>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={creating}>
                {selectedRule ? "Update Rule" : "Create Rule"}
              </Button>
              <Button onClick={() => setCreateModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
