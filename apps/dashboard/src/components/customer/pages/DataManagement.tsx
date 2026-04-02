"use client";
import * as React from "react";
import { useState } from "react";
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Row,
  Col,
  Progress,
  Statistic,
  Upload,
  Tabs,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  ExportOutlined,
  FileTextOutlined,
  CloudDownloadOutlined,
  DatabaseOutlined,
  UploadOutlined,
  ScheduleOutlined,
  HistoryOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

export default function DataManagement({ stats, refreshData, refreshing }) {
  const [exportModal, setExportModal] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState("json");
  const [activeTab, setActiveTab] = useState("exports");
  const [form] = Form.useForm();

  // Mock data for exports history
  const exportHistory = [
    {
      id: "1",
      type: "Security Logs",
      format: "CSV",
      size: "2.3 MB",
      date: "2024-10-07 14:30",
      status: "completed",
      downloadUrl: "#",
    },
    {
      id: "2",
      type: "API Analytics",
      format: "JSON",
      size: "856 KB",
      date: "2024-10-06 09:15",
      status: "completed",
      downloadUrl: "#",
    },
    {
      id: "3",
      type: "Threat Intelligence",
      format: "Excel",
      size: "4.1 MB",
      date: "2024-10-05 16:42",
      status: "processing",
      downloadUrl: null,
    },
    {
      id: "4",
      type: "Compliance Report",
      format: "PDF",
      size: "1.8 MB",
      date: "2024-10-04 11:20",
      status: "completed",
      downloadUrl: "#",
    },
  ];

  const dataCategories = [
    {
      name: "Security Logs",
      description:
        "Security events, threat detection logs, and incident reports",
      size: "156.3 MB",
      records: "1,245,678",
      retention: "90 days",
    },
    {
      name: "API Analytics",
      description:
        "API usage statistics, performance metrics, and traffic data",
      size: "89.7 MB",
      records: "987,432",
      retention: "365 days",
    },
    {
      name: "User Activity",
      description: "User access logs, authentication events, and audit trails",
      size: "45.2 MB",
      records: "567,890",
      retention: "180 days",
    },
    {
      name: "Configuration Data",
      description: "System settings, rules, and configuration changes",
      size: "12.1 MB",
      records: "23,456",
      retention: "Indefinite",
    },
  ];

  const exportColumns = [
    {
      title: "Export Type",
      dataIndex: "type",
      key: "type",
      render: (type) => (
        <Space>
          <FileTextOutlined />
          <Text strong>{type}</Text>
        </Space>
      ),
    },
    {
      title: "Format",
      dataIndex: "format",
      key: "format",
      render: (format) => <Tag color="blue">{format}</Tag>,
    },
    {
      title: "Size",
      dataIndex: "size",
      key: "size",
    },
    {
      title: "Created",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "completed"
              ? "green"
              : status === "processing"
                ? "orange"
                : "red"
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          {record.status === "completed" ? (
            <Button
              type="primary"
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => message.success("Download started")}
            >
              Download
            </Button>
          ) : (
            <Button size="small" disabled>
              {record.status === "processing" ? "Processing..." : "Failed"}
            </Button>
          )}
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => message.success("Export deleted")}
          />
        </Space>
      ),
    },
  ];

  const handleExport = (values) => {
    console.log("Export request:", values);
    message.success("Export request submitted successfully");
    setExportModal(false);
    form.resetFields();
  };

  const tabItems = [
    {
      key: "exports",
      label: "Data Exports",
      children: (
        <div>
          <Card style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <Title level={4} style={{ margin: 0 }}>
                  Export Your Data
                </Title>
                <Text type="secondary">
                  Download your security data in various formats for analysis
                  and compliance
                </Text>
              </div>
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={() => setExportModal(true)}
              >
                Create Export
              </Button>
            </div>
          </Card>

          <Card
            title="Export History"
            extra={
              <Button onClick={refreshData} loading={refreshing}>
                Refresh
              </Button>
            }
          >
            <Table
              columns={exportColumns}
              dataSource={exportHistory}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: "categories",
      label: "Data Categories",
      children: (
        <Row gutter={[16, 16]}>
          {dataCategories.map((category, index) => (
            <Col xs={24} lg={12} key={index}>
              <Card>
                <div style={{ marginBottom: 16 }}>
                  <Title level={5} style={{ margin: 0 }}>
                    {category.name}
                  </Title>
                  <Paragraph type="secondary" style={{ marginBottom: 8 }}>
                    {category.description}
                  </Paragraph>
                </div>

                <Row gutter={16}>
                  <Col span={8}>
                    <Statistic
                      title="Size"
                      value={category.size}
                      prefix={<DatabaseOutlined />}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Records" value={category.records} />
                  </Col>
                  <Col span={8}>
                    <div>
                      <Text type="secondary">Retention</Text>
                      <div style={{ fontWeight: "bold" }}>
                        {category.retention}
                      </div>
                    </div>
                  </Col>
                </Row>

                <div style={{ marginTop: 16 }}>
                  <Progress
                    percent={stats?.exportProgress || 75}
                    strokeColor="#1890ff"
                    format={(percent) => `${percent}% of limit`}
                  />
                </div>

                <div style={{ marginTop: 16 }}>
                  <Space>
                    <Button size="small" icon={<ExportOutlined />}>
                      Export
                    </Button>
                    <Button size="small" icon={<HistoryOutlined />}>
                      View History
                    </Button>
                  </Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      ),
    },
    {
      key: "import",
      label: "Data Import",
      children: (
        <Card
          title="Import Data"
          extra={
            <Text type="secondary">
              Upload configuration files or bulk data
            </Text>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card size="small" title="Configuration Import">
                <Paragraph>
                  Import security rules, API configurations, or system settings
                  from JSON/YAML files.
                </Paragraph>
                <Upload.Dragger>
                  <div style={{ padding: 20 }}>
                    <UploadOutlined
                      style={{ fontSize: 32, color: "#1890ff" }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text>Click or drag configuration files to upload</Text>
                    </div>
                    <Text type="secondary">
                      Supports JSON, YAML, XML formats
                    </Text>
                  </div>
                </Upload.Dragger>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card size="small" title="Bulk Data Import">
                <Paragraph>
                  Import large datasets, security logs, or analytical data from
                  CSV/Excel files.
                </Paragraph>
                <Upload.Dragger>
                  <div style={{ padding: 20 }}>
                    <DatabaseOutlined
                      style={{ fontSize: 32, color: "#52c41a" }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <Text>Click or drag data files to upload</Text>
                    </div>
                    <Text type="secondary">
                      Supports CSV, Excel, TSV formats
                    </Text>
                  </div>
                </Upload.Dragger>
              </Card>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
          Data Management
        </Title>
        <Paragraph
          style={{
            marginTop: 8,
            marginBottom: 0,
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          Export, import, and manage your enterprise security data. Download
          reports, configure data retention policies, and maintain compliance
          with comprehensive data management tools.
        </Paragraph>
      </div>

      {/* Data Overview Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Data Size"
              value="303.3"
              suffix="MB"
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Exports"
              value={
                exportHistory.filter((e) => e.status === "processing").length
              }
              prefix={<ExportOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Completed Exports"
              value={
                exportHistory.filter((e) => e.status === "completed").length
              }
              prefix={<CloudDownloadOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Retention Days"
              value="180"
              suffix="avg"
              prefix={<ScheduleOutlined />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Export Modal */}
      <Modal
        title="Create Data Export"
        open={exportModal}
        onCancel={() => setExportModal(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleExport}>
          <Form.Item
            name="dataType"
            label="Data Type"
            rules={[{ required: true, message: "Please select data type" }]}
          >
            <Select placeholder="Select data to export">
              <Option value="security">Security Logs</Option>
              <Option value="analytics">API Analytics</Option>
              <Option value="threats">Threat Intelligence</Option>
              <Option value="compliance">Compliance Data</Option>
              <Option value="user-activity">User Activity</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="format"
            label="Export Format"
            rules={[{ required: true, message: "Please select format" }]}
          >
            <Select placeholder="Select export format">
              <Option value="json">JSON</Option>
              <Option value="csv">CSV</Option>
              <Option value="excel">Excel</Option>
              <Option value="pdf">PDF Report</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="Date Range"
            rules={[{ required: true, message: "Please select date range" }]}
          >
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item name="includeMetadata" valuePropName="checked">
            <Space>
              <Text>Include metadata and system information</Text>
            </Space>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Export
              </Button>
              <Button onClick={() => setExportModal(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
