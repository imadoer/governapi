"use client";
import React, { useState } from "react";
import {
  BellAlertIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  WrenchIcon,
  BugAntIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Violation, RemediationTask } from "./types";

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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

const StatCard = ({
  title,
  value,
  icon,
  color,
  subtitle,
}: {
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

const SectionCard = ({
  title,
  icon,
  extra,
  children,
  noPadding,
}: {
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
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "18px 24px",
        borderBottom: `1px solid ${palette.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: palette.success, fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 600, color: palette.text }}>{title}</span>
      </div>
      {extra}
    </div>
    <div style={{ padding: noPadding ? 0 : 24 }}>{children}</div>
  </motion.div>
);

/* Pagination helper */
function usePagination<T>(data: T[], pageSize: number) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);
  return { page, totalPages, paginated, setPage };
}

function PaginationControls({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2 px-4 py-3" style={{ borderTop: `1px solid ${palette.border}` }}>
      <button
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-30"
        style={{ borderColor: palette.border, color: palette.textMuted }}
      >
        Prev
      </button>
      <span className="text-xs" style={{ color: palette.textMuted }}>
        {page} / {totalPages}
      </span>
      <button
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-30"
        style={{ borderColor: palette.border, color: palette.textMuted }}
      >
        Next
      </button>
    </div>
  );
}

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
  onUpdateRemediation,
}: Props) {
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [resolveNotes, setResolveNotes] = useState("");
  const [remediationModalOpen, setRemediationModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<RemediationTask | null>(null);
  const [taskNotes, setTaskNotes] = useState("");
  const [taskStatus, setTaskStatus] = useState("");

  const violationsPag = usePagination(violations, 10);
  const remediationPag = usePagination(remediationTasks, 10);
  const vendorsPag = usePagination(vendors || [], 5);

  const handleResolve = () => {
    if (selectedViolation) {
      onResolveViolation(selectedViolation.id, "User", resolveNotes);
      setResolveModalOpen(false);
      setResolveNotes("");
      setSelectedViolation(null);
    }
  };

  const handleUpdateTask = () => {
    if (selectedTask && onUpdateRemediation) {
      onUpdateRemediation(selectedTask.id, taskStatus, taskNotes);
      setRemediationModalOpen(false);
      setTaskNotes("");
      setSelectedTask(null);
    }
  };

  const getSeverityConfig = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return { color: palette.danger, bg: palette.dangerBg };
      case "high":
        return { color: "#f97316", bg: "rgba(249, 115, 22, 0.1)" };
      case "medium":
        return { color: palette.warning, bg: palette.warningBg };
      default:
        return { color: palette.success, bg: palette.successBg };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return { color: palette.danger, bg: palette.dangerBg };
      case "in_progress":
        return { color: palette.warning, bg: palette.warningBg };
      case "resolved":
      case "completed":
        return { color: palette.success, bg: palette.successBg };
      default:
        return { color: palette.neutral, bg: palette.neutralBg };
    }
  };

  const selectClass = "px-3 py-1.5 rounded-lg text-xs bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer";

  return (
    <motion.div initial="hidden" animate="visible">
      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="Total Violations"
          value={violationStats?.total || violations.length}
          icon={<BellAlertIcon className="w-6 h-6" />}
          color={palette.danger}
        />
        <StatCard
          title="Critical"
          value={violationStats?.bySeverity?.critical || 0}
          icon={<ExclamationCircleIcon className="w-6 h-6" />}
          color={palette.danger}
          subtitle="Immediate action required"
        />
        <StatCard
          title="Open"
          value={violationStats?.byStatus?.open || 0}
          icon={<ClockIcon className="w-6 h-6" />}
          color={palette.warning}
        />
        <StatCard
          title="Resolved"
          value={violationStats?.byStatus?.resolved || 0}
          icon={<CheckCircleIcon className="w-6 h-6" />}
          color={palette.success}
        />
      </div>

      {/* Violations Table */}
      <div style={{ marginBottom: 32 }}>
        <SectionCard
          title="Violations"
          icon={<BellAlertIcon className="w-5 h-5" style={{ color: palette.danger }} />}
          extra={
            <div className="flex gap-3">
              <select
                value={violationFilter.severity}
                onChange={(e) => onViolationFilterChange({ ...violationFilter, severity: e.target.value })}
                className={selectClass}
              >
                <option value="all">All Severity</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={violationFilter.status}
                onChange={(e) => onViolationFilterChange({ ...violationFilter, status: e.target.value })}
                className={selectClass}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          }
          noPadding
        >
          {violations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 100 }}>Severity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Title</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Endpoint</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 120 }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 120 }}>Detected</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {violationsPag.paginated.map((record) => {
                    const sevCfg = getSeverityConfig(record.severity);
                    const stCfg = getStatusConfig(record.status);
                    return (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${palette.border}` }}>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: sevCfg.bg, color: sevCfg.color }}>
                            {record.severity?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium" style={{ color: palette.text }}>{record.title}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs" style={{ color: palette.success }}>{record.endpoint_path}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: stCfg.bg, color: stCfg.color }}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: palette.textMuted }}>
                            {record.detected_at ? new Date(record.detected_at).toLocaleDateString() : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            title="Resolve"
                            onClick={() => { setSelectedViolation(record); setResolveModalOpen(true); }}
                            disabled={record.status === "resolved"}
                            className="p-1 rounded hover:bg-white/10 transition-colors disabled:opacity-30"
                            style={{ color: palette.success }}
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <PaginationControls page={violationsPag.page} totalPages={violationsPag.totalPages} setPage={violationsPag.setPage} />
            </div>
          ) : (
            <div className="py-12 text-center">
              <ShieldCheckIcon className="w-12 h-12 mx-auto mb-4" style={{ color: palette.success }} />
              <div className="text-sm" style={{ color: palette.success }}>No violations found</div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Remediation Tasks */}
      <div style={{ marginBottom: 32 }}>
        <SectionCard
          title="Remediation Tasks"
          icon={<WrenchIcon className="w-5 h-5" />}
          extra={
            <div className="flex gap-3">
              <select
                value={remediationFilter.priority}
                onChange={(e) => onRemediationFilterChange({ ...remediationFilter, priority: e.target.value })}
                className={selectClass}
              >
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={remediationFilter.status}
                onChange={(e) => onRemediationFilterChange({ ...remediationFilter, status: e.target.value })}
                className={selectClass}
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          }
          noPadding
        >
          {remediationTasks.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 100 }}>Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Task</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Assignee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 120 }}>Due Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 120 }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 100 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {remediationPag.paginated.map((record) => {
                    const priCfg = getSeverityConfig(record.priority);
                    const stCfg = getStatusConfig(record.status);
                    const isOverdue = record.due_date && new Date(record.due_date) < new Date();
                    return (
                      <tr key={record.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${palette.border}` }}>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: priCfg.bg, color: priCfg.color }}>
                            {record.priority?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium" style={{ color: palette.text }}>{record.title}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ color: palette.textMuted }}>{(record as any).assignee || "Unassigned"}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs" style={{ color: isOverdue ? palette.danger : palette.textMuted }}>
                            {record.due_date ? new Date(record.due_date).toLocaleDateString() : "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: stCfg.bg, color: stCfg.color }}>
                            {record.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            title="Update Status"
                            onClick={() => { setSelectedTask(record); setTaskStatus(record.status); setRemediationModalOpen(true); }}
                            className="p-1 rounded hover:bg-white/10 transition-colors"
                            style={{ color: palette.textMuted }}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <PaginationControls page={remediationPag.page} totalPages={remediationPag.totalPages} setPage={remediationPag.setPage} />
            </div>
          ) : (
            <div className="py-12 text-center">
              <CheckCircleIcon className="w-12 h-12 mx-auto mb-4" style={{ color: palette.success }} />
              <div className="text-sm" style={{ color: palette.success }}>No remediation tasks</div>
            </div>
          )}
        </SectionCard>
      </div>

      {/* Vendor Risk */}
      <SectionCard title="Vendor Risk" icon={<BugAntIcon className="w-5 h-5" />} noPadding>
        {vendors && vendors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Vendor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 120 }}>Risk Level</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Last Assessment</th>
                </tr>
              </thead>
              <tbody>
                {vendorsPag.paginated.map((v: any) => {
                  const riskCfg = getSeverityConfig(v.risk_level);
                  return (
                    <tr key={v.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${palette.border}` }}>
                      <td className="px-4 py-3"><span className="font-medium" style={{ color: palette.text }}>{v.name}</span></td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: riskCfg.bg, color: riskCfg.color }}>
                          {v.risk_level?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span style={{ color: palette.textMuted }}>{v.category}</span></td>
                      <td className="px-4 py-3">
                        <span className="text-xs" style={{ color: palette.textMuted }}>
                          {v.last_assessment ? new Date(v.last_assessment).toLocaleDateString() : "Never"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <PaginationControls page={vendorsPag.page} totalPages={vendorsPag.totalPages} setPage={vendorsPag.setPage} />
          </div>
        ) : (
          <div className="py-12 text-center">
            <ShieldCheckIcon className="w-12 h-12 mx-auto mb-4" style={{ color: palette.textFaint }} />
            <div className="text-sm" style={{ color: palette.textFaint }}>No vendors configured</div>
          </div>
        )}
      </SectionCard>

      {/* Resolve Violation Modal */}
      <AnimatePresence>
        {resolveModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => { setResolveModalOpen(false); setResolveNotes(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md mx-4 rounded-2xl"
              style={{ background: "#0f172a", border: `1px solid ${palette.borderLight}` }}
            >
              <div className="px-6 py-4" style={{ borderBottom: `1px solid ${palette.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: palette.text }}>Resolve Violation</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span style={{ color: palette.textMuted }}>Violation: </span>
                  <span className="font-semibold" style={{ color: palette.text }}>{selectedViolation?.title}</span>
                </div>
                <textarea
                  placeholder="Resolution notes..."
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => { setResolveModalOpen(false); setResolveNotes(""); }}
                    className="px-4 py-2 text-sm rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: palette.border, color: palette.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolve}
                    className="px-4 py-2 text-sm rounded-lg text-white font-medium border-0 transition-colors"
                    style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.success}dd 100%)` }}
                  >
                    Resolve
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Update Remediation Modal */}
      <AnimatePresence>
        {remediationModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => { setRemediationModalOpen(false); setTaskNotes(""); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md mx-4 rounded-2xl"
              style={{ background: "#0f172a", border: `1px solid ${palette.borderLight}` }}
            >
              <div className="px-6 py-4" style={{ borderBottom: `1px solid ${palette.border}` }}>
                <h3 className="text-base font-semibold" style={{ color: palette.text }}>Update Task</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span style={{ color: palette.textMuted }}>Task: </span>
                  <span className="font-semibold" style={{ color: palette.text }}>{selectedTask?.title}</span>
                </div>
                <select
                  value={taskStatus}
                  onChange={(e) => setTaskStatus(e.target.value)}
                  className="w-full mb-4 px-3 py-2 rounded-xl text-sm bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                <textarea
                  placeholder="Notes..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => { setRemediationModalOpen(false); setTaskNotes(""); }}
                    className="px-4 py-2 text-sm rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: palette.border, color: palette.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateTask}
                    className="px-4 py-2 text-sm rounded-lg text-white font-medium border-0 transition-colors"
                    style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.success}dd 100%)` }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
