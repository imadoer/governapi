"use client";
import React, { useState } from "react";
import { Row, Col, Typography, Tag, Table, Button, Modal, Form, Input, Select, Drawer, Tooltip, Upload, Tabs } from "antd";
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  WarningOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  RightOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  InboxOutlined
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { Framework, Control, Policy, Evidence, Attestation } from "./types";

const { Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

// Premium palette
const palette = {
  success: "#06b6d4",
  successMuted: "#0891b2",
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
  neutralBorder: "rgba(100, 116, 139, 0.2)",
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
  frameworks: Framework[];
  controls: Control[];
  controlEvidence: Evidence[];
  policies: Policy[];
  attestations: Attestation[];
  attestationStats: any;
  selectedFramework: Framework | null;
  onSelectFramework: (fw: Framework | null) => void;
  onFetchControls: (frameworkId?: string) => Promise<void>;
  onFetchControlEvidence: (controlId: number) => Promise<void>;
  onSubmitAttestation: (controlId: number, values: any) => Promise<void>;
  onUploadEvidence: (controlId: number, file: File, metadata: any) => Promise<void>;
  onCreatePolicy: (values: any) => Promise<void>;
  attestationFilter: string;
  onAttestationFilterChange: (filter: string) => void;
  userName: string;
}

const FrameworkCard = ({ framework, index, onClick }: { framework: Framework; index: number; onClick: () => void }) => {
  const score = Number(framework.score) || 0;
  const passedControls = framework.passedControls || 0;
  const failedControls = framework.failedControls || 0;
  const totalControls = framework.totalControls || 0;
  
  const getConfig = (status: string, sc: number) => {
    if (status === "compliant" || sc >= 90) return { color: palette.success, bg: palette.successBg, border: palette.successBorder, label: "Compliant", icon: <CheckCircleOutlined /> };
    if (status === "partial" || sc >= 60) return { color: palette.warning, bg: palette.warningBg, border: palette.warningBorder, label: "Partial", icon: <WarningOutlined /> };
    if (sc === 0) return { color: palette.neutral, bg: palette.neutralBg, border: palette.neutralBorder, label: "Not Started", icon: <ClockCircleOutlined /> };
    return { color: palette.danger, bg: palette.dangerBg, border: palette.dangerBorder, label: "At Risk", icon: <CloseCircleOutlined /> };
  };
  
  const config = getConfig(framework.status, score);
  
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.3)" }}
      onClick={onClick}
      style={{
        background: `linear-gradient(145deg, ${config.bg} 0%, rgba(255,255,255,0.02) 100%)`,
        borderRadius: 16,
        padding: 24,
        border: `1px solid ${config.border}`,
        boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: palette.text }}>{framework.name}</span>
        <Tag style={{ 
          background: `${config.color}15`,
          border: "none",
          color: config.color,
          fontSize: 10,
          fontWeight: 600,
          borderRadius: 4,
          padding: "2px 8px",
          display: "flex",
          alignItems: "center",
          gap: 4
        }}>
          {config.icon} {config.label}
        </Tag>
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <div style={{ height: 6, background: "rgba(255,255,255,0.1)", borderRadius: 3, overflow: "hidden" }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, delay: index * 0.05 }}
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${config.color}80, ${config.color})`,
              borderRadius: 3,
              boxShadow: score > 0 ? `0 0 8px ${config.color}40` : "none"
            }} 
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: config.color }}>{score.toFixed(0)}%</span>
        </div>
      </div>
      
      <div style={{ 
        display: "flex", 
        gap: 16,
        marginTop: "auto",
        paddingTop: 12,
        borderTop: `1px solid ${palette.border}`,
        fontSize: 12
      }}>
        <span style={{ color: palette.success }}>✓ {passedControls}</span>
        <span style={{ color: palette.danger }}>✗ {failedControls}</span>
        <span style={{ color: palette.textFaint }}>◎ {totalControls}</span>
      </div>
      
      <div style={{ position: "absolute", bottom: 16, right: 16, color: palette.textFaint, fontSize: 12 }}>
        <RightOutlined />
      </div>
    </motion.div>
  );
};

const SectionCard = ({ title, icon, extra, children, noPadding }: { 
  title: string; icon: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode; noPadding?: boolean;
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

export function FrameworksControlsTab({
  frameworks,
  controls,
  controlEvidence,
  policies,
  attestations,
  attestationStats,
  selectedFramework,
  onSelectFramework,
  onFetchControls,
  onFetchControlEvidence,
  onSubmitAttestation,
  onUploadEvidence,
  onCreatePolicy,
  attestationFilter,
  onAttestationFilterChange,
  userName
}: Props) {
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [controlDrawerOpen, setControlDrawerOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [attestModalOpen, setAttestModalOpen] = useState(false);
  const [attestNotes, setAttestNotes] = useState("");
  const [form] = Form.useForm();

  const handleFrameworkClick = (fw: Framework) => {
    onSelectFramework(fw);
    onFetchControls(fw.id);
  };

  const handleControlClick = (control: Control) => {
    setSelectedControl(control);
    onFetchControlEvidence(control.id);
    setControlDrawerOpen(true);
  };

  const handleAttest = async () => {
    if (selectedControl) {
      await onSubmitAttestation(selectedControl.id, { notes: attestNotes, attestedBy: userName });
      setAttestModalOpen(false);
      setAttestNotes("");
    }
  };

  const handlePolicySubmit = async (values: any) => {
    await onCreatePolicy(values);
    setPolicyModalOpen(false);
    form.resetFields();
  };

  return (
    <motion.div initial="hidden" animate="visible">
      {/* Framework Grid */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: palette.textFaint, textTransform: "uppercase", letterSpacing: 2, marginBottom: 20, fontWeight: 500 }}>
          All Frameworks ({frameworks.length})
        </div>
        <Row gutter={[16, 16]}>
          {frameworks.map((fw, i) => (
            <Col xs={24} sm={12} md={8} lg={6} key={fw.id}>
              <FrameworkCard framework={fw} index={i} onClick={() => handleFrameworkClick(fw)} />
            </Col>
          ))}
        </Row>
      </div>

      {/* Selected Framework Controls */}
      {selectedFramework && (
        <div style={{ marginBottom: 32 }}>
          <SectionCard
            title={`${selectedFramework.name} Controls`}
            icon={<SafetyCertificateOutlined />}
            extra={<Tag style={{ background: palette.successBg, border: "none", color: palette.success, borderRadius: 6 }}>{controls.length} Controls</Tag>}
            noPadding
          >
            <Table
              dataSource={controls}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              className="dark-table"
              onRow={(record) => ({ onClick: () => handleControlClick(record), style: { cursor: "pointer" } })}
              columns={[
                { title: "Control ID", dataIndex: "controlId", key: "controlId", width: 120, render: (id: string) => <span style={{ color: palette.success, fontFamily: "monospace", fontSize: 12 }}>{id}</span> },
                { title: "Name", dataIndex: "controlName", key: "controlName", render: (name: string) => <span style={{ color: palette.text, fontWeight: 500 }}>{name}</span> },
                { title: "Status", dataIndex: "status", key: "status", width: 120, render: (status: string) => {
                  const cfg = status === "implemented" ? { color: palette.success, bg: palette.successBg } : status === "partial" ? { color: palette.warning, bg: palette.warningBg } : { color: palette.danger, bg: palette.dangerBg };
                  return <Tag style={{ background: cfg.bg, border: "none", color: cfg.color, borderRadius: 4 }}>{status}</Tag>;
                }},
                { title: "Evidence", dataIndex: "evidenceCount", key: "evidenceCount", width: 100, render: (count: number) => <span style={{ color: count > 0 ? palette.success : palette.textFaint }}>{count || 0} files</span> },
                { title: "Actions", key: "actions", width: 120, render: (_: any, record: Control) => (
                  <div style={{ display: "flex", gap: 8 }}>
                    <Tooltip title="View"><Button type="text" size="small" icon={<EyeOutlined />} onClick={(e) => { e.stopPropagation(); handleControlClick(record); }} style={{ color: palette.textMuted }} /></Tooltip>
                    <Tooltip title="Attest"><Button type="text" size="small" icon={<CheckCircleOutlined />} onClick={(e) => { e.stopPropagation(); setSelectedControl(record); setAttestModalOpen(true); }} style={{ color: palette.success }} /></Tooltip>
                  </div>
                )}
              ]}
            />
          </SectionCard>
        </div>
      )}

      {/* Policies Section */}
      <SectionCard
        title="Policies"
        icon={<FileTextOutlined />}
        extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => setPolicyModalOpen(true)} style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)`, border: "none", borderRadius: 6 }}>Add Policy</Button>}
        noPadding
      >
        <Table
          dataSource={policies}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          className="dark-table"
          columns={[
            { title: "Policy Name", dataIndex: "name", key: "name", render: (name: string) => <span style={{ color: palette.text, fontWeight: 500 }}>{name}</span> },
            { title: "Version", dataIndex: "version", key: "version", width: 80, render: (v: string) => <Tag style={{ background: palette.neutralBg, border: "none", color: palette.textMuted, borderRadius: 4 }}>v{v}</Tag> },
            { title: "Status", dataIndex: "status", key: "status", width: 100, render: (status: string) => {
              const cfg = status === "active" ? { color: palette.success, bg: palette.successBg } : status === "draft" ? { color: palette.warning, bg: palette.warningBg } : { color: palette.textFaint, bg: palette.neutralBg };
              return <Tag style={{ background: cfg.bg, border: "none", color: cfg.color, borderRadius: 4 }}>{status}</Tag>;
            }},
            { title: "Owner", dataIndex: "owner", key: "owner", render: (owner: string) => <span style={{ color: palette.textMuted }}>{owner}</span> },
          ]}
        />
      </SectionCard>

      {/* Policy Modal */}
      <Modal
        title={<span style={{ color: palette.text }}>Create Policy</span>}
        open={policyModalOpen}
        onCancel={() => setPolicyModalOpen(false)}
        footer={null}
        styles={{ content: { background: "#0f172a", border: `1px solid ${palette.borderLight}` }, header: { background: "#0f172a", borderBottom: `1px solid ${palette.border}` } }}
      >
        <Form form={form} layout="vertical" onFinish={handlePolicySubmit} style={{ marginTop: 24 }}>
          <Form.Item name="name" label={<span style={{ color: palette.textMuted }}>Policy Name</span>} rules={[{ required: true }]}>
            <Input style={{ background: palette.cardBg, borderColor: palette.border, color: palette.text }} />
          </Form.Item>
          <Form.Item name="description" label={<span style={{ color: palette.textMuted }}>Description</span>}>
            <TextArea rows={3} style={{ background: palette.cardBg, borderColor: palette.border, color: palette.text }} />
          </Form.Item>
          <Form.Item name="owner" label={<span style={{ color: palette.textMuted }}>Owner</span>}>
            <Input style={{ background: palette.cardBg, borderColor: palette.border, color: palette.text }} />
          </Form.Item>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button onClick={() => setPolicyModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)`, border: "none" }}>Create</Button>
          </div>
        </Form>
      </Modal>

      {/* Attest Modal */}
      <Modal
        title={<span style={{ color: palette.text }}>Attest Control</span>}
        open={attestModalOpen}
        onCancel={() => { setAttestModalOpen(false); setAttestNotes(""); }}
        onOk={handleAttest}
        okText="Submit Attestation"
        okButtonProps={{ style: { background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)`, border: "none" } }}
        styles={{ content: { background: "#0f172a", border: `1px solid ${palette.borderLight}` }, header: { background: "#0f172a", borderBottom: `1px solid ${palette.border}` } }}
      >
        <div style={{ marginBottom: 16 }}>
          <Text style={{ color: palette.textMuted }}>Control: </Text>
          <Text strong style={{ color: palette.text }}>{selectedControl?.controlName}</Text>
        </div>
        <TextArea placeholder="Add attestation notes..." value={attestNotes} onChange={(e) => setAttestNotes(e.target.value)} rows={4} style={{ background: palette.cardBg, borderColor: palette.border, color: palette.text }} />
      </Modal>

      {/* Control Drawer */}
      <Drawer
        title={<span style={{ color: palette.text }}>{selectedControl?.controlName}</span>}
        open={controlDrawerOpen}
        onClose={() => setControlDrawerOpen(false)}
        width={500}
        styles={{ body: { background: "#0f172a" }, header: { background: "#0f172a", borderBottom: `1px solid ${palette.border}` } }}
      >
        {selectedControl && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <Text style={{ color: palette.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Control ID</Text>
              <div style={{ color: palette.success, fontFamily: "monospace", fontSize: 14, marginTop: 4 }}>{selectedControl.controlId}</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Text style={{ color: palette.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Status</Text>
              <div style={{ marginTop: 8 }}>
                <Tag style={{ background: selectedControl.status === "implemented" ? palette.successBg : palette.warningBg, border: "none", color: selectedControl.status === "implemented" ? palette.success : palette.warning, borderRadius: 4 }}>{selectedControl.status}</Tag>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Text style={{ color: palette.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Description</Text>
              <div style={{ color: palette.textMuted, marginTop: 4, lineHeight: 1.6 }}>{selectedControl.description || "No description available."}</div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Text style={{ color: palette.textFaint, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Evidence ({controlEvidence.length})</Text>
              {controlEvidence.length > 0 ? (
                <div style={{ marginTop: 8 }}>
                  {controlEvidence.map((ev, i) => (
                    <div key={i} style={{ padding: "8px 12px", background: palette.cardBg, borderRadius: 8, marginBottom: 8, color: palette.textMuted, fontSize: 13 }}>
                      {ev.fileName || `Evidence ${i + 1}`}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: palette.textFaint, marginTop: 4 }}>No evidence attached</div>
              )}
            </div>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => { setControlDrawerOpen(false); setAttestModalOpen(true); }} style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)`, border: "none", width: "100%", height: 44 }}>
              Attest This Control
            </Button>
          </div>
        )}
      </Drawer>
    </motion.div>
  );
}
