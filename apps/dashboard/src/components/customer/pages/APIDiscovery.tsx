"use client";
import * as React from "react";
import { useState } from "react";
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Form,
  Input,
  Select,
  Modal,
  message,
  Progress,
  Statistic,
} from "antd";
import {
  GlobalOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  EyeOutlined,
  ApiOutlined,
} from "@ant-design/icons";

const { Title } = Typography;
const { Option } = Select;

interface APIEndpoint {
  id: string;
  url: string;
  method: string;
  status: string;
  responseTime?: number;
  securityScore?: number;
}

interface DiscoveryFormValues {
  target: string;
  scanType: string;
}

interface APIDiscoveryProps {
  apiEndpoints: APIEndpoint[];
  loading: boolean;
}

export default function APIDiscovery({
  apiEndpoints,
  loading,
}: APIDiscoveryProps) {
  const [discoveryModal, setDiscoveryModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [form] = Form.useForm();

  const handleStartDiscovery = async (values: DiscoveryFormValues) => {
    setScanning(true);
    try {
      const response = await fetch("/api/customer/api-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: values.target,
          scanType: values.scanType,
        }),
      });

      if (response.ok) {
        message.success("API discovery scan started!");
      } else {
        message.error("Failed to start discovery scan");
      }
    } catch (error) {
      console.error("Discovery error:", error);
      message.error("Error starting discovery scan");
    } finally {
      setScanning(false);
      setDiscoveryModal(false);
    }
  };

  const getMethodColor = (method: string) => {
    const colors = { GET: "blue", POST: "green", PUT: "orange", DELETE: "red" };
    return colors[method as keyof typeof colors] || "default";
  };

  const getStatusColor = (status: string) => {
    const colors = { active: "green", deprecated: "red", testing: "orange" };
    return colors[status as keyof typeof colors] || "default";
  };

  const columns = [
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
    },
    {
      title: "Method",
      dataIndex: "method",
      key: "method",
      render: (method: string) => (
        <Tag color={getMethodColor(method)}>{method}</Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Security Score",
      dataIndex: "securityScore",
      key: "securityScore",
      render: (score: number) => score || "N/A",
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card>
            <Title level={3}>
              <GlobalOutlined /> API Discovery
            </Title>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card
            title="API Discovery"
            extra={
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={() => setDiscoveryModal(true)}
              >
                Start Discovery
              </Button>
            }
          >
            <Table
              columns={columns}
              dataSource={apiEndpoints}
              loading={loading}
              rowKey="id"
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Start API Discovery"
        open={discoveryModal}
        onCancel={() => setDiscoveryModal(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleStartDiscovery} layout="vertical">
          <Form.Item
            label="Target"
            name="target"
            rules={[{ required: true, message: "Please enter target" }]}
          >
            <Input placeholder="Enter target domain" />
          </Form.Item>

          <Form.Item
            label="Scan Type"
            name="scanType"
            rules={[{ required: true, message: "Please select scan type" }]}
          >
            <Select placeholder="Select scan type">
              <Option value="shallow">Shallow Scan</Option>
              <Option value="deep">Deep Scan</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={scanning}>
                Start Discovery
              </Button>
              <Button onClick={() => setDiscoveryModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
