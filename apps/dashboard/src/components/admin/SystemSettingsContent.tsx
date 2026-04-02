"use client";

import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Switch,
  Button,
  Space,
  Typography,
  InputNumber,
  Select,
  message,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import AdminLayout from "./AdminLayout";

const { Title, Text } = Typography;
const { Option } = Select;

function SystemSettingsContent() {
  const [saving, setSaving] = useState(false);

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success("System settings updated successfully!");
      } else {
        message.error("Failed to save settings");
      }
    } catch (error) {
      message.error("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout currentPage="settings">
      <div>
        <div style={{ marginBottom: 24 }}>
          <Title level={2}>System Settings</Title>
          <Text type="secondary">
            Configure global system parameters and operational settings
          </Text>
        </div>

        <Form
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            rateLimitEnabled: true,
            globalRateLimit: 1000,
            threatDetectionEnabled: true,
            autoBlockEnabled: true,
            sessionTimeout: 24,
            logRetention: 90,
            timezone: "UTC",
          }}
        >
          <Card title="Security Settings" style={{ marginBottom: 16 }}>
            <Form.Item name="threatDetectionEnabled" valuePropName="checked">
              <div>
                <Text strong>Enable Threat Detection</Text>
                <div style={{ marginTop: 8 }}>
                  <Switch defaultChecked />
                </div>
              </div>
            </Form.Item>

            <Form.Item name="autoBlockEnabled" valuePropName="checked">
              <div>
                <Text strong>Auto-Block Suspicious IPs</Text>
                <div style={{ marginTop: 8 }}>
                  <Switch defaultChecked />
                </div>
              </div>
            </Form.Item>

            <Form.Item label="Session Timeout (hours)" name="sessionTimeout">
              <InputNumber
                min={1}
                max={168}
                defaultValue={24}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Card>

          <Card title="Rate Limiting" style={{ marginBottom: 16 }}>
            <Form.Item name="rateLimitEnabled" valuePropName="checked">
              <div>
                <Text strong>Enable Global Rate Limiting</Text>
                <div style={{ marginTop: 8 }}>
                  <Switch defaultChecked />
                </div>
              </div>
            </Form.Item>

            <Form.Item
              label="Default Rate Limit (requests/minute)"
              name="globalRateLimit"
            >
              <InputNumber
                min={10}
                max={10000}
                defaultValue={1000}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Card>

          <Card title="System Configuration" style={{ marginBottom: 16 }}>
            <Form.Item label="Log Retention Period (days)" name="logRetention">
              <InputNumber
                min={7}
                max={365}
                defaultValue={90}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item label="System Timezone" name="timezone">
              <Select defaultValue="UTC" style={{ width: "100%" }}>
                <Option value="UTC">UTC</Option>
                <Option value="America/New_York">Eastern Time</Option>
                <Option value="America/Los_Angeles">Pacific Time</Option>
                <Option value="Europe/London">London Time</Option>
              </Select>
            </Form.Item>
          </Card>

          <div style={{ textAlign: "right" }}>
            <Space>
              <Button>Reset to Defaults</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<SaveOutlined />}
              >
                Save Settings
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </AdminLayout>
  );
}

export default SystemSettingsContent;
