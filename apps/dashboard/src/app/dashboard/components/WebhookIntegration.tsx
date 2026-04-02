"use client";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Switch,
  Tag,
  message,
  Space,
  Typography,
  Modal,
} from "antd";
import { useState, useEffect } from "react";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  createdAt: string;
  lastTriggered?: string;
}

interface WebhookFormValues {
  name: string;
  url: string;
  events: string[];
  secret?: string;
}

export function WebhookIntegration() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/webhooks");
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      message.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: WebhookFormValues) => {
    try {
      const method = editingWebhook ? "PUT" : "POST";
      const url = editingWebhook
        ? `/api/webhooks/${editingWebhook.id}`
        : "/api/webhooks";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(
          `Webhook ${editingWebhook ? "updated" : "created"} successfully`,
        );
        setModalVisible(false);
        setEditingWebhook(null);
        form.resetFields();
        fetchWebhooks();
      } else {
        message.error("Failed to save webhook");
      }
    } catch (error) {
      console.error("Error saving webhook:", error);
      message.error("Error saving webhook");
    }
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    form.setFieldsValue(webhook);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        message.success("Webhook deleted successfully");
        fetchWebhooks();
      } else {
        message.error("Failed to delete webhook");
      }
    } catch (error) {
      console.error("Error deleting webhook:", error);
      message.error("Error deleting webhook");
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (response.ok) {
        message.success(`Webhook ${!isActive ? "enabled" : "disabled"}`);
        fetchWebhooks();
      } else {
        message.error("Failed to update webhook");
      }
    } catch (error) {
      console.error("Error updating webhook:", error);
      message.error("Error updating webhook");
    }
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      render: (url: string) => (
        <Text code style={{ fontSize: "12px" }}>
          {url.length > 50 ? `${url.substring(0, 50)}...` : url}
        </Text>
      ),
    },
    {
      title: "Events",
      dataIndex: "events",
      key: "events",
      render: (events: string[]) => (
        <div>
          {events.slice(0, 2).map((event: string) => (
            <Tag key={event}>{event}</Tag>
          ))}
          {events.length > 2 && <Tag>+{events.length - 2} more</Tag>}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean, record: Webhook) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggle(record.id, isActive)}
          checkedChildren="Active"
          unCheckedChildren="Disabled"
        />
      ),
    },
    {
      title: "Last Triggered",
      dataIndex: "lastTriggered",
      key: "lastTriggered",
      render: (lastTriggered: string) => (
        <Text type="secondary">
          {lastTriggered
            ? new Date(lastTriggered).toLocaleDateString()
            : "Never"}
        </Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Webhook) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const eventOptions = [
    "user.created",
    "user.updated",
    "user.deleted",
    "security.alert",
    "api.limit.exceeded",
    "compliance.violation",
    "threat.detected",
    "system.error",
  ];

  return (
    <Card
      title={
        <Space>
          <LinkOutlined />
          <Title level={4} style={{ margin: 0 }}>
            Webhook Integration
          </Title>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingWebhook(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Add Webhook
        </Button>
      }
    >
      <Table
        columns={columns}
        dataSource={webhooks}
        loading={loading}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
      />

      <Modal
        title={`${editingWebhook ? "Edit" : "Add"} Webhook`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingWebhook(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Webhook Name"
            name="name"
            rules={[{ required: true, message: "Please enter webhook name" }]}
          >
            <Input placeholder="Enter webhook name" />
          </Form.Item>

          <Form.Item
            label="Webhook URL"
            name="url"
            rules={[
              { required: true, message: "Please enter webhook URL" },
              { type: "url", message: "Please enter a valid URL" },
            ]}
          >
            <Input placeholder="https://your-domain.com/webhook" />
          </Form.Item>

          <Form.Item
            label="Events"
            name="events"
            rules={[
              { required: true, message: "Please select at least one event" },
            ]}
          >
            <Select
              mode="multiple"
              placeholder="Select events to trigger webhook"
            >
              {eventOptions.map((event) => (
                <Option key={event} value={event}>
                  {event}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Secret (Optional)" name="secret">
            <Input.Password placeholder="Webhook secret for verification" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingWebhook ? "Update" : "Create"} Webhook
              </Button>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
