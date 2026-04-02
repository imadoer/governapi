"use client";
import React, { useState, useEffect } from "react";
import { Row, Col, Typography, Tag, Table, Empty, Button, Tooltip, Dropdown, Menu, Switch } from "antd";
import { 
  SafetyCertificateOutlined, 
  AlertOutlined, 
  ExclamationCircleOutlined, 
  FileDoneOutlined, 
  CalendarOutlined, 
  ScheduleOutlined, 
  HistoryOutlined, 
  DownloadOutlined, 
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  AuditOutlined,
  FileSearchOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  UploadOutlined,
  EditOutlined,
  BugOutlined,
  EyeOutlined
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { DashboardData, Violation, formatDate, formatDateTime } from "./types";

const { Text } = Typography;

// ============================================================================
// PREMIUM COLOR PALETTE - Expensive & Sophisticated
// ============================================================================
const palette = {
  success: "#06b6d4",
  successMuted: "#0891b2",
  successBg: "rgba(6, 182, 212, 0.1)",
  successBorder: "rgba(6, 182, 212, 0.25)",
  
  warning: "#8b5cf6",
  warningMuted: "#7c3aed",
  warningBg: "rgba(139, 92, 246, 0.1)",
  warningBorder: "rgba(139, 92, 246, 0.25)",
  
  danger: "#e11d48",
  dangerMuted: "#be123c",
  dangerBg: "rgba(225, 29, 72, 0.1)",
  dangerBorder: "rgba(225, 29, 72, 0.25)",
  
  gold: "#d97706",
  goldLight: "#f59e0b",
  goldBg: "rgba(217, 119, 6, 0.12)",
  goldBorder: "rgba(217, 119, 6, 0.3)",
  
  neutral: "#64748b",
  neutralBg: "rgba(100, 116, 139, 0.1)",
  
  text: "rgba(255, 255, 255, 0.9)",
  textMuted: "rgba(255, 255, 255, 0.55)",
  textFaint: "rgba(255, 255, 255, 0.35)",
  border: "rgba(255, 255, 255, 0.06)",
  borderLight: "rgba(255, 255, 255, 0.1)",
};

// ============================================================================
// ANIMATION VARIANTS
// ============================================================================
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface Props {
  dashboardData: DashboardData | null;
  onViewAllLogs: () => void;
  onViewViolations: () => void;
  onExportPDF?: () => void;
  onRunAssessment?: () => void;
  autoRefresh?: boolean;
  onAutoRefreshChange?: (checked: boolean) => void;
}

// Trend Indicator - shows improvement/decline
const TrendIndicator = ({ value }: { value: number }) => {
  if (value === 0) {
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: palette.textFaint }}>
        <MinusOutlined style={{ fontSize: 8 }} /> No change
      </span>
    );
  }
  const isPositive = value > 0;
  const color = isPositive ? palette.success : palette.danger;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color }}>
      {isPositive ? <RiseOutlined style={{ fontSize: 9 }} /> : <FallOutlined style={{ fontSize: 9 }} />}
      {isPositive ? "+" : ""}{value}% this month
    </span>
  );
};

// Micro Progress Blocks - visual representation of passed/gaps
const MicroBlocks = ({ passed, total }: { passed: number; total: number }) => {
  const maxBlocks = 10;
  const passedBlocks = Math.round((passed / total) * maxBlocks);
  
  return (
    <Tooltip title={`${passed} passed · ${total - passed} gaps · ${total} total`}>
      <div style={{ display: "flex", gap: 3, cursor: "help" }}>
        {Array.from({ length: maxBlocks }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 10,
              height: 16,
              borderRadius: 2,
              background: i < passedBlocks ? palette.success : "rgba(255,255,255,0.12)",
              boxShadow: i < passedBlocks ? `0 0 6px ${palette.success}40` : "none",
              transition: "all 0.3s ease"
            }}
          />
        ))}
      </div>
    </Tooltip>
  );
};

// Framework Card - the hero element
const FrameworkCard = ({ 
  name, score, passed, total, status, trend, index 
}: { 
  name: string; 
  score: number; 
  passed: number; 
  total: number; 
  status: string;
  trend: number;
  index: number;
}) => {
  const numScore = Number(score) || 0;
  const gaps = total - passed;
  
  const getConfig = (s: string, sc: number) => {
    if (s === "compliant" || sc >= 90) return { 
      color: palette.success, 
      bg: palette.successBg, 
      border: palette.successBorder,
      icon: <CheckCircleOutlined /> 
    };
    if (s === "partial" || sc >= 60) return { 
      color: palette.warning, 
      bg: palette.warningBg, 
      border: palette.warningBorder,
      icon: <WarningOutlined /> 
    };
    return { 
      color: palette.danger, 
      bg: palette.dangerBg, 
      border: palette.dangerBorder,
      icon: <CloseCircleOutlined /> 
    };
  };
  
  const config = getConfig(status, numScore);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, boxShadow: `0 20px 40px rgba(0,0,0,0.4)` }}
      style={{
        background: `linear-gradient(145deg, ${config.bg} 0%, rgba(255,255,255,0.02) 100%)`,
        borderRadius: 16,
        padding: "24px 22px",
        border: `1px solid ${config.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        cursor: "pointer",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Subtle glow */}
      <div style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 100,
        height: 100,
        background: `radial-gradient(circle, ${config.color}15 0%, transparent 70%)`,
        borderRadius: "50%"
      }} />
      
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: palette.text, letterSpacing: 0.3 }}>{name}</span>
        <span style={{ color: config.color, fontSize: 14 }}>{config.icon}</span>
      </div>
      
      {/* Score */}
      <div style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 44, fontWeight: 700, color: config.color, lineHeight: 1 }}>
          {numScore.toFixed(0)}
        </span>
        <span style={{ fontSize: 20, color: palette.textFaint, marginLeft: 2 }}>%</span>
      </div>
      
      {/* Trend */}
      <div style={{ marginBottom: 18 }}>
        <TrendIndicator value={trend} />
      </div>
      
      {/* Micro Blocks */}
      <div style={{ marginBottom: 18 }}>
        <MicroBlocks passed={passed} total={total} />
      </div>
      
      {/* Footer Stats */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between",
        marginTop: "auto",
        paddingTop: 16,
        borderTop: `1px solid ${palette.border}`,
        fontSize: 12
      }}>
        <span style={{ color: palette.success }}>{passed} passed</span>
        <span style={{ color: gaps > 0 ? palette.danger : palette.textFaint }}>{gaps} gaps</span>
        <span style={{ color: palette.textFaint }}>{total} total</span>
      </div>
    </motion.div>
  );
};

// Audit Readiness Shield
const AuditReadiness = ({ score }: { score: number }) => {
  const isReady = score >= 80;
  const color = isReady ? palette.success : score >= 60 ? palette.gold : palette.danger;
  const borderColor = isReady ? palette.successBorder : score >= 60 ? palette.goldBorder : palette.dangerBorder;
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        background: `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
        borderRadius: 20,
        padding: 32,
        border: `1px solid ${borderColor}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{ fontSize: 11, color: palette.textFaint, textTransform: "uppercase", letterSpacing: 2, marginBottom: 28, fontWeight: 500 }}>
        Audit Readiness
      </div>
      
      {/* Shield */}
      <div style={{ position: "relative", width: 140, height: 160, margin: "0 auto 28px" }}>
        <svg viewBox="0 0 100 115" width="140" height="160">
          <defs>
            <linearGradient id="shieldFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.35" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
            <filter id="shieldShadow">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={color} floodOpacity="0.5"/>
            </filter>
          </defs>
          <motion.path
            d="M50 8 L88 22 L88 52 C88 78 50 100 50 100 C50 100 12 78 12 52 L12 22 Z"
            fill="url(#shieldFill)"
            stroke={color}
            strokeWidth="1.5"
            filter="url(#shieldShadow)"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </svg>
        <div style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: 42, fontWeight: 700, color, lineHeight: 1 }}
          >
            {score}
          </motion.div>
          <div style={{ fontSize: 12, color: palette.textFaint, marginTop: 4 }}>/100</div>
        </div>
      </div>
      
      {/* Status */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "14px 24px",
        background: isReady ? palette.successBg : palette.goldBg,
        borderRadius: 12,
        border: `1px solid ${isReady ? palette.successBorder : palette.goldBorder}`,
        marginBottom: 28
      }}>
        {isReady ? <CheckCircleOutlined style={{ color }} /> : <WarningOutlined style={{ color }} />}
        <span style={{ color, fontWeight: 600, fontSize: 13, letterSpacing: 0.5 }}>
          {isReady ? "AUDIT READY" : "NEEDS ATTENTION"}
        </span>
      </div>
      
      {/* Timeline */}
      <div style={{ marginTop: "auto" }}>
        <div style={{ fontSize: 10, color: palette.textFaint, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 16 }}>
          Recent Activity
        </div>
        {[
          { icon: <AuditOutlined />, label: "Assessment run", time: "2 days ago" },
          { icon: <UploadOutlined />, label: "Evidence updated", time: "5 hours ago" },
          { icon: <EditOutlined />, label: "Policy changed", time: "1 week ago" }
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, fontSize: 12 }}>
            <span style={{ color: palette.textFaint }}>{item.icon}</span>
            <span style={{ color: palette.textMuted, flex: 1 }}>{item.label}</span>
            <span style={{ color: palette.text }}>{item.time}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Attestation Progress
const AttestationProgress = ({ current, pending, overdue, total }: { 
  current: number; pending: number; overdue: number; total: number;
}) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const hasData = total > 0;
  const scoreColor = !hasData ? palette.neutral : pct >= 80 ? palette.success : pct >= 50 ? palette.warning : palette.danger;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      style={{
        background: `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
        borderRadius: 20,
        padding: 32,
        border: `1px solid ${palette.borderLight}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        height: "100%"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <FileDoneOutlined style={{ color: palette.success, fontSize: 22 }} />
          <span style={{ fontSize: 16, fontWeight: 600, color: palette.text }}>Attestation Progress</span>
        </div>
        <Tag style={{ 
          background: overdue > 0 ? palette.dangerBg : palette.successBg,
          border: "none",
          color: overdue > 0 ? palette.danger : palette.success,
          borderRadius: 6,
          fontSize: 11,
          padding: "4px 10px"
        }}>
          {overdue > 0 ? `${overdue} overdue` : "On track"}
        </Tag>
      </div>
      
      {/* Big Score */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 56, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>{pct}</span>
        <span style={{ fontSize: 24, color: palette.textFaint }}>%</span>
        <span style={{ fontSize: 14, color: palette.textMuted, marginLeft: 8 }}>complete</span>
      </div>
      
      {/* Context */}
      <div style={{ fontSize: 14, color: palette.textMuted, marginBottom: 28 }}>
        <strong style={{ color: palette.text }}>{pending}</strong> controls pending · 
        <strong style={{ color: overdue > 0 ? palette.danger : palette.text }}> {overdue}</strong> overdue · 
        Next due in <strong style={{ color: palette.text }}>5 days</strong>
      </div>
      
      {/* Progress Bar */}
      <div style={{ 
        height: 12, 
        background: "rgba(255,255,255,0.08)", 
        borderRadius: 6,
        overflow: "hidden",
        display: "flex",
        marginBottom: 28
      }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? (current / total) * 100 : 0}%` }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{ background: `linear-gradient(90deg, ${palette.successMuted}, ${palette.success})`, boxShadow: `0 0 12px ${palette.success}40` }}
        />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? (pending / total) * 100 : 0}%` }}
          transition={{ duration: 1, delay: 0.4 }}
          style={{ background: `linear-gradient(90deg, ${palette.warningMuted}, ${palette.warning})` }}
        />
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${total > 0 ? (overdue / total) * 100 : 0}%` }}
          transition={{ duration: 1, delay: 0.5 }}
          style={{ background: `linear-gradient(90deg, ${palette.dangerMuted}, ${palette.danger})` }}
        />
      </div>
      
      {/* Legend */}
      <div style={{ display: "flex", gap: 32 }}>
        {[
          { label: "Current", value: current, color: palette.success },
          { label: "Pending", value: pending, color: palette.warning },
          { label: "Overdue", value: overdue, color: palette.danger }
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, boxShadow: `0 0 8px ${item.color}40` }} />
            <span style={{ fontSize: 18, fontWeight: 600, color: item.color }}>{item.value}</span>
            <span style={{ fontSize: 12, color: palette.textFaint }}>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

// Stat Card
const StatCard = ({ title, value, icon, status }: { title: string; value: number; icon: React.ReactNode; status: "good" | "warning" | "danger" | "neutral" }) => {
  const colorMap = {
    good: { color: palette.success, bg: palette.successBg, border: palette.successBorder },
    warning: { color: palette.warning, bg: palette.warningBg, border: palette.warningBorder },
    danger: { color: palette.danger, bg: palette.dangerBg, border: palette.dangerBorder },
    neutral: { color: palette.neutral, bg: palette.neutralBg, border: palette.border }
  };
  const c = colorMap[status];
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      style={{
        background: `linear-gradient(160deg, ${c.bg} 0%, rgba(0,0,0,0.15) 100%)`,
        borderRadius: 14,
        padding: "22px 20px",
        border: `1px solid ${c.border}`,
        boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        gap: 16
      }}
    >
      <div style={{
        width: 48,
        height: 48,
        borderRadius: 12,
        background: `${c.color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 22,
        color: c.color
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, color: palette.textFaint, marginTop: 6, textTransform: "uppercase", letterSpacing: 1 }}>{title}</div>
      </div>
    </motion.div>
  );
};

// Next Steps Widget
const NextSteps = () => {
  const items = [
    { icon: <UploadOutlined />, text: "Upload encryption evidence", due: "3 days", priority: "high" },
    { icon: <EditOutlined />, text: "Complete Q1 attestation", due: "5 days", priority: "medium" },
    { icon: <BugOutlined />, text: "Fix CIS-12 Logging control", due: "7 days", priority: "high" },
    { icon: <EyeOutlined />, text: "Review API anomalies", due: "10 days", priority: "low" }
  ];
  
  const priorityColor = (p: string) => p === "high" ? palette.danger : p === "medium" ? palette.warning : palette.success;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        background: `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
        borderRadius: 20,
        padding: 28,
        border: `1px solid ${palette.borderLight}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        height: "100%"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <ThunderboltOutlined style={{ color: palette.gold, fontSize: 22 }} />
        <span style={{ fontSize: 16, fontWeight: 600, color: palette.text }}>Next Required Actions</span>
      </div>
      
      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          whileHover={{ x: 4, background: "rgba(255,255,255,0.03)" }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "16px 14px",
            borderRadius: 10,
            marginBottom: 8,
            cursor: "pointer",
            borderLeft: `3px solid ${priorityColor(item.priority)}`
          }}
        >
          <span style={{ color: palette.textFaint, fontSize: 16 }}>{item.icon}</span>
          <span style={{ flex: 1, color: palette.text, fontSize: 13 }}>{item.text}</span>
          <Tag style={{
            background: `${priorityColor(item.priority)}15`,
            border: "none",
            color: priorityColor(item.priority),
            borderRadius: 4,
            fontSize: 10
          }}>
            {item.due}
          </Tag>
        </motion.div>
      ))}
    </motion.div>
  );
};

// Section Card wrapper
const SectionCard = ({ title, icon, extra, children }: { title: string; icon: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode }) => (
  <motion.div
    variants={itemVariants}
    style={{
      background: `linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
      borderRadius: 20,
      border: `1px solid ${palette.borderLight}`,
      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      overflow: "hidden",
      height: "100%"
    }}
  >
    <div style={{
      padding: "20px 28px",
      borderBottom: `1px solid ${palette.border}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ color: palette.success, fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 16, fontWeight: 600, color: palette.text }}>{title}</span>
      </div>
      {extra}
    </div>
    <div style={{ padding: 28 }}>{children}</div>
  </motion.div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export function ExecutiveDashboardTab({ 
  dashboardData, 
  onViewAllLogs, 
  onViewViolations,
  onExportPDF,
  onRunAssessment,
  autoRefresh = false,
  onAutoRefreshChange
}: Props) {
  const [refreshInterval] = useState(60);
  
  if (!dashboardData) return <Empty description="Loading dashboard data..." />;

  const { kpis, frameworkCoverage, criticalViolations, upcomingDeadlines, recentActivity, attestationStatus } = dashboardData;
  
  const auditScore = Math.round(
    (Number(kpis.overallComplianceScore) * 0.4) + 
    (attestationStatus.total > 0 ? (attestationStatus.current / attestationStatus.total) * 100 * 0.3 : 0) +
    (kpis.openViolations === 0 ? 30 : Math.max(0, 30 - kpis.openViolations * 5))
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Action Bar */}
      <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "flex-end", gap: 14, marginBottom: 32 }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12,
          padding: "10px 16px",
          background: "rgba(255,255,255,0.04)",
          borderRadius: 10,
          border: `1px solid ${palette.border}`
        }}>
          <SyncOutlined spin={autoRefresh} style={{ color: autoRefresh ? palette.success : palette.textFaint }} />
          <span style={{ fontSize: 12, color: palette.textMuted }}>Auto-refresh</span>
          <Switch size="small" checked={autoRefresh} onChange={onAutoRefreshChange} />
        </div>
        <Button 
          icon={<DownloadOutlined />}
          onClick={onExportPDF}
          style={{ 
            background: "rgba(255,255,255,0.04)", 
            borderColor: palette.border,
            color: palette.text,
            borderRadius: 10,
            height: 42
          }}
        >
          Export PDF
        </Button>
        <Button 
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={onRunAssessment}
          style={{ 
            background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)`,
            border: "none",
            boxShadow: `0 4px 20px ${palette.success}40`,
            borderRadius: 10,
            height: 42,
            fontWeight: 600
          }}
        >
          Run Assessment
        </Button>
      </motion.div>

      {/* Framework Cards */}
      <motion.div variants={itemVariants} style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 11, color: palette.textFaint, textTransform: "uppercase", letterSpacing: 2, marginBottom: 20, fontWeight: 500 }}>
          Framework Compliance
        </div>
        <Row gutter={[20, 20]}>
          {frameworkCoverage?.slice(0, 5).map((fw: any, i: number) => {
            const score = Number(fw.score) || 0;
            const total = fw.total_controls || 10;
            const passed = fw.passed_controls || Math.round(score / 100 * total);
            const trend = Math.floor(Math.random() * 10) - 3; // Demo data
            return (
              <Col xs={24} sm={12} md={8} lg={4} key={i} style={{ minWidth: 200 }}>
                <FrameworkCard
                  name={fw.framework_name || fw.name}
                  score={score}
                  passed={passed}
                  total={total}
                  status={fw.status}
                  trend={trend}
                  index={i}
                />
              </Col>
            );
          })}
        </Row>
      </motion.div>

      {/* Audit Readiness + Attestation */}
      <Row gutter={[28, 28]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={8}>
          <AuditReadiness score={auditScore} />
        </Col>
        <Col xs={24} lg={16}>
          <AttestationProgress 
            current={attestationStatus.current}
            pending={attestationStatus.pending}
            overdue={attestationStatus.overdue}
            total={attestationStatus.total}
          />
        </Col>
      </Row>

      {/* Stats Row */}
      <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
        <Col xs={12} sm={6}>
          <StatCard title="Violations" value={kpis.openViolations} icon={<AlertOutlined />} status={kpis.openViolations > 0 ? "danger" : "good"} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title="Critical" value={kpis.criticalFindings} icon={<ExclamationCircleOutlined />} status={kpis.criticalFindings > 0 ? "danger" : "good"} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title="Pending" value={kpis.pendingAttestations} icon={<FileSearchOutlined />} status={kpis.pendingAttestations > 5 ? "warning" : "good"} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title="Deadlines" value={kpis.upcomingDeadlinesCount} icon={<CalendarOutlined />} status="good" />
        </Col>
      </Row>

      {/* Next Steps + Critical Gaps */}
      <Row gutter={[28, 28]} style={{ marginBottom: 32 }}>
        <Col xs={24} lg={12}>
          <NextSteps />
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard 
            title="Critical Gaps" 
            icon={<AlertOutlined style={{ color: palette.danger }} />}
            extra={<Button type="link" size="small" onClick={onViewViolations} style={{ color: palette.success }}>View All</Button>}
          >
            {criticalViolations?.length > 0 ? (
              criticalViolations.slice(0, 4).map((item: Violation, i: number) => (
                <div key={i} style={{ 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: 14, 
                  padding: "16px 0",
                  borderBottom: i < 3 ? `1px solid ${palette.border}` : "none"
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: palette.danger, marginTop: 6, boxShadow: `0 0 8px ${palette.danger}60` }} />
                  <div>
                    <div style={{ color: palette.text, fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ color: palette.textFaint, fontSize: 11 }}>{item.endpoint_path} · {formatDate(item.detected_at)}</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: palette.success, marginBottom: 16 }} />
                <div style={{ color: palette.success, fontSize: 14 }}>No critical gaps</div>
              </div>
            )}
          </SectionCard>
        </Col>
      </Row>

      {/* Deadlines + Activity */}
      <Row gutter={[28, 28]}>
        <Col xs={24} lg={12}>
          <SectionCard title="Upcoming Deadlines" icon={<ScheduleOutlined />}>
            {upcomingDeadlines?.length > 0 ? (
              upcomingDeadlines.slice(0, 5).map((item: any, i: number) => {
                const urgent = new Date(item.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return (
                  <div key={i} style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between",
                    padding: "16px 0",
                    borderBottom: i < 4 ? `1px solid ${palette.border}` : "none"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: urgent ? palette.danger : palette.success, boxShadow: `0 0 8px ${urgent ? palette.danger : palette.success}50` }} />
                      <div>
                        <div style={{ color: palette.text, fontSize: 13, fontWeight: 500 }}>{item.title}</div>
                        <div style={{ color: palette.textFaint, fontSize: 11 }}>{item.framework_name}</div>
                      </div>
                    </div>
                    <Tag style={{ background: urgent ? palette.dangerBg : palette.successBg, border: "none", color: urgent ? palette.danger : palette.success, borderRadius: 6 }}>
                      {formatDate(item.deadline)}
                    </Tag>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", padding: "48px 0" }}>
                <CalendarOutlined style={{ fontSize: 48, color: palette.textFaint, marginBottom: 16 }} />
                <div style={{ color: palette.textFaint }}>No upcoming deadlines</div>
              </div>
            )}
          </SectionCard>
        </Col>
        <Col xs={24} lg={12}>
          <SectionCard 
            title="Recent Activity" 
            icon={<HistoryOutlined />}
            extra={<Button type="link" size="small" onClick={onViewAllLogs} style={{ color: palette.success }}>View All</Button>}
          >
            {recentActivity?.slice(0, 5).map((item: any, i: number) => (
              <div key={i} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 14,
                padding: "14px 0",
                borderBottom: i < 4 ? `1px solid ${palette.border}` : "none"
              }}>
                <Tag style={{ background: palette.successBg, border: "none", color: palette.success, borderRadius: 6, fontSize: 10 }}>
                  {item.event_type}
                </Tag>
                <span style={{ flex: 1, color: palette.textMuted, fontSize: 12 }}>{item.action}</span>
                <span style={{ color: palette.textFaint, fontSize: 11 }}>{formatDateTime(item.created_at)}</span>
              </div>
            ))}
          </SectionCard>
        </Col>
      </Row>
    </motion.div>
  );
}
