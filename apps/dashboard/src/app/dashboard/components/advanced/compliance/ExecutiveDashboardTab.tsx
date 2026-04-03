"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { DashboardData, Violation, formatDate, formatDateTime } from "./types";

// ============================================================================
// PREMIUM COLOR PALETTE
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

const TrendIndicator = ({ value }: { value: number }) => {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: palette.textFaint }}>
        <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 8 2"><rect width="8" height="2" rx="1" /></svg>
        No change
      </span>
    );
  }
  const isPositive = value > 0;
  const color = isPositive ? palette.success : palette.danger;
  return (
    <span className="inline-flex items-center gap-1 text-[11px]" style={{ color }}>
      {isPositive ? (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
      ) : (
        <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
      )}
      {isPositive ? "+" : ""}{value}% this month
    </span>
  );
};

const MicroBlocks = ({ passed, total }: { passed: number; total: number }) => {
  const maxBlocks = 10;
  const passedBlocks = Math.round((passed / total) * maxBlocks);
  return (
    <div className="flex gap-[3px] cursor-help" title={`${passed} passed / ${total - passed} gaps / ${total} total`}>
      {Array.from({ length: maxBlocks }).map((_, i) => (
        <div
          key={i}
          className="w-2.5 h-4 rounded-sm transition-all duration-300"
          style={{
            background: i < passedBlocks ? palette.success : "rgba(255,255,255,0.12)",
            boxShadow: i < passedBlocks ? `0 0 6px ${palette.success}40` : "none",
          }}
        />
      ))}
    </div>
  );
};

const FrameworkCard = ({
  name, score, passed, total, status, trend, index
}: {
  name: string; score: number; passed: number; total: number; status: string; trend: number; index: number;
}) => {
  const numScore = Number(score) || 0;
  const gaps = total - passed;

  const getConfig = (s: string, sc: number) => {
    if (s === "compliant" || sc >= 90) return { color: palette.success, bg: palette.successBg, border: palette.successBorder, icon: "check" };
    if (s === "partial" || sc >= 60) return { color: palette.warning, bg: palette.warningBg, border: palette.warningBorder, icon: "warning" };
    return { color: palette.danger, bg: palette.dangerBg, border: palette.dangerBorder, icon: "close" };
  };

  const config = getConfig(status, numScore);

  const statusIcon = config.icon === "check" ? (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
  ) : config.icon === "warning" ? (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
  ) : (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -6, boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}
      className="rounded-2xl cursor-pointer h-full flex flex-col relative overflow-hidden"
      style={{
        background: `linear-gradient(145deg, ${config.bg} 0%, rgba(255,255,255,0.02) 100%)`,
        padding: "24px 22px",
        border: `1px solid ${config.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <div className="absolute -top-10 -right-10 w-[100px] h-[100px] rounded-full" style={{ background: `radial-gradient(circle, ${config.color}15 0%, transparent 70%)` }} />
      <div className="flex justify-between items-start mb-5">
        <span className="text-sm font-semibold text-white/90 tracking-wide">{name}</span>
        <span style={{ color: config.color }} className="text-sm">{statusIcon}</span>
      </div>
      <div className="mb-2">
        <span className="text-[44px] font-bold leading-none" style={{ color: config.color }}>{numScore.toFixed(0)}</span>
        <span className="text-xl ml-0.5" style={{ color: palette.textFaint }}>%</span>
      </div>
      <div className="mb-[18px]"><TrendIndicator value={trend} /></div>
      <div className="mb-[18px]"><MicroBlocks passed={passed} total={total} /></div>
      <div className="flex justify-between mt-auto pt-4 text-xs" style={{ borderTop: `1px solid ${palette.border}` }}>
        <span style={{ color: palette.success }}>{passed} passed</span>
        <span style={{ color: gaps > 0 ? palette.danger : palette.textFaint }}>{gaps} gaps</span>
        <span style={{ color: palette.textFaint }}>{total} total</span>
      </div>
    </motion.div>
  );
};

const AuditReadinessWidget = ({ score }: { score: number }) => {
  const isReady = score >= 80;
  const color = isReady ? palette.success : score >= 60 ? palette.gold : palette.danger;
  const borderColor = isReady ? palette.successBorder : score >= 60 ? palette.goldBorder : palette.dangerBorder;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl h-full flex flex-col"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        borderRadius: 20,
        padding: 32,
        border: `1px solid ${borderColor}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div className="text-[11px] uppercase tracking-[2px] mb-7 font-medium" style={{ color: palette.textFaint }}>Audit Readiness</div>
      <div className="relative w-[140px] h-[160px] mx-auto mb-7">
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
        <div className="absolute top-[38%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="text-[42px] font-bold leading-none"
            style={{ color }}
          >
            {score}
          </motion.div>
          <div className="text-xs mt-1" style={{ color: palette.textFaint }}>/100</div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl mb-7" style={{
        background: isReady ? palette.successBg : palette.goldBg,
        border: `1px solid ${isReady ? palette.successBorder : palette.goldBorder}`,
      }}>
        {isReady ? (
          <svg className="w-4 h-4" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-4 h-4" style={{ color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        )}
        <span className="font-semibold text-[13px] tracking-wide" style={{ color }}>
          {isReady ? "AUDIT READY" : "NEEDS ATTENTION"}
        </span>
      </div>

      <div className="mt-auto">
        <div className="text-[10px] uppercase tracking-[1.5px] mb-4" style={{ color: palette.textFaint }}>Recent Activity</div>
        {[
          { label: "Assessment run", time: "2 days ago" },
          { label: "Evidence updated", time: "5 hours ago" },
          { label: "Policy changed", time: "1 week ago" }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3 mb-3 text-xs">
            <span style={{ color: palette.textFaint }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /></svg>
            </span>
            <span className="flex-1" style={{ color: palette.textMuted }}>{item.label}</span>
            <span style={{ color: palette.text }}>{item.time}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

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
      className="rounded-2xl h-full"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        padding: 32,
        border: `1px solid ${palette.borderLight}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div className="flex justify-between items-center mb-7">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-base font-semibold text-white/90">Attestation Progress</span>
        </div>
        <span className="px-2.5 py-1 rounded-md text-[11px]" style={{
          background: overdue > 0 ? palette.dangerBg : palette.successBg,
          color: overdue > 0 ? palette.danger : palette.success,
        }}>
          {overdue > 0 ? `${overdue} overdue` : "On track"}
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-[56px] font-bold leading-none" style={{ color: scoreColor }}>{pct}</span>
        <span className="text-2xl" style={{ color: palette.textFaint }}>%</span>
        <span className="text-sm ml-2" style={{ color: palette.textMuted }}>complete</span>
      </div>

      <div className="text-sm mb-7" style={{ color: palette.textMuted }}>
        <strong style={{ color: palette.text }}>{pending}</strong> controls pending ·
        <strong style={{ color: overdue > 0 ? palette.danger : palette.text }}> {overdue}</strong> overdue ·
        Next due in <strong style={{ color: palette.text }}>5 days</strong>
      </div>

      {/* Progress Bar */}
      <div className="h-3 bg-white/[0.08] rounded-md overflow-hidden flex mb-7">
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

      <div className="flex gap-8">
        {[
          { label: "Current", value: current, color: palette.success },
          { label: "Pending", value: pending, color: palette.warning },
          { label: "Overdue", value: overdue, color: palette.danger }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}40` }} />
            <span className="text-lg font-semibold" style={{ color: item.color }}>{item.value}</span>
            <span className="text-xs" style={{ color: palette.textFaint }}>{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

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
      className="rounded-2xl flex items-center gap-4"
      style={{
        background: `linear-gradient(160deg, ${c.bg} 0%, rgba(0,0,0,0.15) 100%)`,
        padding: "22px 20px",
        border: `1px solid ${c.border}`,
        boxShadow: "0 6px 24px rgba(0,0,0,0.25)",
      }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px]" style={{ background: `${c.color}15`, color: c.color }}>
        {icon}
      </div>
      <div>
        <div className="text-[28px] font-bold leading-none" style={{ color: c.color }}>{value}</div>
        <div className="text-[11px] mt-1.5 uppercase tracking-wider" style={{ color: palette.textFaint }}>{title}</div>
      </div>
    </motion.div>
  );
};

const NextSteps = () => {
  const items = [
    { text: "Upload encryption evidence", due: "3 days", priority: "high" },
    { text: "Complete Q1 attestation", due: "5 days", priority: "medium" },
    { text: "Fix CIS-12 Logging control", due: "7 days", priority: "high" },
    { text: "Review API anomalies", due: "10 days", priority: "low" }
  ];

  const priorityColor = (p: string) => p === "high" ? palette.danger : p === "medium" ? palette.warning : palette.success;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl h-full"
      style={{
        background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
        padding: 28,
        border: `1px solid ${palette.borderLight}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <svg className="w-5 h-5" style={{ color: palette.gold }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-base font-semibold text-white/90">Next Required Actions</span>
      </div>

      {items.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }}
          whileHover={{ x: 4, background: "rgba(255,255,255,0.03)" }}
          className="flex items-center gap-3.5 py-4 px-3.5 rounded-xl mb-2 cursor-pointer"
          style={{ borderLeft: `3px solid ${priorityColor(item.priority)}` }}
        >
          <svg className="w-4 h-4" style={{ color: palette.textFaint }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3" />
          </svg>
          <span className="flex-1 text-[13px] text-white/90">{item.text}</span>
          <span className="px-2 py-0.5 rounded text-[10px]" style={{
            background: `${priorityColor(item.priority)}15`,
            color: priorityColor(item.priority),
          }}>
            {item.due}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
};

const SectionCard = ({ title, icon, extra, children }: { title: string; icon: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode }) => (
  <motion.div
    variants={itemVariants}
    className="rounded-2xl overflow-hidden h-full"
    style={{
      background: "linear-gradient(145deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
      border: `1px solid ${palette.borderLight}`,
      boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
    }}
  >
    <div className="px-7 py-5 flex items-center justify-between" style={{ borderBottom: `1px solid ${palette.border}` }}>
      <div className="flex items-center gap-3">
        <span className="text-xl" style={{ color: palette.success }}>{icon}</span>
        <span className="text-base font-semibold text-white/90">{title}</span>
      </div>
      {extra}
    </div>
    <div className="p-7">{children}</div>
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

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/40">
        <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        Loading dashboard data...
      </div>
    );
  }

  const { kpis, frameworkCoverage, criticalViolations, upcomingDeadlines, recentActivity, attestationStatus } = dashboardData;

  const auditScore = Math.round(
    (Number(kpis.overallComplianceScore) * 0.4) +
    (attestationStatus.total > 0 ? (attestationStatus.current / attestationStatus.total) * 100 * 0.3 : 0) +
    (kpis.openViolations === 0 ? 30 : Math.max(0, 30 - kpis.openViolations * 5))
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Action Bar */}
      <motion.div variants={itemVariants} className="flex justify-end gap-3.5 mb-8">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          <svg className={`w-4 h-4 ${autoRefresh ? "animate-spin text-cyan-500" : "text-white/30"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-xs text-white/50">Auto-refresh</span>
          <button
            onClick={() => onAutoRefreshChange?.(!autoRefresh)}
            className={`relative w-9 h-5 rounded-full transition-colors ${autoRefresh ? "bg-cyan-500" : "bg-white/10"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${autoRefresh ? "translate-x-4" : "translate-x-0.5"}`} />
          </button>
        </div>
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 h-[42px] rounded-xl bg-white/[0.04] border border-white/[0.06] text-white/90 hover:bg-white/[0.08] transition-all text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
        <button
          onClick={onRunAssessment}
          className="flex items-center gap-2 px-5 h-[42px] rounded-xl font-semibold text-white text-sm hover:brightness-110 transition-all"
          style={{
            background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)`,
            boxShadow: `0 4px 20px ${palette.success}40`,
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          </svg>
          Run Assessment
        </button>
      </motion.div>

      {/* Framework Cards */}
      <motion.div variants={itemVariants} className="mb-8">
        <div className="text-[11px] uppercase tracking-[2px] mb-5 font-medium" style={{ color: palette.textFaint }}>Framework Compliance</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {frameworkCoverage?.slice(0, 5).map((fw: any, i: number) => {
            const score = Number(fw.score) || 0;
            const total = fw.total_controls || 10;
            const passed = fw.passed_controls || Math.round(score / 100 * total);
            const trend = Math.floor(Math.random() * 10) - 3;
            return (
              <FrameworkCard
                key={i}
                name={fw.framework_name || fw.name}
                score={score}
                passed={passed}
                total={total}
                status={fw.status}
                trend={trend}
                index={i}
              />
            );
          })}
        </div>
      </motion.div>

      {/* Audit Readiness + Attestation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-7 mb-8">
        <div className="lg:col-span-1">
          <AuditReadinessWidget score={auditScore} />
        </div>
        <div className="lg:col-span-2">
          <AttestationProgress
            current={attestationStatus.current}
            pending={attestationStatus.pending}
            overdue={attestationStatus.overdue}
            total={attestationStatus.total}
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
        <StatCard title="Violations" value={kpis.openViolations} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
        } status={kpis.openViolations > 0 ? "danger" : "good"} />
        <StatCard title="Critical" value={kpis.criticalFindings} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        } status={kpis.criticalFindings > 0 ? "danger" : "good"} />
        <StatCard title="Pending" value={kpis.pendingAttestations} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        } status={kpis.pendingAttestations > 5 ? "warning" : "good"} />
        <StatCard title="Deadlines" value={kpis.upcomingDeadlinesCount} icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        } status="good" />
      </div>

      {/* Next Steps + Critical Gaps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7 mb-8">
        <NextSteps />
        <SectionCard
          title="Critical Gaps"
          icon={<svg className="w-5 h-5" style={{ color: palette.danger }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>}
          extra={<button onClick={onViewViolations} className="text-cyan-500 hover:text-cyan-400 text-sm transition-colors">View All</button>}
        >
          {criticalViolations?.length > 0 ? (
            criticalViolations.slice(0, 4).map((item: Violation, i: number) => (
              <div key={i} className="flex items-start gap-3.5 py-4" style={{ borderBottom: i < 3 ? `1px solid ${palette.border}` : "none" }}>
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: palette.danger, boxShadow: `0 0 8px ${palette.danger}60` }} />
                <div>
                  <div className="text-[13px] font-medium text-white/90 mb-1">{item.title}</div>
                  <div className="text-[11px]" style={{ color: palette.textFaint }}>{item.endpoint_path} · {formatDate(item.detected_at)}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: palette.success }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
              </svg>
              <div className="text-sm" style={{ color: palette.success }}>No critical gaps</div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Deadlines + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
        <SectionCard title="Upcoming Deadlines" icon={
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        }>
          {upcomingDeadlines?.length > 0 ? (
            upcomingDeadlines.slice(0, 5).map((item: any, i: number) => {
              const urgent = new Date(item.deadline) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              return (
                <div key={i} className="flex items-center justify-between py-4" style={{ borderBottom: i < 4 ? `1px solid ${palette.border}` : "none" }}>
                  <div className="flex items-center gap-3.5">
                    <div className="w-2 h-2 rounded-full" style={{
                      background: urgent ? palette.danger : palette.success,
                      boxShadow: `0 0 8px ${urgent ? palette.danger : palette.success}50`
                    }} />
                    <div>
                      <div className="text-[13px] font-medium text-white/90">{item.title}</div>
                      <div className="text-[11px]" style={{ color: palette.textFaint }}>{item.framework_name}</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-md text-xs" style={{
                    background: urgent ? palette.dangerBg : palette.successBg,
                    color: urgent ? palette.danger : palette.success,
                  }}>
                    {formatDate(item.deadline)}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <svg className="w-12 h-12 mx-auto mb-4" style={{ color: palette.textFaint }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div style={{ color: palette.textFaint }}>No upcoming deadlines</div>
            </div>
          )}
        </SectionCard>
        <SectionCard
          title="Recent Activity"
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          extra={<button onClick={onViewAllLogs} className="text-cyan-500 hover:text-cyan-400 text-sm transition-colors">View All</button>}
        >
          {recentActivity?.slice(0, 5).map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-3.5 py-3.5" style={{ borderBottom: i < 4 ? `1px solid ${palette.border}` : "none" }}>
              <span className="px-2 py-0.5 rounded-md text-[10px]" style={{ background: palette.successBg, color: palette.success }}>
                {item.event_type}
              </span>
              <span className="flex-1 text-xs" style={{ color: palette.textMuted }}>{item.action}</span>
              <span className="text-[11px]" style={{ color: palette.textFaint }}>{formatDateTime(item.created_at)}</span>
            </div>
          ))}
        </SectionCard>
      </div>
    </motion.div>
  );
}
