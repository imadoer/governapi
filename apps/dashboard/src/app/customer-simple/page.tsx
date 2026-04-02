"use client";

import React, { useState } from "react";
import { Card, Input, Button, message, Form, Typography, Layout } from "antd";
import { KeyOutlined, UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

export default function SimpleCustomerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (values: any) => {
    setLoading(true);
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

      if (data.success) {
        setCustomer(data.tenant);
        setIsLoggedIn(true);
        message.success("Login successful!");
      } else {
        message.error(data.error || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
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
        <Card style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <Title level={2}>GovernAPI Login</Title>
          </div>

          <Form onFinish={handleLogin} layout="vertical">
            <Form.Item
              name="apiKey"
              label="API Key"
              rules={[{ required: true }]}
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
                Login
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          background: "#001529",
          color: "white",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Title level={3} style={{ color: "white", margin: 0 }}>
          GovernAPI Dashboard
        </Title>
        <div style={{ marginLeft: "auto" }}>
          <Text style={{ color: "white", marginRight: 16 }}>
            Welcome, {customer?.name}
          </Text>
          <Button onClick={() => setIsLoggedIn(false)}>Logout</Button>
        </div>
      </Header>

      <Content style={{ padding: "24px" }}>
        <Card title="Customer Dashboard">
          <div>
            <p>
              <strong>Name:</strong> {customer?.name}
            </p>
            <p>
              <strong>Email:</strong> {customer?.email}
            </p>
            <p>
              <strong>API Key:</strong> {customer?.apiKey}
            </p>
            <p>
              <strong>Customer ID:</strong> {customer?.id}
            </p>
          </div>
          <div style={{ marginTop: 24 }}>
            <Button type="primary" href="/customer">
              Go to Full Dashboard
            </Button>
          </div>
        </Card>
      </Content>
    </Layout>
  );
}
