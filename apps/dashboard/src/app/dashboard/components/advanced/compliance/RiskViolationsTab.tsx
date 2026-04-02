"use client";
import React, { useState } from "react";
import { Row, Col, Typography, Tag, Table, Button, Select, Modal, Input, Tooltip, Empty } from "antd";
import { 
  AlertOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  ToolOutlined,
  BugOutlined,
  SafetyCertificateOutlined,
  WarningOutlined
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { Violation, RemediationTask } from "./types";

const { Text } = Typography;
const { TextArea } = Input;

// Premium palette
const palette = {
  success: "#06b6d4",
  successBg: "rgba(6, 182, 212, 0.1)",
  successBorder: "rgba(6, 182, 212, 0.25)",
  warning: "#8b5cf6",
  warningBg: "rgba(139, 92, 246, 0.1)",
  warningBorder: "rgba(139, 92, 246, 0.25)",
  danger: "#e11d48",
  dangerBg: "rgba(225, 29, 72, 0.1)",
  dangerBorder: "rgba(225, 29, 72, 0.25)",
  neutral: "#64748b",
  neutralBg: "rgba(100, 116, 139, 0.1)",
  text: "rgba(255, 255, 255, 0.9)",
  textMuted: "rgba(255, 255, 255, 0.55)",
  textFaint: "rgba(255, 255, 255, 0.35)",
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  cardBg: "rgba(255, 255, 255, 0.04)",
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

interface Props {
  remediationStats: any;
  vendorStats: any;
  onCreateRemediation: (data: any) => void;
  onUpdateRemediationStatus: (taskId: number, status: string, notes: string) => void;
  onCreateVendor: (data: any) => void;
  userName: string;
  violations: Violation[];
  violationStats: any;
  remediationTasks: RemediationTask[];
  vendors: any[];
  violationFilter: { status: string; severity: string };
  onViolationFilterChange: (filter: { status: string; severity: string }) => void;
  remediationFilter: { status: string; priority: string };
  onRemediationFilterChange: (filter: { status: string; priority: string }) => void;
  onResolveViolation: (violationId: number, resolvedBy: string, notes: string) => void;
  onUpdateRemediation?: (taskId: number, status: string, notes: string) => void;
}

const StatCard = ({ title, value, icon, color, subtitle }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: string;
  subtitle?: string;
}) => (
  <motion.div
    variants={itemVariants}
    initial="hidden"
    animate="visible"
    whileHover={{ y: -4 }}
    style={{
      background: `linear-gradient(145deg, ${color}15 0%, rgba(255,255,255,0.02) 100%)`,
      borderRadius: 16,
      padding: 24,
      border: `1px solid ${color}30`,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
    }}
  >
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 11, color: palette.textFaint, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 36, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
        {subtitle && <div style={{ fontSize: 12, color: palette.textMuted, marginTop: 8 }}>{subtitle}</div>}
      </div>
      <div style={{ fontSize: 24, color, opacity: 0.6 }}>{icon}</div>
    </div>
  </motion.div>
);

const SectionCard = ({ title, icon, extra, children, noPadding }: { 
  title: string; 
  icon: React.ReactNode; 
  extra?: React.ReactNode; 
  children: React.ReactNode;
  noPadding?: boolean;
}) => (
  <motion.div
    variants={itemVariants}
    initial="hidden"
    animate="visible"
    style={{
      background: `linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
      borderRadius: 16,
      border: `1px solid ${palette.borderLight}`,
      boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
      overflow: "hidden"
    }}
  >
    <div style={{
      padding: "18px 24px",
      borderBottom: `1px solid ${palette.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: palette.success, fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: palette.text }}>{title}</span>
      </div>
      {extra}
    </div>
    <div style={{ padding: noPadding ? 0 : 24 }}>{children}</div>
  </motion.div>
);

export function RiskViolationsTab({
  violations,
  violationStats,
  remediationTasks,
  vendors,
  violationFilter,
  onViolationFilterChange,
  remediationFilter,
  onRemediationFilterChange,
  onResolveViolation,
  onUpdateRemediation
}: Props) {
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [remediationModalOpen, setRemediationModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RemediationTask | null>(null);
  const [taskNotes, setTaskNotes] = useState("");
  const [taskStatus, setTaskStatus] = useState("");

  const handleResolve = () => {
    if (selectedViolation) {
      onResolveViolation(selectedViolation.id, "User", resolveNotes);
      setResolveModalOpen(false);
      setResolveNotes("");
      setSelectedViolation(null);
    }
  };

  const handleUpdateTask = () => {
    if (selectedTask) {
      onUpdateRemediation(selectedTask.id, taskStatus, taskNotes);
      setRemediationModalOpen(false);
      setTaskNotes("");
      setSelectedTask(null);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return { color: palette.danger, bg: palette.dangerBg };
      case 'high': return { color: '#f97316', bg: 'rgba(249, 115, 22, 0.1)' };
      case 'medium': return { color: palette.warning, bg: palette.warningBg };
      default: return { color: palette.success, bg: palette.successBg };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open': return { color: palette.danger, bg: palette.dangerBg };
      case 'in_progress': return { color: palette.warning, bg: palette.warningBg };
      case 'resolved': case 'completed': return { color: palette.success, bg: palette.successBg };
      default: return { color: palette.neutral, bg: palette.neutralBg };
    }
  };

  return (
    <motion.div initial="hidden" animate="visible">
      {/* Stats Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={6}>
          <StatCard 
            title="Total Violations" 
            value={violationStats?.total || violations.length} 
            icon={<AlertOutlined />} 
            color={palette.danger}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard 
            title="Critical" 
            value={violationStats?.bySeverity?.critical || 0} 
            icon={<ExclamationCircleOutlined />} 
            color={palette.danger}
            subtitle="Immediate action required"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard 
            title="Open" 
            value={violationStats?.byStatus?.open || 0} 
            icon={<ClockCircleOutlined />} 
            color={palette.warning}
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard 
            title="Resolved" 
            value={violationStats?.byStatus?.resolved || 0} 
            icon={<CheckCircleOutlined />} 
            color={palette.success}
          />
        </Col>
      </Row>

      {/* Violations Table */}
      <div style={{ marginBottom: 32 }}>
        <SectionCard
          title="Violations"
          icon={<AlertOutlined style={{ color: palette.danger }} />}
          extra={
            <div style={{ display: "flex", gap: 12 }}>
              <Select
                value={violationFilter.severity}
                onChange={(v) => onViolationFilterChange({ ...violationFilter, severity: v })}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'All Severity' },
                  { value: 'critical', label: 'Critical' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
              />
              <Select
                value={violationFilter.status}
                onChange={(v) => onViolationFilterChange({ ...violationFilter, status: v })}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'resolved', label: 'Resolved' },
                ]}
              />
            </div>
          }
          noPadding
        >
          {violations.length > 0 ? (
            <Table
              dataSource={violations}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="dark-table"
              columns={[
                {
                  title: "Severity",
                  dataIndex: "severity",
                  key: "severity",
                  width: 100,
                  render: (severity: string) => {
                    const cfg = getSeverityConfig(severity);
                    return <Tag style={{ background: cfg.bg, border: "none", color: cfg.color, borderRadius: 4 }}>{severity?.toUpperCase()}</Tag>;
                  }
                },
                {
                  title: "Title",
                  dataIndex: "title",
                  key: "title",
                  render: (title: string) => <span style={{ color: palette.text, fontWeight: 500 }}>{title}</span>
                },
                {
                  title: "Endpoint",
                  dataIndex: "endpoint_path",
                  key: "endpoint_path",
                  render: (path: string) => <span style={{ color: palette.success, fontFamily: "monospace", fontSize: 12 }}>{path}</span>
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  width: 120,
                  render: (status: string) => {
                    const cfg = getStatusConfig(status);
                    return <Tag style={{ background: cfg.bg, border: "none", color: cfg.color, borderRadius: 4 }}>{status}</Tag>;
                  }
                },
                {
                  title: "Detected",
                  dataIndex: "detected_at",
                  key: "detected_at",
                  width: 120,
                  render: (date: string) => <span style={{ color: palette.textMuted, fontSize: 12 }}>{date ? new Date(date).toLocaleDateString() : '-'}</span>
                },
                {
                  title: "Actions",
                  key: "actions",
                  width: 100,
                  render: (_: any, record: Violation) => (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Tooltip title="Resolve">
                        <Button
                          type="text"
                          size="small"
                          icon={<CheckCircleOutlined />}
                          onClick={() => { setSelectedViolation(record); setResolveModalOpen(true); }}
                          style={{ color: palette.success }}
                          disabled={record.status === 'resolved'}
                        />
                      </Tooltip>
                    </div>
                  )
                }
              ]}
            />
          ) : (
            <div style={{ padding: 48, textAlign: "center" }}>
              <SafetyCertificateOutlined style={{ fontSize: 48, color: palette.success, marginBottom: 16 }} />
              <div style={{ color: palette.success, fontSize: 14 }}>No violations found</div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Remediation Tasks */}
      <div style={{ marginBottom: 32 }}>
        <SectionCard
          title="Remediation Tasks"
          icon={<ToolOutlined />}
          extra={
            <div style={{ display: "flex", gap: 12 }}>
              <Select
                value={remediationFilter.priority}
                onChange={(v) => onRemediationFilterChange({ ...remediationFilter, priority: v })}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'All Priority' },
                  { value: 'critical', label: 'Critical' },
                  { value: 'high', label: 'High' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'low', label: 'Low' },
                ]}
              />
              <Select
                value={remediationFilter.status}
                onChange={(v) => onRemediationFilterChange({ ...remediationFilter, status: v })}
                style={{ width: 120 }}
                options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'open', label: 'Open' },
                  { value: 'in_progress', label: 'In Progress' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
            </div>
          }
          noPadding
        >
          {remediationTasks.length > 0 ? (
            <Table
              dataSource={remediationTasks}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="dark-table"
              columns={[
                {
                  title: "Priority",
                  dataIndex: "priority",
                  key: "priority",
                  width: 100,
                  render: (priority: string) => {
                    const cfg = getSeverityConfig(priority);
                    return <Tag style={{ background: cfg.bg, border: "none", color: cfg.color, borderRadius: 4 }}>{priority?.toUpperCase()}</Tag>;
                  }
                },
                {
                  title: "Task",
                  dataIndex: "title",
                  key: "title",
                  render: (title: string) => <span style={{ color: palette.text, fontWeight: 500 }}>{title}</span>
                },
                {
                  title: "Assignee",
                  dataIndex: "assignee",
                  key: "assignee",
                  render: (assignee: string) => <span style={{ color: palette.textMuted }}>{assignee || 'Unassigned'}</span>
                },
                {
                  title: "Due Date",
                  dataIndex: "due_date",
                  key: "due_date",
                  width: 120,
                  render: (date: string) => {
                    const isOverdue = date && new Date(date) < new Date();
                    return <span style={{ color: isOverdue ? palette.danger : palette.textMuted, fontSize: 12 }}>{date ? new Date(date).toLocaleDateString() : '-'}</span>;
                  }
                },
                {
                  title: "Status",
                  dataIndex: "status",
                  key: "status",
                  width: 120,
                  render: (status: string) => {
                    const cfg = getStatusConfig(status);
                    return <Tag style={{ background: cfg.bg, border: "none", color: cfg.color, borderRadius: 4 }}>{status}</Tag>;
                  }
                },
                {
                  title: "Actions",
                  key: "actions",
                  width: 100,
                  render: (_: any, record: RemediationTask) => (
                    <Tooltip title="Update Status">
                      <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => { setSelectedTask(record); setTaskStatus(record.status); setRemediationModalOpen(true); }}
                        style={{ color: palette.textMuted }}
                      />
                    </Tooltip>
                  )
                }
              ]}
            />
          ) : (
            <div style={{ padding: 48, textAlign: "center" }}>
              <CheckCircleOutlined style={{ fontSize: 48, color: palette.success, marginBottom: 16 }} />
              <div style={{ color: palette.success, fontSize: 14 }}>No remediation tasks</div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Vendor Risk */}
      <SectionCard
        title="Vendor Risk"
        icon={<BugOutlined />}
        noPadding
      >
        {vendors && vendors.length > 0 ? (
          <Table
            dataSource={vendors}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            className="dark-table"
            columns={[
              {
                title: "Vendor",
                dataIndex: "name",
                key: "name",
                render: (name: string) => <span style={{ color: palette.text, fontWeight: 500 }}>{name}</span>
              },
              {
                title: "Risk Level",
                dataIndex: "risk_level",
                key: "risk_level",
                width: 120,
                render: (level: string) => {
                  const cfg = getSeverityConfig(level);
                  return <Tag style={{ background: cfg.bg, border: "none", color: cfg.color, borderRadius: 4 }}>{level?.toUpperCase()}</Tag>;
                }
              },
              {
                title: "Category",
                dataIndex: "category",
                key: "category",
                render: (cat: string) => <span style={{ color: palette.textMuted }}>{cat}</span>
              },
              {
                title: "Last Assessment",
                dataIndex: "last_assessment",
                key: "last_assessment",
                render: (date: string) => <span style={{ color: palette.textMuted, fontSize: 12 }}>{date ? new Date(date).toLocaleDateString() : 'Never'}</span>
              }
            ]}
          />
        ) : (
          <div style={{ padding: 48, textAlign: "center" }}>
            <SafetyCertificateOutlined style={{ fontSize: 48, color: palette.textFaint, marginBottom: 16 }} />
            <div style={{ color: palette.textFaint, fontSize: 14 }}>No vendors configured</div>
          </div>
        )}
      </SectionCard>

      {/* Resolve Violation Modal */}
      <Modal
        title={<span style={{ color: palette.text }}>Resolve Violation</span>}
        open={resolveModalOpen}
        onCancel={() => { setResolveModalOpen(false); setResolveNotes(""); }}
        onOk={handleResolve}
        okText="Resolve"
        okButtonProps={{ style: { background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.success}dd 100%)`, border: "none" } }}
        styles={{ content: { background: "#0f172a", border: `1px solid ${palette.borderLight}` }, header: { background: "#0f172a", borderBottom: `1px solid ${palette.border}` } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: palette.textMuted }}>Violation: </Text>
          <Text strong style={{ color: palette.text }}>{selectedViolation?.title}</Text>
        </div>
        <TextArea
          placeholder="Resolution notes..."
          value={resolveNotes}
          onChange={(e) => setResolveNotes(e.target.value)}
          rows={4}
          style={{ background: palette.cardBg, borderColor: palette.border, color: palette.text }}
        />
      </Modal>

      {/* Update Remediation Modal */}
      <Modal
        title={<span style={{ color: palette.text }}>Update Task</span>}
        open={remediationModalOpen}
        onCancel={() => { setRemediationModalOpen(false); setTaskNotes(""); }}
        onOk={handleUpdateTask}
        okText="Update"
        okButtonProps={{ style: { background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.success}dd 100%)`, border: "none" } }}
        styles={{ content: { background: "#0f172a", border: `1px solid ${palette.borderLight}` }, header: { background: "#0f172a", borderBottom: `1px solid ${palette.border}` } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: palette.textMuted }}>Task: </Text>
          <Text strong style={{ color: palette.text }}>{selectedTask?.title}</Text>
        </div>
        <Select
          value={taskStatus}
          onChange={setTaskStatus}
          style={{ width: "100%", marginBottom: 16 }}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
          ]}
        />
        <TextArea
          placeholder="Notes..."
          value={taskNotes}
          onChange={(e) => setTaskNotes(e.target.value)}
          rows={4}
          style={{ background: palette.cardBg, borderColor: palette.border, color: palette.text }}
        />
      </Modal>
    </motion.div>
  );
}
