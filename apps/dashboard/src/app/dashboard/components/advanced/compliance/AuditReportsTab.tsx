"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AuditLogEntry, AuditReadiness, getScoreColor, formatDateTime } from "./types";

interface Props {
  auditLogs: AuditLogEntry[];
  auditReadiness: AuditReadiness[];
  onGenerateReport: (reportType: string, format: string) => void;
}

const palette = {
  success: "#06b6d4",
  successBg: "rgba(6, 182, 212, 0.1)",
  warning: "#8b5cf6",
  warningBg: "rgba(139, 92, 246, 0.1)",
  danger: "#e11d48",
  text: "rgba(255, 255, 255, 0.9)",
  textMuted: "rgba(255, 255, 255, 0.55)",
  textFaint: "rgba(255, 255, 255, 0.35)",
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  cardBg: "rgba(255, 255, 255, 0.04)",
};

export function AuditReportsTab({ auditLogs, auditReadiness, onGenerateReport }: Props) {
  const [activeSubTab, setActiveSubTab] = useState("readiness");
  const [detailModal, setDetailModal] = useState<AuditLogEntry | null>(null);
  const [logPage, setLogPage] = useState(0);
  const logsPerPage = 20;

  const subTabs = [
    { key: "readiness", label: "Audit Readiness", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
    )},
    { key: "logs", label: "Audit Log", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
    )},
    { key: "reports", label: "Reports", icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
    )},
  ];

  const reports = [
    { name: "SOC 2 Type II Alignment Report", type: "soc2", format: "PDF", description: "Full SOC 2 control assessment with evidence mapping" },
    { name: "ISO 27001 Gap Analysis", type: "iso27001", format: "PDF", description: "Gap analysis against ISO 27001:2022 controls" },
    { name: "API Risk Assessment", type: "api-risk", format: "PDF", description: "Comprehensive API risk scoring and analysis" },
    { name: "Vendor Risk Report", type: "vendor", format: "PDF", description: "Third-party vendor risk assessment" },
    { name: "Executive Governance Summary", type: "executive", format: "PDF", description: "Board-ready compliance overview" },
  ];

  const pagedLogs = auditLogs.slice(logPage * logsPerPage, (logPage + 1) * logsPerPage);
  const totalLogPages = Math.ceil(auditLogs.length / logsPerPage);

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSubTab === tab.key
                ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/25"
                : "text-white/50 hover:text-white/70 hover:bg-white/5 border border-transparent"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Readiness Tab */}
      {activeSubTab === "readiness" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {auditReadiness.length > 0 ? auditReadiness.map((ar) => {
            const scoreColor = getScoreColor(ar.overallScore);
            return (
              <motion.div
                key={ar.frameworkId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden"
                style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)" }}
              >
                <div className="p-5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3 mb-4">
                    <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span className="text-white/90 font-semibold text-sm">{ar.frameworkName}</span>
                    <span className={`ml-auto px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      ar.readyForAudit
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-amber-500/15 text-amber-400"
                    }`}>
                      {ar.readyForAudit ? "AUDIT READY" : "NOT READY"}
                    </span>
                  </div>

                  {/* Circle Score */}
                  <div className="flex justify-center mb-4">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                        <circle
                          cx="50" cy="50" r="42" fill="none"
                          stroke={scoreColor}
                          strokeWidth="6"
                          strokeLinecap="round"
                          strokeDasharray={`${ar.overallScore * 2.64} 264`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold" style={{ color: scoreColor }}>{ar.overallScore}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Score Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Evidence", value: ar.scores.evidence },
                      { label: "Controls", value: ar.scores.controls },
                      { label: "Attestations", value: ar.scores.attestations },
                      { label: "Remediation", value: ar.scores.remediation },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <div className="text-lg font-bold text-white/90">{s.value}<span className="text-xs text-white/40">%</span></div>
                        <div className="text-[10px] text-white/40 uppercase tracking-wider">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {ar.recommendations.length > 0 && (
                  <div className="p-4">
                    <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Recommendations</div>
                    <ul className="text-xs text-white/50 space-y-1 pl-4 list-disc">
                      {ar.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            );
          }) : (
            <div className="col-span-full text-center py-16 text-white/40">
              No audit readiness data available
            </div>
          )}
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeSubTab === "logs" && (
        <div className="rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)" }}>
          {/* Info Banner */}
          <div className="m-5 p-4 rounded-xl bg-cyan-500/[0.07] border border-cyan-500/20 flex items-start gap-3">
            <svg className="w-5 h-5 text-cyan-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-cyan-400 text-sm font-medium mb-1">Compliance Audit Trail</div>
              <div className="text-cyan-400/60 text-xs">This log is immutable and cryptographically signed. All compliance-related changes are recorded for audit purposes.</div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Timestamp", "Event", "Category", "Entity", "Action", "Actor", "Details"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[11px] text-white/40 uppercase tracking-wider font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pagedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3 text-white/50 text-xs whitespace-nowrap">{formatDateTime(log.created_at)}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 rounded-md bg-white/[0.06] text-white/70 text-xs">{log.event_type}</span>
                    </td>
                    <td className="px-5 py-3 text-white/60 text-xs">{log.event_category}</td>
                    <td className="px-5 py-3">
                      <code className="text-cyan-400/80 text-xs bg-cyan-500/[0.08] px-2 py-0.5 rounded">{log.entity_type}:{log.entity_id}</code>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-1 rounded-md bg-blue-500/10 text-blue-400 text-xs">{log.action}</span>
                    </td>
                    <td className="px-5 py-3 text-white/60 text-xs">{log.actor_name}</td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setDetailModal(log)}
                        className="text-cyan-400 hover:text-cyan-300 text-xs transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalLogPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/[0.06]">
              <span className="text-xs text-white/40">Page {logPage + 1} of {totalLogPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setLogPage(Math.max(0, logPage - 1))}
                  disabled={logPage === 0}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setLogPage(Math.min(totalLogPages - 1, logPage + 1))}
                  disabled={logPage >= totalLogPages - 1}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 disabled:opacity-30 transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reports Tab */}
      {activeSubTab === "reports" && (
        <div className="rounded-2xl border border-white/10 backdrop-blur-xl overflow-hidden" style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)" }}>
          {/* Info Banner */}
          <div className="m-5 p-4 rounded-xl bg-cyan-500/[0.07] border border-cyan-500/20 flex items-start gap-3">
            <svg className="w-5 h-5 text-cyan-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-cyan-400 text-sm font-medium mb-1">Report Generation</div>
              <div className="text-cyan-400/60 text-xs">Generate audit-ready compliance reports. Reports include current control status, evidence mapping, and recommendations.</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
            {reports.map((report) => (
              <motion.div
                key={report.type}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-all cursor-pointer"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white/90 text-sm font-semibold">{report.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-white/50 text-[10px] uppercase tracking-wider">{report.format}</span>
                </div>
                <p className="text-white/40 text-xs mb-4">{report.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => onGenerateReport(report.type, "pdf")}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-gradient-to-r from-cyan-500 to-cyan-600 text-white hover:from-cyan-400 hover:to-cyan-500 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    PDF
                  </button>
                  <button
                    onClick={() => onGenerateReport(report.type, "json")}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    JSON
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {detailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setDetailModal(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-xl rounded-2xl border border-white/10 p-6 shadow-2xl"
              style={{ background: "#0f172a" }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/90 font-semibold">Audit Details</h3>
                <button onClick={() => setDetailModal(null)} className="text-white/40 hover:text-white/70 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <pre className="max-h-[400px] overflow-auto text-xs text-white/60 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                {JSON.stringify({ old: detailModal.old_value, new: detailModal.new_value }, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
