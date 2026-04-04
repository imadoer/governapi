"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowPathIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useComplianceData } from "./useComplianceData";
import { ExecutiveDashboardTab } from "./ExecutiveDashboardTab";
import { FrameworksControlsTab } from "./FrameworksControlsTab";
import { RiskViolationsTab } from "./RiskViolationsTab";
import { AuditReportsTab } from "./AuditReportsTab";
import { Framework } from "./types";

const tabs = [
  { key: "dashboard", label: "Dashboard" },
  { key: "frameworks", label: "Frameworks" },
  { key: "risk", label: "Risk & Violations" },
  { key: "audit", label: "Audit" },
];

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-700/30 rounded-xl ${className}`} />;
}

function SkeletonPage() {
  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-2 w-28" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-40" />
      </div>
      {/* Two-column cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ShieldCheckIcon className="w-10 h-10 text-gray-600 mb-4" />
      <p className="text-[15px] text-gray-400 mb-1">Unable to load compliance data</p>
      <p className="text-[13px] text-gray-600 mb-6">This could be a temporary issue. Try refreshing.</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 text-[13px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] rounded-lg border border-white/[0.06] transition-colors"
      >
        Retry
      </button>
    </div>
  );
}

export function ComplianceHubPage({ company }: { company?: any }) {
  const tenantId = company?.id || "1";
  const userName = company?.userName || "User";

  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedFramework, setSelectedFramework] = useState<Framework | null>(null);
  const [violationFilter, setViolationFilter] = useState({ status: "all", severity: "all" });
  const [remediationFilter, setRemediationFilter] = useState({ status: "all", priority: "all" });
  const [attestationFilter, setAttestationFilter] = useState("all");

  const data = useComplianceData(tenantId);

  useEffect(() => { data.fetchViolations(violationFilter); }, [violationFilter]);
  useEffect(() => { data.fetchRemediation(remediationFilter); }, [remediationFilter]);
  useEffect(() => { data.fetchAttestations(attestationFilter); }, [attestationFilter]);

  const criticalCount = data.violationStats.bySeverity?.critical || 0;

  return (
    <div>
      {/* toast */}
      <AnimatePresence>
        {data.toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-[200] px-4 py-2 rounded-lg text-[13px] font-medium shadow-xl border border-white/[0.06] ${
              data.toastMessage.type === "success" ? "bg-emerald-600/90 text-white" :
              data.toastMessage.type === "error" ? "bg-red-600/90 text-white" :
              "bg-cyan-600/90 text-white"
            }`}
          >
            {data.toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Compliance Hub</h1>
          <p className="text-sm text-gray-500 mt-1">Compliance management and continuous assurance</p>
        </div>
        <button
          onClick={data.handleRefresh}
          disabled={data.refreshing}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${data.refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* tabs — underline style */}
      <LayoutGroup>
        <div className="flex gap-6 border-b border-white/[0.06] mb-10">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative pb-3 text-[13px] font-medium transition-colors flex items-center gap-2 ${
                activeTab === tab.key ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
              {tab.key === "risk" && criticalCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded-full">
                  {criticalCount}
                </span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="compliance-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>

      {/* content */}
      {data.loading ? (
        <SkeletonPage />
      ) : data.error && !data.dashboardData ? (
        <EmptyState onRetry={data.handleRefresh} />
      ) : (
        <>
          {activeTab === "dashboard" && (
            <ExecutiveDashboardTab
              onExportPDF={() => data.generateReport("executive", "pdf")}
              onRunAssessment={() => {}}
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
              onSubmitAttestation={(id: number, values: any) => data.submitAttestation(id, values, { actorId: company?.userId, actorName: userName })}
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
        </>
      )}
    </div>
  );
}

export default ComplianceHubPage;
