"use client";

import React, { useState } from "react";
import { Card, Input, Button, message, Form, Typography } from "antd";
import { KeyOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function CustomerPortalDebug() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values) => {
    console.log("Login attempt with values:", values);
    setLoading(true);

    try {
      console.log("Sending API request...");
      const response = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_with_key",
          apiKey: values.apiKey,
        }),
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        console.log("Login successful! Tenant:", data.tenant);
        message.success("Login successful!");
        // Redirect to a working page for now
        window.location.href = "/admin";
      } else {
        console.error("Login failed:", data.error);
        message.error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Login failed - check console");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Card style={{ width: "100%", maxWidth: "500px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title level={1}>GovernAPI Debug Login</Title>
          <Text>Testing customer portal login</Text>
        </div>

        <Form onFinish={handleLogin} layout="vertical">
          <Form.Item
            name="apiKey"
            label="API Key"
            rules={[{ required: true, message: "Please enter API key" }]}
          >
            <Input
              prefix={<KeyOutlined />}
              placeholder="gapi_hx6zmpncm6j"
              size="large"
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Test Login
            </Button>
          </Form.Item>
        </Form>

        <div
          style={{
            marginTop: 24,
            padding: 16,
            background: "#f5f5f5",
            borderRadius: 4,
          }}
        >
          <Text strong>Debug Info:</Text>
          <div>API URL: /api/customer/auth</div>
          <div>Test Key: gapi_hx6zmpncm6j</div>
          <div>Check browser console for detailed logs</div>
        </div>
      </Card>
    </div>
  );
}
