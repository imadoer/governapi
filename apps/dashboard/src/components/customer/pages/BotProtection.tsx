"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Typography,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  InputNumber,
  Tabs,
  message,
} from "antd";
import {
  RobotOutlined,
  LockOutlined,
  SecurityScanOutlined,
  AlertOutlined,
  ReloadOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface BotEvent {
  id: string;
  timestamp: string;
  sourceIp: string;
  userAgent: string;
  requestPath: string;
  detectionReason: string;
  riskScore: number;
  action: string;
  country: string;
}

interface BotRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  threshold: string;
  action: string;
}

interface BotStats {
  botsBlockedToday: number;
  activeRules: number;
  totalRules: number;
  averageRiskScore: number;
  responseTime: number;
  detectionRate: number;
  detectionPatterns: {
    suspiciousUserAgents: number;
    highRequestRates: number;
    knownBotPatterns: number;
    behavioralAnalysis: number;
  };
  geographicDistribution: Array<{
    country: string;
    code: string;
    percentage: number;
  }>;
}

export default function BotProtection({
  botEvents = [],
  stats,
  refreshData,
  refreshing,
  onSaveRule,
  onUpdateRule,
  onDeleteRule,
}) {
  const [configModal, setConfigModal] = useState(false);
  const [activeTab, setActiveTab] = useState("detection");
  const [form] = Form.useForm();
  const [editingRule, setEditingRule] = useState<BotRule | null>(null);
  const [loading, setLoading] = useState(false);

  // Use real data from props or fetch from API
  const [botDetectionData, setBotDetectionData] =
    useState<BotEvent[]>(botEvents);
  const [botProtectionRules, setBotProtectionRules] = useState<BotRule[]>([]);
  const [botStats, setBotStats] = useState<BotStats | null>(stats);

  useEffect(() => {
    setBotDetectionData(botEvents);
  }, [botEvents]);

  useEffect(() => {
    fetchBotRules();
  }, []);

  const fetchBotRules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/bot-protection/rules");
      if (response.ok) {
        const rules = await response.json();
        setBotProtectionRules(rules);
      }
    } catch (error) {
      console.error("Failed to fetch bot rules:", error);
      message.error("Failed to load bot protection rules");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRule = async (values) => {
    try {
      setLoading(true);
      const ruleData = {
        ...values,
        id: editingRule?.id || Date.now().toString(),
      };

      if (editingRule) {
        await onUpdateRule?.(ruleData);
        message.success("Rule updated successfully");
      } else {
        await onSaveRule?.(ruleData);
        message.success("Rule created successfully");
      }

      setConfigModal(false);
      setEditingRule(null);
      form.resetFields();
      await fetchBotRules();
    } catch (error) {
      console.error("Failed to save rule:", error);
      message.error("Failed to save rule");
    } finally {
      setLoading(false);
    }
  };

  const handleEditRule = (rule: BotRule) => {
    setEditingRule(rule);
    form.setFieldsValue(rule);
    setConfigModal(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await onDeleteRule?.(ruleId);
      message.success("Rule deleted successfully");
      await fetchBotRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
      message.error("Failed to delete rule");
    }
  };

  const detectionColumns = [
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (time) => <Text code>{new Date(time).toLocaleTimeString()}</Text>,
    },
    {
      title: "Source IP",
      dataIndex: "sourceIp",
      key: "sourceIp",
      render: (ip, record) => (
        <Space direction="vertical" size="small">
          <Text code>{ip}</Text>
          <Tag>{record.country}</Tag>
        </Space>
      ),
    },
    {
      title: "Detection Reason",
      dataIndex: "detectionReason",
      key: "detectionReason",
    },
    {
      title: "Risk Score",
      dataIndex: "riskScore",
      key: "riskScore",
      render: (score) => (
        <Space>
          <Progress
            percent={score}
            size="small"
            strokeColor={
              score >= 90 ? "#ff4d4f" : score >= 70 ? "#faad14" : "#52c41a"
            }
            style={{ width: 80 }}
          />
          <Text
            strong
            style={{
              color:
                score >= 90 ? "#ff4d4f" : score >= 70 ? "#faad14" : "#52c41a",
            }}
          >
            {score}%
          </Text>
        </Space>
      ),
    },
    {
      title: "Action Taken",
      dataIndex: "action",
      key: "action",
      render: (action) => (
        <Tag
          color={
            action === "blocked"
              ? "red"
              : action === "rate_limited"
                ? "orange"
                : "blue"
          }
        >
          {action.toUpperCase().replace("_", " ")}
        </Tag>
      ),
    },
  ];

  const rulesColumns = [
    {
      title: "Rule Name",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{name}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.description}
          </Text>
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      render: (enabled) => (
        <Tag color={enabled ? "green" : "default"}>
          {enabled ? "ENABLED" : "DISABLED"}
        </Tag>
      ),
    },
    {
      title: "Threshold",
      dataIndex: "threshold",
      key: "threshold",
      render: (threshold) => <Text code>{threshold}</Text>,
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action) => <Tag>{action.toUpperCase()}</Tag>,
    },
    {
      title: "Configure",
      key: "configure",
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleEditRule(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            onClick={() => handleDeleteRule(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: "detection",
      label: "Bot Detection",
      children: (
        <Card
          title={
            <Space>
              <Text strong>Live Bot Detection</Text>
              <Tag color="orange">MONITORING</Tag>
            </Space>
          }
          extra={
            <Button
              onClick={refreshData}
              loading={refreshing}
              icon={<ReloadOutlined />}
            >
              Refresh
            </Button>
          }
        >
          <Table
            columns={detectionColumns}
            dataSource={botDetectionData}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 8 }}
            loading={loading}
          />
        </Card>
      ),
    },
    {
      key: "rules",
      label: "Protection Rules",
      children: (
        <Card
          title="Bot Protection Configuration"
          extra={
            <Button
              type="primary"
              onClick={() => {
                setEditingRule(null);
                form.resetFields();
                setConfigModal(true);
              }}
            >
              Add Rule
            </Button>
          }
        >
          <Table
            columns={rulesColumns}
            dataSource={botProtectionRules}
            rowKey="id"
            pagination={false}
            loading={loading}
          />
        </Card>
      ),
    },
    {
      key: "analytics",
      label: "Analytics",
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Detection Patterns">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>Suspicious User Agents</Text>
                  <Text strong>
                    {botStats?.detectionPatterns?.suspiciousUserAgents || 0}%
                  </Text>
                </div>
                <Progress
                  percent={
                    botStats?.detectionPatterns?.suspiciousUserAgents || 0
                  }
                  strokeColor="#ff4d4f"
                />

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>High Request Rates</Text>
                  <Text strong>
                    {botStats?.detectionPatterns?.highRequestRates || 0}%
                  </Text>
                </div>
                <Progress
                  percent={botStats?.detectionPatterns?.highRequestRates || 0}
                  strokeColor="#faad14"
                />

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>Known Bot Patterns</Text>
                  <Text strong>
                    {botStats?.detectionPatterns?.knownBotPatterns || 0}%
                  </Text>
                </div>
                <Progress
                  percent={botStats?.detectionPatterns?.knownBotPatterns || 0}
                  strokeColor="#1890ff"
                />

                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Text>Behavioral Analysis</Text>
                  <Text strong>
                    {botStats?.detectionPatterns?.behavioralAnalysis || 0}%
                  </Text>
                </div>
                <Progress
                  percent={botStats?.detectionPatterns?.behavioralAnalysis || 0}
                  strokeColor="#52c41a"
                />
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Geographic Distribution">
              <Space direction="vertical" style={{ width: "100%" }}>
                {botStats?.geographicDistribution?.map((geo, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Space>
                      <Tag>{geo.code}</Tag>
                      <Text>{geo.country}</Text>
                    </Space>
                    <Text strong>{geo.percentage}%</Text>
                  </div>
                )) || (
                  <Text type="secondary">No geographic data available</Text>
                )}
              </Space>
            </Card>
          </Col>
        </Row>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
          Bot Protection & Detection
        </Title>
        <Paragraph
          style={{
            marginTop: 8,
            marginBottom: 0,
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          Advanced bot detection and protection system. Monitor automated
          threats, configure protection rules, and analyze bot traffic patterns
          with machine learning-powered detection algorithms.
        </Paragraph>
      </div>

      {/* Bot Protection Status Banner */}
      <Card
        style={{
          marginBottom: 24,
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          color: "white",
          border: "none",
        }}
      >
        <Row align="middle">
          <Col xs={24} md={16}>
            <Space size="large">
              <RobotOutlined style={{ fontSize: 32, color: "white" }} />
              <div>
                <Title level={4} style={{ color: "white", margin: 0 }}>
                  Bot Protection Active
                </Title>
                <Text style={{ color: "rgba(255,255,255,0.9)" }}>
                  {botStats?.botsBlockedToday || 0} bots detected and blocked in
                  the last 24 hours
                </Text>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: "center" }}>
            <Statistic
              title="Detection Rate"
              value={botStats?.detectionRate || 0}
              suffix="%"
              valueStyle={{ color: "white", fontSize: "24px" }}
            />
          </Col>
        </Row>
      </Card>

      {/* Bot Protection Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Bots Blocked Today"
              value={botStats?.botsBlockedToday || 0}
              prefix={<LockOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Detection Rules"
              value={botStats?.activeRules || 0}
              suffix={`/${botStats?.totalRules || 0}`}
              prefix={<SecurityScanOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Average Risk Score"
              value={botStats?.averageRiskScore || 0}
              suffix="%"
              prefix={<AlertOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Response Time"
              value={botStats?.responseTime || 0}
              suffix="ms"
              precision={1}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Protection Status Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="Active Protections" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              {botProtectionRules.map((rule) => (
                <div
                  key={rule.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Space>
                    {rule.enabled ? (
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    ) : (
                      <AlertOutlined style={{ color: "#faad14" }} />
                    )}
                    <Text>{rule.name}</Text>
                  </Space>
                  <Tag color={rule.enabled ? "green" : "orange"}>
                    {rule.enabled ? "ACTIVE" : "DISABLED"}
                  </Tag>
                </div>
              ))}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Recent Bot Activity" size="small">
            <Table
              columns={detectionColumns.slice(0, 4)}
              dataSource={botDetectionData.slice(0, 3)}
              rowKey="id"
              size="small"
              pagination={false}
              showHeader={false}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Configuration Modal */}
      <Modal
        title={
          editingRule
            ? "Edit Bot Protection Rule"
            : "Create Bot Protection Rule"
        }
        open={configModal}
        onCancel={() => {
          setConfigModal(false);
          setEditingRule(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveRule}>
          <Form.Item
            name="name"
            label="Rule Name"
            rules={[{ required: true, message: "Please enter a rule name" }]}
          >
            <Input placeholder="Enter rule name" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please enter a description" }]}
          >
            <Input.TextArea placeholder="Describe the protection rule" />
          </Form.Item>
          <Form.Item name="enabled" label="Enable Rule" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="threshold"
            label="Detection Threshold"
            rules={[{ required: true, message: "Please enter a threshold" }]}
          >
            <Input placeholder="e.g., 100 req/min, 0.8, Pattern match" />
          </Form.Item>
          <Form.Item
            name="action"
            label="Action"
            rules={[{ required: true, message: "Please select an action" }]}
          >
            <Select placeholder="Select action">
              <Option value="block">Block Request</Option>
              <Option value="rate_limit">Rate Limit</Option>
              <Option value="challenge">Challenge User</Option>
              <Option value="log">Log Only</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {editingRule ? "Update Rule" : "Create Rule"}
              </Button>
              <Button
                onClick={() => {
                  setConfigModal(false);
                  setEditingRule(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
