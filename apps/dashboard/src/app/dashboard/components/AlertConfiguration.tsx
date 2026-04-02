"use client";

import { Card, Form, Input, Select, Button, Table, message } from "antd";
import { useState, useEffect } from "react";

export function AlertConfiguration() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      setConfigs(data.alert_configs || []);
    } catch (error) {
      console.error("Failed to fetch alert configs:", error);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success("Alert configuration saved successfully");
        form.resetFields();
        fetchConfigs();
      } else {
        message.error("Failed to save alert configuration");
      }
    } catch (error) {
      message.error("Error saving configuration");
    }
    setLoading(false);
  };

  const testAlerts = async () => {
    try {
      const response = await fetch("/api/notifications/monitor", {
        method: "POST",
      });
      const data = await response.json();

      if (data.alerts_sent > 0) {
        message.success(
          `${data.alerts_sent} alert(s) sent based on latest scan results`,
        );
      } else {
        message.info(
          "No alerts triggered - run a security scan first or adjust threshold",
        );
      }
    } catch (error) {
      message.error("Failed to test alerts");
    }
  };

  const columns = [
    { title: "Email", dataIndex: "email" },
    { title: "Threshold", dataIndex: "severity_threshold" },
    {
      title: "Status",
      dataIndex: "enabled",
      render: (enabled: boolean) => (enabled ? "Active" : "Disabled"),
    },
    {
      title: "Created",
      dataIndex: "created_at",
      render: (date: any) => new Date(date).toLocaleString(),
    },
  ];

  return (
    <Card title="Security Alert Configuration">
      <Form form={form} onFinish={handleSubmit} layout="vertical">
        <Form.Item
          label="Email Address"
          name="email"
          rules={[
            { required: true, message: "Email address is required" },
            { type: "email", message: "Please enter a valid email address" },
          ]}
        >
          <Input placeholder="alerts@company.com" />
        </Form.Item>

        <Form.Item
          label="Alert Threshold"
          name="severity_threshold"
          initialValue="HIGH"
        >
          <Select>
            <Select.Option value="CRITICAL">Critical Only</Select.Option>
            <Select.Option value="HIGH">High & Critical</Select.Option>
            <Select.Option value="MEDIUM">Medium & Above</Select.Option>
            <Select.Option value="LOW">All Vulnerabilities</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Configure Alerts
          </Button>
          <Button style={{ marginLeft: 8 }} onClick={testAlerts}>
            Test Alerts
          </Button>
        </Form.Item>
      </Form>

      <div style={{ marginTop: 24 }}>
        <h4>Active Alert Configurations</h4>
        <Table
          dataSource={configs}
          columns={columns}
          size="small"
          pagination={false}
        />
      </div>
    </Card>
  );
}
