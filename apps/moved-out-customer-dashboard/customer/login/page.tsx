"use client";

import React, { useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  Tabs,
  message,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Text, Link } = Typography;

export default function CustomerLogin() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(`Welcome back, ${data.user.firstName}!`);
        router.push("/customer/dashboard");
      } else {
        message.error(data.error || "Login failed");
      }
    } catch (error) {
      message.error("Login failed. Please try again.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (data.success) {
        message.success(`Welcome to GovernAPI, ${data.user.firstName}!`);
        router.push("/customer/dashboard");
      } else {
        message.error(data.error || "Registration failed");
      }
    } catch (error) {
      message.error("Registration failed. Please try again.");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: "login",
      label: "Sign In",
      children: (
        <Form onFinish={handleLogin} layout="vertical" size="large">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email address" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please enter your password" }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Password" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              Sign In to Dashboard
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center" }}>
            <Link href="#" style={{ color: "#1890ff" }}>
              Forgot your password?
            </Link>
          </div>
        </Form>
      ),
    },
    {
      key: "register",
      label: "Create Account",
      children: (
        <Form onFinish={handleRegister} layout="vertical" size="large">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="firstName"
                rules={[{ required: true, message: "First name required" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="First name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="lastName"
                rules={[{ required: true, message: "Last name required" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="Last name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Please enter a valid email" },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email address" />
          </Form.Item>

          <Form.Item
            name="companyName"
            rules={[{ required: true, message: "Company name required" }]}
          >
            <Input prefix={<BankOutlined />} placeholder="Company name" />
          </Form.Item>

          <Form.Item name="domain">
            <Input
              prefix={<BankOutlined />}
              placeholder="Company domain (optional)"
              addonBefore="https://"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: "Please enter a password" },
              { min: 8, message: "Password must be at least 8 characters" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Password (min 8 characters)"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Confirm password"
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
              Create Enterprise Account
            </Button>
          </Form.Item>

          <div style={{ textAlign: "center", fontSize: 12, color: "#666" }}>
            By creating an account, you agree to our Terms of Service and
            Privacy Policy
          </div>
        </Form>
      ),
    },
  ];

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
      <Card
        style={{
          width: "100%",
          maxWidth: "500px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Title
            level={1}
            style={{
              marginBottom: 8,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            GovernAPI
          </Title>
          <Text type="secondary" style={{ fontSize: "16px" }}>
            Enterprise API Security Platform
          </Text>
        </div>

        <Tabs defaultActiveKey="login" items={tabItems} centered />
      </Card>
    </div>
  );
}
