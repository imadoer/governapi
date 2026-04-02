"use client";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  message,
} from "antd";
import { useState, useEffect } from "react";

const { Option } = Select;

interface DiscoveredAPI {
  id: string;
  url: string;
  type: string;
  method: string;
  status: string;
  responseTime?: number;
  lastSeen?: string;
  version?: string;
  authentication?: string;
}

interface APIStats {
  totalAPIs?: number;
  activeAPIs?: number;
  publicAPIs?: number;
  privateAPIs?: number;
}

interface ScanFormValues {
  target: string;
  scanType: string;
  depth?: string;
}

export function APIDiscovery() {
  const [discoveredAPIs, setDiscoveredAPIs] = useState<DiscoveredAPI[]>([]);
  const [stats, setStats] = useState<APIStats>({});
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchDiscoveredAPIs();
  }, []);

  const fetchDiscoveredAPIs = async () => {
    try {
      const response = await fetch("/api/discovery");
      const data = await response.json();
      setDiscoveredAPIs(data.apis || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error("Error fetching discovered APIs:", error);
      message.error("Failed to load discovered APIs");
    }
  };

  const handleStartScan = async (values: ScanFormValues) => {
    setLoading(true);
    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target: values.target,
          scanType: values.scanType,
          depth: values.depth || "shallow",
        }),
      });

      if (response.ok) {
        message.success("API discovery scan started successfully!");
        await fetchDiscoveredAPIs();
      } else {
        message.error("Failed to start discovery scan");
      }
    } catch (error) {
      console.error("Discovery scan error:", error);
      message.error("Error starting discovery scan");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "green",
      inactive: "red",
      unknown: "orange",
      deprecated: "gray",
    };
    return colors[status as keyof typeof colors] || "default";
  };

  const getTypeColor = (type: string) => {
    const colors = {
      REST: "blue",
      GraphQL: "purple",
      SOAP: "orange",
      WebSocket: "green",
    };
    return colors[type as keyof typeof colors] || "default";
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "blue",
      POST: "green",
      PUT: "orange",
      DELETE: "red",
    };
    return colors[method as keyof typeof colors] || "default";
  };

  const columns = [
    {
      title: "URL",
      dataIndex: "url",
      key: "url",
      width: "30%",
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer">
          {url}
        </a>
      ),
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
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color={getTypeColor(type)}>{type}</Tag>,
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
      title: "Response Time",
      dataIndex: "responseTime",
      key: "responseTime",
      render: (time: number) => (time ? `${time}ms` : "N/A"),
    },
    {
      title: "Last Seen",
      dataIndex: "lastSeen",
      key: "lastSeen",
      render: (date: string) =>
        date ? new Date(date).toLocaleDateString() : "N/A",
    },
    {
      title: "Version",
      dataIndex: "version",
      key: "version",
      render: (version: string) => version || "Unknown",
    },
    {
      title: "Auth",
      dataIndex: "authentication",
      key: "authentication",
      render: (auth: string) => (
        <Tag color={auth ? "green" : "red"}>{auth || "None"}</Tag>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total APIs"
              value={stats.totalAPIs || 0}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Active APIs"
              value={stats.activeAPIs || 0}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Public APIs"
              value={stats.publicAPIs || 0}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Private APIs"
              value={stats.privateAPIs || 0}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24}>
          <Card title="Start API Discovery Scan">
            <Form form={form} onFinish={handleStartScan} layout="inline">
              <Form.Item
                name="target"
                rules={[
                  { required: true, message: "Please enter target domain" },
                ]}
              >
                <Input
                  placeholder="Enter target domain or IP"
                  style={{ width: 200 }}
                />
              </Form.Item>

              <Form.Item
                name="scanType"
                rules={[{ required: true, message: "Please select scan type" }]}
              >
                <Select placeholder="Select scan type" style={{ width: 150 }}>
                  <Option value="shallow">Shallow Scan</Option>
                  <Option value="deep">Deep Scan</Option>
                  <Option value="comprehensive">Comprehensive</Option>
                </Select>
              </Form.Item>

              <Form.Item name="depth">
                <Select placeholder="Depth" style={{ width: 120 }}>
                  <Option value="1">Level 1</Option>
                  <Option value="2">Level 2</Option>
                  <Option value="3">Level 3</Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Start Scan
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Discovered APIs">
            <Table
              columns={columns}
              dataSource={discoveredAPIs}
              loading={loading}
              rowKey="id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
