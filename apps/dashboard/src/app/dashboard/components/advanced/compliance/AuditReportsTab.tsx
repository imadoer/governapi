import React from "react";
import { Card, Row, Col, Typography, Button, Tag, Space, Table, Progress, Tabs, Statistic, Divider, Alert, List, Modal, Empty } from "antd";
import { AuditOutlined, HistoryOutlined, FileTextOutlined, DownloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { AuditLogEntry, AuditReadiness, getStatusColor, getScoreColor, formatDateTime } from "./types";

const { Text } = Typography;
const { TabPane } = Tabs;

interface Props {
  auditLogs: AuditLogEntry[];
  auditReadiness: AuditReadiness[];
  onGenerateReport: (reportType: string, format: string) => void;
}

export function AuditReportsTab({ auditLogs, auditReadiness, onGenerateReport }: Props) {
  const auditLogColumns: ColumnsType<AuditLogEntry> = [
    { title: "Timestamp", dataIndex: "created_at", key: "created_at", width: 180, render: formatDateTime },
    { title: "Event", dataIndex: "event_type", key: "event_type", render: (t: string) => <Tag>{t}</Tag> },
    { title: "Category", dataIndex: "event_category", key: "event_category" },
    { title: "Entity", key: "entity", render: (_: any, r: AuditLogEntry) => <Text code>{r.entity_type}:{r.entity_id}</Text> },
    { title: "Action", dataIndex: "action", key: "action", render: (a: string) => <Tag color="blue">{a}</Tag> },
    { title: "Actor", dataIndex: "actor_name", key: "actor_name" },
    { title: "Details", key: "details", render: (_: any, record: AuditLogEntry) => (<Button type="link" size="small" onClick={() => Modal.info({ title: "Audit Details", content: <pre style={{ maxHeight: 400, overflow: "auto" }}>{JSON.stringify({ old: record.old_value, new: record.new_value }, null, 2)}</pre>, width: 600 })}>View</Button>) },
  ];

  const reports = [
    { name: "SOC 2 Type II Alignment Report", type: "soc2", format: "PDF", description: "Full SOC 2 control assessment with evidence mapping" },
    { name: "ISO 27001 Gap Analysis", type: "iso27001", format: "PDF", description: "Gap analysis against ISO 27001:2022 controls" },
    { name: "API Risk Assessment", type: "api-risk", format: "PDF", description: "Comprehensive API risk scoring and analysis" },
    { name: "Vendor Risk Report", type: "vendor", format: "PDF", description: "Third-party vendor risk assessment" },
    { name: "Executive Governance Summary", type: "executive", format: "PDF", description: "Board-ready compliance overview" },
  ];

  return (
    <Tabs defaultActiveKey="readiness">
      <TabPane tab={<><AuditOutlined /> Audit Readiness</>} key="readiness">
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          {auditReadiness.length > 0 ? auditReadiness.map((ar) => (
            <Col xs={24} sm={12} lg={8} key={ar.frameworkId}>
              <Card size="small" title={<Space><AuditOutlined /><span>{ar.frameworkName}</span>{ar.readyForAudit ? (<Tag color="green">AUDIT READY</Tag>) : (<Tag color="orange">NOT READY</Tag>)}</Space>}>
                <div style={{ textAlign: "center", marginBottom: 16 }}><Progress type="circle" percent={ar.overallScore} strokeColor={getScoreColor(ar.overallScore)} width={100} /></div>
                <Row gutter={8}>
                  <Col span={12}><Statistic title="Evidence" value={ar.scores.evidence} suffix="%" valueStyle={{ fontSize: 16 }} /></Col>
                  <Col span={12}><Statistic title="Controls" value={ar.scores.controls} suffix="%" valueStyle={{ fontSize: 16 }} /></Col>
                  <Col span={12}><Statistic title="Attestations" value={ar.scores.attestations} suffix="%" valueStyle={{ fontSize: 16 }} /></Col>
                  <Col span={12}><Statistic title="Remediation" value={ar.scores.remediation} suffix="%" valueStyle={{ fontSize: 16 }} /></Col>
                </Row>
                {ar.recommendations.length > 0 && (<><Divider style={{ margin: "12px 0" }} /><Text type="secondary" style={{ fontSize: 12 }}>Recommendations:</Text><ul style={{ paddingLeft: 16, margin: "8px 0 0", fontSize: 12 }}>{ar.recommendations.slice(0, 3).map((rec, idx) => (<li key={idx}>{rec}</li>))}</ul></>)}
              </Card>
            </Col>
          )) : <Col span={24}><Empty description="No audit readiness data available" /></Col>}
        </Row>
      </TabPane>

      <TabPane tab={<><HistoryOutlined /> Audit Log</>} key="logs">
        <Card>
          <Alert message="Compliance Audit Trail" description="This log is immutable and cryptographically signed. All compliance-related changes are recorded for audit purposes." type="info" showIcon style={{ marginBottom: 16 }} />
          <Table columns={auditLogColumns} dataSource={auditLogs} rowKey="id" size="small" pagination={{ pageSize: 20 }} scroll={{ x: 1000 }} />
        </Card>
      </TabPane>

      <TabPane tab={<><FileTextOutlined /> Reports</>} key="reports">
        <Card>
          <Alert message="Report Generation" description="Generate audit-ready compliance reports. Reports include current control status, evidence mapping, and recommendations." type="info" showIcon style={{ marginBottom: 24 }} />
          <List grid={{ gutter: 16, xs: 1, sm: 2, lg: 3 }} dataSource={reports} renderItem={(report) => (
            <List.Item>
              <Card size="small" hoverable>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><Text strong>{report.name}</Text><Tag>{report.format}</Tag></div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{report.description}</Text>
                  <Space><Button type="primary" icon={<DownloadOutlined />} onClick={() => onGenerateReport(report.type, "pdf")}>PDF</Button><Button icon={<DownloadOutlined />} onClick={() => onGenerateReport(report.type, "json")}>JSON</Button></Space>
                </Space>
              </Card>
            </List.Item>
          )} />
        </Card>
      </TabPane>
    </Tabs>
  );
}
