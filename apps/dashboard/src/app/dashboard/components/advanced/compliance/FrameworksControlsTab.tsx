"use client";
import React, { useState, useCallback } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Framework, Control, Policy, Evidence, Attestation } from "./types";

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
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
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

const FrameworkCard = ({
  framework,
  index,
  onClick,
}: {
  framework: Framework;
  index: number;
  onClick: () => void;
}) => {
  const score = Number(framework.score) || 0;
  const passedControls = framework.passedControls || 0;
  const failedControls = framework.failedControls || 0;
  const totalControls = framework.totalControls || 0;

  const getConfig = (status: string, sc: number) => {
    if (status === "compliant" || sc >= 90)
      return {
        color: palette.success,
        bg: palette.successBg,
        border: palette.successBorder,
        label: "Compliant",
        icon: <CheckCircleIcon className="w-3.5 h-3.5" />,
      };
    if (status === "partial" || sc >= 60)
      return {
        color: palette.warning,
        bg: palette.warningBg,
        border: palette.warningBorder,
        label: "Partial",
        icon: <ExclamationTriangleIcon className="w-3.5 h-3.5" />,
      };
    if (sc === 0)
      return {
        color: palette.neutral,
        bg: palette.neutralBg,
        border: palette.neutralBorder,
        label: "Not Started",
        icon: <ClockIcon className="w-3.5 h-3.5" />,
      };
    return {
      color: palette.danger,
      bg: palette.dangerBg,
      border: palette.dangerBorder,
      label: "At Risk",
      icon: <XCircleIcon className="w-3.5 h-3.5" />,
    };
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
        position: "relative",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: palette.text }}>{framework.name}</span>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
          style={{
            background: `${config.color}15`,
            color: config.color,
          }}
        >
          {config.icon} {config.label}
        </span>
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
              boxShadow: score > 0 ? `0 0 8px ${config.color}40` : "none",
            }}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: config.color }}>{score.toFixed(0)}%</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: "auto",
          paddingTop: 12,
          borderTop: `1px solid ${palette.border}`,
          fontSize: 12,
        }}
      >
        <span style={{ color: palette.success }}>&#10003; {passedControls}</span>
        <span style={{ color: palette.danger }}>&#10007; {failedControls}</span>
        <span style={{ color: palette.textFaint }}>&#9678; {totalControls}</span>
      </div>

      <div style={{ position: "absolute", bottom: 16, right: 16, color: palette.textFaint, fontSize: 12 }}>
        <ChevronRightIcon className="w-4 h-4" />
      </div>
    </motion.div>
  );
};

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
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginated = data.slice((page - 1) * pageSize, page * pageSize);
  return { page, totalPages, paginated, setPage };
}

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
  userName,
}: Props) {
  const [policyModalOpen, setPolicyModalOpen] = useState(false);
  const [controlDrawerOpen, setControlDrawerOpen] = useState(false);
  const [selectedControl, setSelectedControl] = useState<Control | null>(null);
  const [attestModalOpen, setAttestModalOpen] = useState(false);
  const [attestNotes, setAttestNotes] = useState("");

  // Policy form state
  const [policyName, setPolicyName] = useState("");
  const [policyDescription, setPolicyDescription] = useState("");
  const [policyOwner, setPolicyOwner] = useState("");

  const controlsPag = usePagination(controls, 10);
  const policiesPag = usePagination(policies, 5);

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

  const handlePolicySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreatePolicy({ name: policyName, description: policyDescription, owner: policyOwner });
    setPolicyModalOpen(false);
    setPolicyName("");
    setPolicyDescription("");
    setPolicyOwner("");
  };

  const resetPolicyForm = () => {
    setPolicyName("");
    setPolicyDescription("");
    setPolicyOwner("");
  };

  return (
    <motion.div initial="hidden" animate="visible">
      {/* Framework Grid */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            fontSize: 11,
            color: palette.textFaint,
            textTransform: "uppercase",
            letterSpacing: 2,
            marginBottom: 20,
            fontWeight: 500,
          }}
        >
          All Frameworks ({frameworks.length})
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {frameworks.map((fw, i) => (
            <FrameworkCard key={fw.id} framework={fw} index={i} onClick={() => handleFrameworkClick(fw)} />
          ))}
        </div>
      </div>

      {/* Selected Framework Controls */}
      {selectedFramework && (
        <div style={{ marginBottom: 32 }}>
          <SectionCard
            title={`${selectedFramework.name} Controls`}
            icon={<ShieldCheckIcon className="w-5 h-5" />}
            extra={
              <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium"
                style={{ background: palette.successBg, color: palette.success }}
              >
                {controls.length} Controls
              </span>
            }
            noPadding
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 120 }}>Control ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 120 }}>Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 100 }}>Evidence</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {controlsPag.paginated.map((record) => {
                    const statusCfg =
                      record.status === "implemented"
                        ? { color: palette.success, bg: palette.successBg }
                        : record.status === "partial"
                        ? { color: palette.warning, bg: palette.warningBg }
                        : { color: palette.danger, bg: palette.dangerBg };
                    return (
                      <tr
                        key={record.id}
                        className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                        style={{ borderBottom: `1px solid ${palette.border}` }}
                        onClick={() => handleControlClick(record)}
                      >
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs" style={{ color: palette.success }}>{record.controlId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium" style={{ color: palette.text }}>{record.controlName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: statusCfg.bg, color: statusCfg.color }}>{record.status}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span style={{ color: (record.evidenceCount || 0) > 0 ? palette.success : palette.textFaint }}>{record.evidenceCount || 0} files</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              title="View"
                              onClick={(e) => { e.stopPropagation(); handleControlClick(record); }}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                              style={{ color: palette.textMuted }}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              title="Attest"
                              onClick={(e) => { e.stopPropagation(); setSelectedControl(record); setAttestModalOpen(true); }}
                              className="p-1 rounded hover:bg-white/10 transition-colors"
                              style={{ color: palette.success }}
                            >
                              <CheckCircleIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {/* Pagination */}
              {controlsPag.totalPages > 1 && (
                <div className="flex items-center justify-end gap-2 px-4 py-3" style={{ borderTop: `1px solid ${palette.border}` }}>
                  <button
                    onClick={() => controlsPag.setPage(Math.max(1, controlsPag.page - 1))}
                    disabled={controlsPag.page === 1}
                    className="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-30"
                    style={{ borderColor: palette.border, color: palette.textMuted }}
                  >
                    Prev
                  </button>
                  <span className="text-xs" style={{ color: palette.textMuted }}>
                    {controlsPag.page} / {controlsPag.totalPages}
                  </span>
                  <button
                    onClick={() => controlsPag.setPage(Math.min(controlsPag.totalPages, controlsPag.page + 1))}
                    disabled={controlsPag.page === controlsPag.totalPages}
                    className="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-30"
                    style={{ borderColor: palette.border, color: palette.textMuted }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </SectionCard>
        </div>
      )}

      {/* Policies Section */}
      <SectionCard
        title="Policies"
        icon={<DocumentTextIcon className="w-5 h-5" />}
        extra={
          <button
            onClick={() => setPolicyModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white border-0 transition-colors"
            style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)` }}
          >
            <PlusIcon className="w-3.5 h-3.5" /> Add Policy
          </button>
        }
        noPadding
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Policy Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 80 }}>Version</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint, width: 100 }}>Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: palette.textFaint }}>Owner</th>
              </tr>
            </thead>
            <tbody>
              {policiesPag.paginated.map((p: any) => {
                const cfg =
                  p.status === "active"
                    ? { color: palette.success, bg: palette.successBg }
                    : p.status === "draft"
                    ? { color: palette.warning, bg: palette.warningBg }
                    : { color: palette.textFaint, bg: palette.neutralBg };
                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: `1px solid ${palette.border}` }}>
                    <td className="px-4 py-3"><span className="font-medium" style={{ color: palette.text }}>{p.name}</span></td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs" style={{ background: palette.neutralBg, color: palette.textMuted }}>v{p.version}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium" style={{ background: cfg.bg, color: cfg.color }}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3"><span style={{ color: palette.textMuted }}>{p.owner}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {policiesPag.totalPages > 1 && (
            <div className="flex items-center justify-end gap-2 px-4 py-3" style={{ borderTop: `1px solid ${palette.border}` }}>
              <button
                onClick={() => policiesPag.setPage(Math.max(1, policiesPag.page - 1))}
                disabled={policiesPag.page === 1}
                className="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-30"
                style={{ borderColor: palette.border, color: palette.textMuted }}
              >
                Prev
              </button>
              <span className="text-xs" style={{ color: palette.textMuted }}>
                {policiesPag.page} / {policiesPag.totalPages}
              </span>
              <button
                onClick={() => policiesPag.setPage(Math.min(policiesPag.totalPages, policiesPag.page + 1))}
                disabled={policiesPag.page === policiesPag.totalPages}
                className="px-3 py-1 text-xs rounded border transition-colors disabled:opacity-30"
                style={{ borderColor: palette.border, color: palette.textMuted }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Policy Modal */}
      <AnimatePresence>
        {policyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => { setPolicyModalOpen(false); resetPolicyForm(); }}
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
                <h3 className="text-base font-semibold" style={{ color: palette.text }}>Create Policy</h3>
              </div>
              <form onSubmit={handlePolicySubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: palette.textMuted }}>Policy Name</label>
                  <input
                    type="text"
                    required
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: palette.textMuted }}>Description</label>
                  <textarea
                    rows={3}
                    value={policyDescription}
                    onChange={(e) => setPolicyDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: palette.textMuted }}>Owner</label>
                  <input
                    type="text"
                    value={policyOwner}
                    onChange={(e) => setPolicyOwner(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => { setPolicyModalOpen(false); resetPolicyForm(); }}
                    className="px-4 py-2 text-sm rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: palette.border, color: palette.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm rounded-lg text-white font-medium border-0 transition-colors"
                    style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)` }}
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Attest Modal */}
      <AnimatePresence>
        {attestModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => { setAttestModalOpen(false); setAttestNotes(""); }}
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
                <h3 className="text-base font-semibold" style={{ color: palette.text }}>Attest Control</h3>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <span style={{ color: palette.textMuted }}>Control: </span>
                  <span className="font-semibold" style={{ color: palette.text }}>{selectedControl?.controlName}</span>
                </div>
                <textarea
                  placeholder="Add attestation notes..."
                  value={attestNotes}
                  onChange={(e) => setAttestNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl text-sm bg-slate-900/50 border border-white/10 text-white focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => { setAttestModalOpen(false); setAttestNotes(""); }}
                    className="px-4 py-2 text-sm rounded-lg border transition-colors hover:bg-white/5"
                    style={{ borderColor: palette.border, color: palette.textMuted }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAttest}
                    className="px-4 py-2 text-sm rounded-lg text-white font-medium border-0 transition-colors"
                    style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)` }}
                  >
                    Submit Attestation
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Control Drawer (slide-in panel) */}
      <AnimatePresence>
        {controlDrawerOpen && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setControlDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-[500px] h-full overflow-y-auto"
              style={{ background: "#0f172a" }}
            >
              <div
                className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
                style={{ background: "#0f172a", borderBottom: `1px solid ${palette.border}` }}
              >
                <span className="text-base font-semibold" style={{ color: palette.text }}>
                  {selectedControl?.controlName}
                </span>
                <button
                  onClick={() => setControlDrawerOpen(false)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  style={{ color: palette.textMuted }}
                >
                  <XCircleIcon className="w-5 h-5" />
                </button>
              </div>
              {selectedControl && (
                <div className="p-6">
                  <div className="mb-6">
                    <span className="block text-[11px] uppercase tracking-wider" style={{ color: palette.textFaint }}>
                      Control ID
                    </span>
                    <div className="mt-1 font-mono text-sm" style={{ color: palette.success }}>
                      {selectedControl.controlId}
                    </div>
                  </div>
                  <div className="mb-6">
                    <span className="block text-[11px] uppercase tracking-wider" style={{ color: palette.textFaint }}>
                      Status
                    </span>
                    <div className="mt-2">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          background: selectedControl.status === "implemented" ? palette.successBg : palette.warningBg,
                          color: selectedControl.status === "implemented" ? palette.success : palette.warning,
                        }}
                      >
                        {selectedControl.status}
                      </span>
                    </div>
                  </div>
                  <div className="mb-6">
                    <span className="block text-[11px] uppercase tracking-wider" style={{ color: palette.textFaint }}>
                      Description
                    </span>
                    <div className="mt-1 leading-relaxed" style={{ color: palette.textMuted }}>
                      {selectedControl.description || "No description available."}
                    </div>
                  </div>
                  <div className="mb-6">
                    <span className="block text-[11px] uppercase tracking-wider" style={{ color: palette.textFaint }}>
                      Evidence ({controlEvidence.length})
                    </span>
                    {controlEvidence.length > 0 ? (
                      <div className="mt-2 space-y-2">
                        {controlEvidence.map((ev, i) => (
                          <div
                            key={i}
                            className="px-3 py-2 rounded-lg text-[13px]"
                            style={{ background: palette.cardBg, color: palette.textMuted }}
                          >
                            {ev.fileName || `Evidence ${i + 1}`}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1" style={{ color: palette.textFaint }}>
                        No evidence attached
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setControlDrawerOpen(false);
                      setAttestModalOpen(true);
                    }}
                    className="flex items-center justify-center gap-2 w-full h-11 rounded-lg text-sm font-medium text-white border-0 transition-colors"
                    style={{ background: `linear-gradient(135deg, ${palette.success} 0%, ${palette.successMuted} 100%)` }}
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    Attest This Control
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
