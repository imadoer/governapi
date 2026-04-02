import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Modal,
  List,
  message,
  Switch,
} from "antd";
import { DeleteOutlined, ScanOutlined } from "@ant-design/icons";

interface Integration {
  id: number;
  type: string;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export default function IntegrationManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const response = await fetch("/api/customer/external-integrations");
      const data = await response.json();
      if (data.success) {
        setIntegrations(data.integrations);
      }
    } catch (error) {
      message.error("Failed to fetch integrations");
    }
  };

  const addIntegration = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/external-integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json();
      if (data.success) {
        message.success("Integration added successfully");
        setIsModalOpen(false);
        form.resetFields();
        fetchIntegrations();
      } else {
        message.error(data.error || "Failed to add integration");
      }
    } catch (error) {
      message.error("Failed to add integration");
    } finally {
      setLoading(false);
    }
  };

  const deleteIntegration = async (id: number) => {
    try {
      const response = await fetch(
        `/api/customer/external-integrations/${id}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        message.success("Integration deleted");
        fetchIntegrations();
      } else {
        message.error("Failed to delete integration");
      }
    } catch (error) {
      message.error("Failed to delete integration");
    }
  };

  const scanIntegration = async (type: string) => {
    try {
      const response = await fetch("/api/customer/scan-external", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrationType: type }),
      });

      const data = await response.json();
      if (data.success) {
        message.success(
          `Scan completed: ${data.result.summary.totalApis} APIs found`,
        );
      } else {
        message.error(data.error || "Scan failed");
      }
    } catch (error) {
      message.error("Scan failed");
    }
  };

  return (
    <Card
      title="External Integrations"
      extra={
        <Button type="primary" onClick={() => setIsModalOpen(true)}>
          Add Integration
        </Button>
      }
    >
      <List
        dataSource={integrations}
        renderItem={(integration) => (
          <List.Item
            actions={[
              <Button
                key="scan"
                icon={<ScanOutlined />}
                onClick={() => scanIntegration(integration.type)}
              >
                Scan
              </Button>,
              <Button
                key="delete"
                danger
                icon={<DeleteOutlined />}
                onClick={() => deleteIntegration(integration.id)}
              >
                Delete
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={`${integration.name} (${integration.type.toUpperCase()})`}
              description={`Last used: ${integration.lastUsed ? new Date(integration.lastUsed).toLocaleDateString() : "Never"}`}
            />
            <Switch checked={integration.isActive} disabled />
          </List.Item>
        )}
      />

      <Modal
        title="Add External Integration"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form form={form} onFinish={addIntegration} layout="vertical">
          <Form.Item
            name="integrationType"
            label="Platform"
            rules={[{ required: true }]}
          >
            <Select placeholder="Select platform">
              <Select.Option value="aws">AWS</Select.Option>
              <Select.Option value="azure">Azure</Select.Option>
              <Select.Option value="gcp">Google Cloud</Select.Option>
              <Select.Option value="stripe">Stripe</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="integrationName"
            label="Integration Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Production AWS Account" />
          </Form.Item>

          <Form.Item
            name={["credentials", "accessKey"]}
            label="Access Key"
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="Your access key" />
          </Form.Item>

          <Form.Item
            name={["credentials", "secretKey"]}
            label="Secret Key"
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="Your secret key" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Add Integration
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
