"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useComplianceData } from "./useComplianceData";
import { ExecutiveDashboardTab } from "./ExecutiveDashboardTab";
import { FrameworksControlsTab } from "./FrameworksControlsTab";
import { RiskViolationsTab } from "./RiskViolationsTab";
import { AuditReportsTab } from "./AuditReportsTab";
import { Framework } from "./types";

interface Props {
  company?: any;
}

const tabs = [
  { key: "dashboard", label: "Executive Dashboard", icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
  )},
  { key: "frameworks", label: "Frameworks & Controls", icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
  )},
  { key: "risk", label: "Risk & Violations", icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
  )},
  { key: "audit", label: "Audit & Reports", icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
  )},
];

export function ComplianceHubPage({ company }: Props) {
  const tenantId = company?.id || "1";
  const userName = company?.userName || "User";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [violationFilter, setViolationFilter] = useState({ status: "all", severity: "all" });
  const [remediationFilter, setRemediationFilter] = useState({ status: "all", priority: "all" });
  const [attestationFilter, setAttestationFilter] = useState("all");

  const data = useComplianceData(tenantId);

  useEffect(() => {
    data.fetchViolations(violationFilter);
  }, [violationFilter]);

  useEffect(() => {
    data.fetchRemediation(remediationFilter);
  }, [remediationFilter]);

  useEffect(() => {
    data.fetchAttestations(attestationFilter);
  }, [attestationFilter]);

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Loading Compliance Hub...</span>
        </div>
      </div>
    );
  }

  const criticalCount = data.violationStats.bySeverity?.critical || 0;

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {data.toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 px-5 py-3 rounded-xl backdrop-blur-xl border border-white/10 shadow-2xl text-sm font-medium"
            style={{
              background: data.toastMessage.type === "success" ? "rgba(6,182,212,0.15)" :
                data.toastMessage.type === "error" ? "rgba(225,29,72,0.15)" : "rgba(139,92,246,0.15)",
              color: data.toastMessage.type === "success" ? "#06b6d4" :
                data.toastMessage.type === "error" ? "#e11d48" : "#8b5cf6",
            }}
          >
            {data.toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white/90 flex items-center gap-3 m-0">
              <svg className="w-7 h-7 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Compliance Hub
            </h2>
            <p className="text-white/50 mt-2 mb-0">
              Fortune 500-grade compliance management with continuous assurance
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={data.handleRefresh}
              disabled={data.refreshing}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-all flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${data.refreshing ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 border-b border-white/10 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              relative flex items-center gap-2 px-5 py-3 text-sm font-medium transition-all rounded-t-xl
              ${activeTab === tab.key
                ? "text-cyan-400 bg-white/5"
                : "text-white/50 hover:text-white/70 hover:bg-white/[0.03]"
              }
            `}
          >
            {tab.icon}
            {tab.label}
            {tab.key === "risk" && criticalCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded-full min-w-[18px] text-center">
                {criticalCount}
              </span>
            )}
            {activeTab === tab.key && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && (
        <ExecutiveDashboardTab
          onExportPDF={() => data.generateReport("executive", "pdf")}
          onRunAssessment={() => console.log("Running compliance assessment...")}
          dashboardData={data.dashboardData}
          onViewAllLogs={() => setActiveTab("audit")}
          onViewViolations={() => setActiveTab("risk")}
        />
      )}

      {activeTab === "frameworks" && (
        <FrameworksControlsTab
          frameworks={data.frameworks}
          controls={data.controls}
          controlEvidence={data.controlEvidence}
          policies={data.policies}
          attestations={data.attestations}
          attestationStats={data.attestationStats}
          selectedFramework={selectedFramework}
          onSelectFramework={setSelectedFramework}
          onFetchControls={data.fetchControls}
          onFetchControlEvidence={data.fetchControlEvidence}
          onSubmitAttestation={(id, values) => data.submitAttestation(id, values, { actorId: company?.userId, actorName: userName })}
          onUploadEvidence={data.uploadEvidence}
          onCreatePolicy={data.createPolicy}
          attestationFilter={attestationFilter}
          onAttestationFilterChange={setAttestationFilter}
          userName={userName}
        />
      )}

      {activeTab === "risk" && (
        <RiskViolationsTab
          violations={data.violations}
          violationStats={data.violationStats}
          remediationTasks={data.remediationTasks}
          remediationStats={data.remediationStats}
          vendors={data.vendors}
          vendorStats={data.vendorStats}
          violationFilter={violationFilter}
          remediationFilter={remediationFilter}
          onViolationFilterChange={setViolationFilter}
          onRemediationFilterChange={setRemediationFilter}
          onCreateRemediation={data.createRemediation}
          onUpdateRemediationStatus={data.updateRemediationStatus}
          onCreateVendor={data.createVendor}
          onResolveViolation={data.resolveViolation}
          userName={userName}
        />
      )}

      {activeTab === "audit" && (
        <AuditReportsTab
          auditLogs={data.auditLogs}
          auditReadiness={data.auditReadiness}
          onGenerateReport={data.generateReport}
        />
      )}
    </div>
  );
}

export default ComplianceHubPage;
