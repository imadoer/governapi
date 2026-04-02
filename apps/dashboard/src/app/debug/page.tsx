"use client";

import React, { useState } from "react";
import { Card, Input, Button, message, Form, Typography } from "antd";
import { KeyOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function DebugLogin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  const handleLogin = async (values: any) => {
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_with_key",
          apiKey: values.apiKey,
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));

      if (data.success) {
        message.success("API call successful!");
      } else {
        message.error("API returned error");
      }
    } catch (error) {
      setResult("Error: " + (error as Error)?.message);
      message.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>Customer Auth Debug</Title>

      <Card style={{ marginBottom: 24 }}>
        <Form onFinish={handleLogin} layout="inline">
          <Form.Item name="apiKey" rules={[{ required: true }]}>
            <Input placeholder="gapi_hx6zmpncm6j" style={{ width: 300 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Test Login API
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {result && (
        <Card title="API Response">
          <pre style={{ background: "#f5f5f5", padding: 16, borderRadius: 4 }}>
            {result}
          </pre>
        </Card>
      )}
    </div>
  );
}
