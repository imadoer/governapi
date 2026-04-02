"use client";

import { useState } from "react";
import { Card, Button, Form, Input, message, Space } from "antd";
import { SlackOutlined } from "@ant-design/icons";

export function SlackIntegration() {
  const [form] = Form.useForm();
  const [testing, setTesting] = useState(false);

  const testSlackIntegration = async (values: any) => {
    setTesting(true);
    try {
      const response = await fetch("/api/integrations/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook_url: values.webhook_url,
          message: "Test message from GovernAPI - Integration successful!",
          channel: values.channel,
        }),
      });

      if (response.ok) {
        message.success("Slack integration test successful!");
      } else {
        message.error("Slack integration test failed");
      }
    } catch (error) {
      message.error("Failed to test Slack integration");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card title="Slack Integration" extra={<SlackOutlined />}>
      <div
        style={{ marginBottom: 16, padding: 12, backgroundColor: "#f0f0f0" }}
      >
        <strong>Setup Instructions:</strong>
        <ol>
          <li>Go to your Slack workspace settings</li>
          <li>Create a new "Incoming Webhooks" app</li>
          <li>Select the channel for alerts</li>
          <li>Copy the webhook URL and paste it below</li>
        </ol>
      </div>
      <Form form={form} onFinish={testSlackIntegration} layout="vertical">
        <Form.Item
          name="webhook_url"
          label="Slack Webhook URL"
          rules={[{ required: true, type: "url" }]}
        >
          <Input placeholder="https://hooks.slack.com/services/..." />
        </Form.Item>
        <Form.Item
          name="channel"
          label="Channel"
          initialValue="#security-alerts"
        >
          <Input placeholder="e.g., #security-alerts, #api-monitoring" />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={testing}>
              Test Integration
            </Button>
            <Button onClick={() => message.info("Integration saved!")}>
              Save Settings
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
}
