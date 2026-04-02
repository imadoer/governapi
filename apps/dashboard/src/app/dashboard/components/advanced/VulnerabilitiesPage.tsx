"use client";
import React, { useState, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Tag,
  Space,
  Table,
  Progress,
  Tabs,
  Drawer,
  Descriptions,
  Timeline,
  Select,
  Input,
  Badge,
  Alert,
  Modal,
  Form,
  message,
  Tooltip,
  Statistic,
  Empty,
  Divider,
} from "antd";
import {
  BugOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ApiOutlined,
  CodeOutlined,
  SafetyCertificateOutlined,
  FileTextOutlined,
  LinkOutlined,
  ReloadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  GlobalOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";

const { Title, Paragraph, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ==================== TYPES ====================

interface Vulnerability {
  id: number;
  title: string;
  vulnerability_type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cvss_score?: number;
  cwe_id?: string;
  affected_url?: string;
  affected_parameter?: string;
  description?: string;
  evidence?: string;
  remediation?: string;
  status: "open" | "acknowledged" | "in_progress" | "resolved" | "false_positive";
  scan_id?: number;
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

interface ScanTemplate {
  id: string;
  name: string;
  description: string;
  duration: string;
  scanType: string;
}

interface OWASPCategory {
  id: string;
  name: string;
  count: number;
  severity: string;
}

// ==================== MAIN COMPONENT ====================

export function VulnerabilitiesPage({ company }) {
  // ========== STATE ==========
  const [activeTab, setActiveTab] = useState("vulnerabilities");
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<Vulnerability[]>([]);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [owaspData, setOwaspData] = useState<OWASPCategory[]>([]);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [jiraModalVisible, setJiraModalVisible] = useState(false);
  const [form] = Form.useForm();

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchVulnerabilities();
    fetchOwaspData();
  }, [company]);

  useEffect(() => {
    filterVulnerabilities();
  }, [vulnerabilities, searchText, severityFilter, statusFilter]);

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customer/vulnerabilities", {
        headers: { "x-tenant-id": company?.id || "1" },
      });
      const data = await response.json();
      if (data.success) {
        setVulnerabilities(data.vulnerabilities || []);
      }
    } catch (error) {
      console.error("Error fetching vulnerabilities:", error);
      message.error("Failed to load vulnerabilities");
    } finally {
      setLoading(false);
    }
  };

  const fetchOwaspData = async () => {
    try {
      const response = await fetch("/api/customer/vulnerabilities/owasp-breakdown", {
        headers: { "x-tenant-id": company?.id || "1" },
      });
      const data = await response.json();
      if (data.success) {
        setOwaspData(data.owaspCategories || []);
      }
    } catch (error) {
      console.error("Error fetching OWASP data:", error);
    }
  };

  const filterVulnerabilities = () => {
    let filtered = [...vulnerabilities];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(searchText.toLowerCase()) ||
          v.vulnerability_type.toLowerCase().includes(searchText.toLowerCase()) ||
          v.cwe_id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Severity filter
    if (severityFilter !== "all") {
      filtered = filtered.filter((v) => v.severity === severityFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    setFilteredVulnerabilities(filtered);
  };

  // ========== ACTIONS ==========
  const handleStatusChange = async (vulnId: number, newStatus: string, comment?: string) => {
    try {
      const response = await fetch(`/api/customer/vulnerabilities/${vulnId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": company?.id || "1",
        },
        body: JSON.stringify({ status: newStatus, comment }),
      });

      if (response.ok) {
        message.success(`Vulnerability ${newStatus.replace("_", " ")}`);
        fetchVulnerabilities();
        setWorkflowModalVisible(false);
        setDrawerVisible(false);
      } else {
        message.error("Failed to update vulnerability status");
      }
    } catch (error) {
      message.error("Failed to update vulnerability");
    }
  };

  const handleCreateJiraTicket = async (values: any) => {
    if (!selectedVulnerability) return;

    try {
      const response = await fetch("/api/integrations/jira/create-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": company?.id || "1",
        },
        body: JSON.stringify({
          vulnerabilityId: selectedVulnerability.id,
          ...values,
        }),
      });

      if (response.ok) {
        message.success("JIRA ticket created successfully");
        setJiraModalVisible(false);
        form.resetFields();
      } else {
        message.error("Failed to create JIRA ticket");
      }
    } catch (error) {
      message.error("Failed to create JIRA ticket");
    }
  };

  const handleExport = async (format: "pdf" | "json" | "csv") => {
    try {
      const response = await fetch(`/api/customer/vulnerabilities/export?format=${format}`, {
        headers: { "x-tenant-id": company?.id || "1" },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vulnerabilities_${Date.now()}.${format}`;
        a.click();
        message.success(`Vulnerabilities exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      message.error("Failed to export vulnerabilities");
    }
  };

  // ========== UTILITY FUNCTIONS ==========
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#ff4d4f";
      case "high":
        return "#fa8c16";
      case "medium":
        return "#faad14";
      case "low":
        return "#1890ff";
      case "info":
        return "#8c8c8c";
      default:
        return "#d9d9d9";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "red";
      case "acknowledged":
        return "orange";
      case "in_progress":
        return "blue";
      case "resolved":
        return "green";
      case "false_positive":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <ExclamationCircleOutlined />;
      case "acknowledged":
        return <EyeOutlined />;
      case "in_progress":
        return <ClockCircleOutlined />;
      case "resolved":
        return <CheckCircleOutlined />;
      case "false_positive":
        return <WarningOutlined />;
      default:
        return null;
    }
  };

  const calculateSLA = (createdAt: string, severity: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursOpen = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    let slaHours = 168; // 7 days default
    if (severity === "critical") slaHours = 24;
    else if (severity === "high") slaHours = 72;
    else if (severity === "medium") slaHours = 168;

    const slaRemaining = slaHours - hoursOpen;
    const slaPercent = Math.max(0, (slaRemaining / slaHours) * 100);

    return {
      remaining: slaRemaining,
      percent: slaPercent,
      breached: slaRemaining < 0,
    };
  };

  // ========== TABLE COLUMNS ==========
  const columns: ColumnsType<Vulnerability> = [
    {
      title: "Severity",
      dataIndex: "severity",
      key: "severity",
      width: 100,
      sorter: (a, b) => {
        const order = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
        return order[a.severity] - order[b.severity];
      },
      render: (severity: string) => (
        <Tag color={getSeverityColor(severity)} style={{ fontWeight: "bold" }}>
          {severity.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      ellipsis: true,
      render: (title: string, record: Vulnerability) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: "13px" }}>
            {title}
          </Text>
          <Space size="small">
            {record.cwe_id && <Tag>CWE-{record.cwe_id}</Tag>}
            {record.cvss_score && (
              <Tag color={record.cvss_score >= 7 ? "red" : "orange"}>CVSS: {record.cvss_score}</Tag>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: "Type",
      dataIndex: "vulnerability_type",
      key: "vulnerability_type",
      width: 180,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: "Affected",
      dataIndex: "affected_url",
      key: "affected_url",
      ellipsis: true,
      render: (url: string, record: Vulnerability) => (
        <Space direction="vertical" size="small">
          {url && (
            <Text code style={{ fontSize: "11px" }}>
              {url}
            </Text>
          )}
          {record.affected_parameter && (
            <Text type="secondary" style={{ fontSize: "11px" }}>
              Param: {record.affected_parameter}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.replace("_", " ").toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "SLA",
      key: "sla",
      width: 100,
      render: (_, record: Vulnerability) => {
        const sla = calculateSLA(record.created_at, record.severity);
        return (
          <Tooltip title={`${Math.abs(sla.remaining).toFixed(0)}h ${sla.breached ? "overdue" : "remaining"}`}>
            <Progress
              percent={sla.percent}
              size="small"
              strokeColor={sla.breached ? "#ff4d4f" : sla.percent < 20 ? "#fa8c16" : "#52c41a"}
              showInfo={false}
            />
          </Tooltip>
        );
      },
    },
    {
      title: "Discovered",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: "Actions",
      key: "actions",
      width: 100,
      render: (_, record: Vulnerability) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setSelectedVulnerability(record);
            setDrawerVisible(true);
          }}
        >
          Details
        </Button>
      ),
    },
  ];

  // ========== STATISTICS ==========
  const stats = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter((v) => v.severity === "critical").length,
    high: vulnerabilities.filter((v) => v.severity === "high").length,
    medium: vulnerabilities.filter((v) => v.severity === "medium").length,
    low: vulnerabilities.filter((v) => v.severity === "low").length,
    open: vulnerabilities.filter((v) => v.status === "open").length,
    acknowledged: vulnerabilities.filter((v) => v.status === "acknowledged").length,
    inProgress: vulnerabilities.filter((v) => v.status === "in_progress").length,
    resolved: vulnerabilities.filter((v) => v.status === "resolved").length,
  };

  // ========== RENDER ==========
  return (
    <div style={{ padding: "0" }}>
      {/* HEADER */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <Title level={2} style={{ margin: 0, display: "flex", alignItems: "center", gap: "12px" }}>
              <BugOutlined style={{ color: "#fa8c16" }} />
              Vulnerability Scanner
            </Title>
            <Paragraph style={{ margin: "8px 0 0 0", color: "#8c8c8c" }}>
              Comprehensive vulnerability management and remediation tracking
            </Paragraph>
          </div>
          <Space>
            <Select defaultValue="pdf" style={{ width: 120 }} onChange={handleExport}>
              <Option value="pdf">
                <DownloadOutlined /> PDF
              </Option>
              <Option value="json">
                <DownloadOutlined /> JSON
              </Option>
              <Option value="csv">
                <DownloadOutlined /> CSV
              </Option>
            </Select>
            <Button icon={<ReloadOutlined />} loading={loading} onClick={fetchVulnerabilities}>
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      {/* KEY METRICS */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Vulnerabilities"
              value={stats.total}
              prefix={<BugOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Critical"
              value={stats.critical}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="High"
              value={stats.high}
              prefix={<WarningOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Open"
              value={stats.open}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#faad14" }}
            />
          </Card>
        </Col>
      </Row>

      {/* TABS */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} size="large">
        {/* ==================== VULNERABILITIES TAB ==================== */}
        <TabPane
          tab={
            <span>
              <BugOutlined />
              Vulnerabilities
              <Badge count={stats.open} offset={[10, 0]} />
            </span>
          }
          key="vulnerabilities"
        >
          {/* FILTERS */}
          <Card style={{ marginBottom: 16 }}>
            <Space size="middle" wrap>
              <Input
                placeholder="Search vulnerabilities..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
                allowClear
              />
              <Select
                value={severityFilter}
                onChange={setSeverityFilter}
                style={{ width: 150 }}
                placeholder="Severity"
              >
                <Option value="all">All Severities</Option>
                <Option value="critical">Critical</Option>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
              <Select value={statusFilter} onChange={setStatusFilter} style={{ width: 150 }} placeholder="Status">
                <Option value="all">All Status</Option>
                <Option value="open">Open</Option>
                <Option value="acknowledged">Acknowledged</Option>
                <Option value="in_progress">In Progress</Option>
                <Option value="resolved">Resolved</Option>
                <Option value="false_positive">False Positive</Option>
              </Select>
              <Text type="secondary">
                Showing {filteredVulnerabilities.length} of {vulnerabilities.length} vulnerabilities
              </Text>
            </Space>
          </Card>

          {/* TABLE */}
          <Card>
            <Table
              columns={columns}
              dataSource={filteredVulnerabilities}
              rowKey="id"
              loading={loading}
              pagination={{ pageSize: 20, showSizeChanger: true }}
            />
          </Card>
        </TabPane>

        {/* ==================== OWASP TOP 10 TAB ==================== */}
        <TabPane
          tab={
            <span>
              <SafetyCertificateOutlined />
              OWASP Top 10
            </span>
          }
          key="owasp"
        >
          <Card>
            <Space direction="vertical" style={{ width: "100%" }} size="large">
              {owaspData.length > 0 ? (
                owaspData.map((category) => (
                  <Card key={category.id} size="small">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Space>
                        <Tag color={getSeverityColor(category.severity)}>{category.id}</Tag>
                        <Text strong>{category.name}</Text>
                      </Space>
                      <Badge count={category.count} showZero style={{ backgroundColor: getSeverityColor(category.severity) }} />
                    </div>
                  </Card>
                ))
              ) : (
                <Empty description="No OWASP vulnerabilities found" />
              )}
            </Space>
          </Card>
        </TabPane>

        {/* ==================== TIMELINE TAB ==================== */}
        <TabPane
          tab={
            <span>
              <ClockCircleOutlined />
              Timeline
            </span>
          }
          key="timeline"
        >
          <Card>
            <Timeline mode="left">
              {vulnerabilities
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 20)
                .map((vuln) => (
                  <Timeline.Item
                    key={vuln.id}
                    color={getSeverityColor(vuln.severity)}
                    label={new Date(vuln.created_at).toLocaleDateString()}
                  >
                    <Space direction="vertical">
                      <Space>
                        <Tag color={getSeverityColor(vuln.severity)}>{vuln.severity.toUpperCase()}</Tag>
                        <Text strong>{vuln.title}</Text>
                      </Space>
                      <Tag color={getStatusColor(vuln.status)}>{vuln.status.replace("_", " ").toUpperCase()}</Tag>
                    </Space>
                  </Timeline.Item>
                ))}
            </Timeline>
          </Card>
        </TabPane>
      </Tabs>

      {/* VULNERABILITY DETAILS DRAWER */}
      <Drawer
        title={
          <Space>
            <BugOutlined />
            <span>Vulnerability Details</span>
          </Space>
        }
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        extra={
          <Space>
            <Button onClick={() => setWorkflowModalVisible(true)}>Change Status</Button>
            <Button type="primary" onClick={() => setJiraModalVisible(true)}>
              Create JIRA Ticket
            </Button>
          </Space>
        }
      >
        {selectedVulnerability && (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            {/* Header */}
            <div>
              <Title level={4}>{selectedVulnerability.title}</Title>
              <Space>
                <Tag color={getSeverityColor(selectedVulnerability.severity)}>
                  {selectedVulnerability.severity.toUpperCase()}
                </Tag>
                <Tag color={getStatusColor(selectedVulnerability.status)}>
                  {selectedVulnerability.status.replace("_", " ").toUpperCase()}
                </Tag>
                {selectedVulnerability.cvss_score && <Tag color="red">CVSS: {selectedVulnerability.cvss_score}</Tag>}
                {selectedVulnerability.cwe_id && <Tag>CWE-{selectedVulnerability.cwe_id}</Tag>}
              </Space>
            </div>

            <Divider />

            {/* Details */}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Type">{selectedVulnerability.vulnerability_type}</Descriptions.Item>
              <Descriptions.Item label="Affected URL">
                <Text code>{selectedVulnerability.affected_url}</Text>
              </Descriptions.Item>
              {selectedVulnerability.affected_parameter && (
                <Descriptions.Item label="Parameter">{selectedVulnerability.affected_parameter}</Descriptions.Item>
              )}
              <Descriptions.Item label="Discovered">
                {new Date(selectedVulnerability.created_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(selectedVulnerability.updated_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {/* Description */}
            {selectedVulnerability.description && (
              <Card title="Description" size="small">
                <Paragraph>{selectedVulnerability.description}</Paragraph>
              </Card>
            )}

            {/* Evidence */}
            {selectedVulnerability.evidence && (
              <Card title="Evidence" size="small">
                <pre
                  style={{
                    background: "#f5f5f5",
                    padding: "12px",
                    borderRadius: "4px",
                    overflow: "auto",
                    fontSize: "12px",
                  }}
                >
                  {selectedVulnerability.evidence}
                </pre>
              </Card>
            )}

            {/* Remediation */}
            {selectedVulnerability.remediation && (
              <Card title="Remediation Steps" size="small">
                <Paragraph>{selectedVulnerability.remediation}</Paragraph>
              </Card>
            )}

            {/* SLA Status */}
            <Card title="SLA Status" size="small">
              {(() => {
                const sla = calculateSLA(selectedVulnerability.created_at, selectedVulnerability.severity);
                return (
                  <Space direction="vertical" style={{ width: "100%" }}>
                    <Progress
                      percent={sla.percent}
                      strokeColor={sla.breached ? "#ff4d4f" : sla.percent < 20 ? "#fa8c16" : "#52c41a"}
                      status={sla.breached ? "exception" : "active"}
                    />
                    <Text type={sla.breached ? "danger" : "secondary"}>
                      {sla.breached
                        ? `SLA breached by ${Math.abs(sla.remaining).toFixed(0)} hours`
                        : `${sla.remaining.toFixed(0)} hours remaining`}
                    </Text>
                  </Space>
                );
              })()}
            </Card>
          </Space>
        )}
      </Drawer>

      {/* WORKFLOW MODAL */}
      <Modal
        title="Change Vulnerability Status"
        open={workflowModalVisible}
        onCancel={() => setWorkflowModalVisible(false)}
        footer={null}
      >
        {selectedVulnerability && (
          <Space direction="vertical" style={{ width: "100%" }} size="large">
            <Alert
              message={`Current Status: ${selectedVulnerability.status.replace("_", " ").toUpperCase()}`}
              type="info"
            />
            <Space wrap>
              <Button
                type={selectedVulnerability.status === "acknowledged" ? "primary" : "default"}
                onClick={() => handleStatusChange(selectedVulnerability.id, "acknowledged")}
              >
                Acknowledge
              </Button>
              <Button
                type={selectedVulnerability.status === "in_progress" ? "primary" : "default"}
                onClick={() => handleStatusChange(selectedVulnerability.id, "in_progress")}
              >
                Mark In Progress
              </Button>
              <Button
                type={selectedVulnerability.status === "resolved" ? "primary" : "default"}
                onClick={() => handleStatusChange(selectedVulnerability.id, "resolved")}
              >
                Mark Resolved
              </Button>
              <Button
                type={selectedVulnerability.status === "false_positive" ? "primary" : "default"}
                danger
                onClick={() => handleStatusChange(selectedVulnerability.id, "false_positive")}
              >
                Mark False Positive
              </Button>
            </Space>
          </Space>
        )}
      </Modal>

      {/* JIRA MODAL */}
      <Modal
        title="Create JIRA Ticket"
        open={jiraModalVisible}
        onCancel={() => setJiraModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateJiraTicket}>
          <Form.Item label="Project" name="project" rules={[{ required: true }]}>
            <Input placeholder="PROJECT-KEY" />
          </Form.Item>
          <Form.Item label="Issue Type" name="issueType" initialValue="Bug">
            <Select>
              <Option value="Bug">Bug</Option>
              <Option value="Task">Task</Option>
              <Option value="Story">Story</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Priority" name="priority" initialValue="High">
            <Select>
              <Option value="Highest">Highest</Option>
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Ticket
              </Button>
              <Button onClick={() => setJiraModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
