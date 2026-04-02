"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Form,
  Switch,
  Select,
  Input,
  Button,
  Typography,
  Divider,
  Space,
  InputNumber,
  message,
  Tabs,
  Alert,
} from "antd";
import {
  SettingOutlined,
  SafetyOutlined,
  BellOutlined,
  DatabaseOutlined,
  GlobalOutlined,
  SaveOutlined,
  ReloadOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface EnterpriseSettingsProps {
  loading: boolean;
  settings: any;
  onSave: (settings: any) => void;
}

export default function EnterpriseSettings({
  loading,
  settings,
  onSave,
}: EnterpriseSettingsProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
    }
  }, [settings, form]);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      await onSave(values);
      setHasChanges(false);
      message.success("Enterprise settings saved successfully!");
    } catch (error) {
      message.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleValuesChange = () => {
    setHasChanges(true);
  };

  const tabItems = [
    {
      key: "security",
      label: "Security Configuration",
      icon: <SafetyOutlined />,
      children: (
        <Card>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>Global Security Settings</Title>

                <Form.Item
                  label="Security Level"
                  name={["security", "globalSecurityLevel"]}
                >
                  <Select>
                    <Option value="standard">Standard Protection</Option>
                    <Option value="high">High Security</Option>
                    <Option value="maximum">Maximum Security</Option>
                    <Option value="custom">Custom Configuration</Option>
                  </Select>
                </Form.Item>

                {/* FIX: Separate Switch and Text */}
                <Form.Item
                  label="Auto-Block Threats"
                  name={["security", "autoBlockThreats"]}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <div
                  style={{ marginTop: -16, marginBottom: 16, paddingLeft: 0 }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Automatically block detected threats
                  </Text>
                </div>

                <Form.Item
                  label="Threat Intelligence Sharing"
                  name={["security", "threatIntelligenceSharing"]}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <div
                  style={{ marginTop: -16, marginBottom: 16, paddingLeft: 0 }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Share anonymized threat data to improve global security
                  </Text>
                </div>

                <Form.Item
                  label="Rate Limiting Enforcement"
                  name={["security", "rateLimitingEnforcement"]}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <div
                  style={{ marginTop: -16, marginBottom: 16, paddingLeft: 0 }}
                >
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Enforce API rate limits automatically
                  </Text>
                </div>
              </div>
            </Col>
            <Col xs={24} lg={12}>
              <div style={{ marginBottom: 24 }}>
                <Title level={4}>Access Control</Title>

                <Form.Item
                  label="Max Login Attempts"
                  name={["security", "maxLoginAttempts"]}
                >
                  <InputNumber min={3} max={10} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  label="Session Timeout (minutes)"
                  name={["security", "sessionTimeout"]}
                >
                  <InputNumber min={15} max={120} style={{ width: "100%" }} />
                </Form.Item>

                <Form.Item
                  label="Require HTTPS"
                  name={["security", "requireHttps"]}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
                <div style={{ marginTop: -16, marginBottom: 16 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Force HTTPS for all connections
                  </Text>
                </div>

                <Form.Item
                  label="IP Whitelist"
                  name={["security", "ipWhitelist"]}
                >
                  <TextArea
                    rows={4}
                    placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                    style={{ fontFamily: "monospace" }}
                  />
                </Form.Item>
              </div>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: <BellOutlined />,
      children: (
        <Card>
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={12}>
              <Title level={4}>Alert Preferences</Title>

              <Form.Item
                label="Email Notifications"
                name={["notifications", "emailNotifications"]}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="SMS Alerts for Critical Threats"
                name={["notifications", "smsAlerts"]}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="Weekly Summary Reports"
                name={["notifications", "weeklySummaryReports"]}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>

              <Form.Item
                label="Real-time Dashboard Alerts"
                name={["notifications", "realtimeDashboardAlerts"]}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} lg={12}>
              <Title level={4}>Notification Settings</Title>

              <Form.Item
                label="Notification Email"
                name={["notifications", "notificationEmail"]}
              >
                <Input placeholder="security@company.com" />
              </Form.Item>

              <Form.Item
                label="Alert Threshold"
                name={["notifications", "alertThreshold"]}
              >
                <Select>
                  <Option value="low">Low - All Events</Option>
                  <Option value="medium">Medium - Important Events</Option>
                  <Option value="high">High - Critical Events Only</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Webhook Notifications"
                name={["notifications", "webhookNotifications"]}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

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
        <Title level={2}>Enterprise Configuration</Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => window.location.reload()}
          >
            Reset to Defaults
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={saving}
            disabled={!hasChanges}
            onClick={() => form.submit()}
          >
            Save All Settings
          </Button>
        </Space>
      </div>

      {hasChanges && (
        <Alert
          message="Unsaved Changes"
          description="You have unsaved configuration changes. Click 'Save All Settings' to apply them."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Form
        form={form}
        onFinish={handleSave}
        onValuesChange={handleValuesChange}
        layout="vertical"
        initialValues={settings}
      >
        <Card>
          <Tabs defaultActiveKey="security" items={tabItems} />
        </Card>
      </Form>
    </div>
  );
}
