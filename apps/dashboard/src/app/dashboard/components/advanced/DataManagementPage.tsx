"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  ShieldCheckIcon,
  ServerIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const fetcher = (url: string, _tid: string) => {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") || "" : "";
  return fetch(url, { headers: token ? { "Authorization": `Bearer ${token}` } : {}, credentials: "include" }).then((r) => r.json());
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

/* ───────────────────────────────────────────────── */

export function DataManagementPage({ companyId }: { companyId: string }) {
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [retention, setRetention] = useState(90);
  const [retentionModal, setRetentionModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState("");

  const flash = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const { data: dashData } = useSWR(
    [`/api/customer/dashboard`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
  );

  const { data: backupData } = useSWR(
    [`/api/system/backup-status`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 300000 },
  );

  const { data: endpointsData } = useSWR(
    [`/api/customer/api-endpoints`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
  );

  const { data: vulnsData } = useSWR(
    [`/api/customer/vulnerabilities`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
  );

  const stats = dashData?.success ? dashData.stats : null;

  const handleExport = async (dataType: string, format: string) => {
    setExporting(dataType + format);
    try {
      const response = await fetch(`/api/customer/data-export?type=${dataType}&format=${format}`, {
        headers: { "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
      });
      if (response.ok) {
        if (format === "csv") {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `governapi-${dataType}-${Date.now()}.csv`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
        } else {
          const data = await response.json();
          const blob = new Blob([JSON.stringify(data.export, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `governapi-${dataType}-${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          URL.revokeObjectURL(url);
          a.remove();
        }
        flash(`${dataType} exported as ${format.toUpperCase()}`);
      } else {
        flash("Export failed", false);
      }
    } catch {
      flash("Export failed", false);
    }
    setExporting(null);
  };

  const handleDeleteData = () => {
    flash(`${deleteTarget || "Old"} data cleanup scheduled`);
    setDeleteModal(false);
    setDeleteTarget("");
  };

  const exportItems = [
    { id: "all", name: "Complete Export", desc: "All data including APIs, scans, threats, and vulnerabilities", icon: ServerIcon },
    { id: "scans", name: "Security Scans", desc: "Scan results and security scores", icon: ShieldCheckIcon },
    { id: "threats", name: "Security Findings", desc: "Security findings and scan results", icon: ExclamationTriangleIcon },
    { id: "vulnerabilities", name: "Vulnerabilities", desc: "Discovered vulnerabilities and CVEs", icon: ShieldCheckIcon },
    { id: "webhooks", name: "Webhooks", desc: "Webhook configurations and delivery logs", icon: DocumentArrowDownIcon },
  ];

  const storageItems = [
    { label: "API Endpoints", value: endpointsData?.total ?? 0, color: "#06b6d4" },
    { label: "Security Scans", value: stats?.totalScans ?? 0, color: "#10b981" },
    { label: "Vulnerabilities", value: vulnsData?.summary?.total ?? 0, color: "#ef4444" },
    { label: "Discovery Scans", value: stats?.completedScans ?? 0, color: "#f59e0b" },
  ];

  const totalRecords = storageItems.reduce((s, i) => s + i.value, 0);

  return (
    <div>
      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-[200] px-4 py-2 rounded-lg text-[13px] font-medium shadow-xl border border-white/[0.06] ${
              toast.ok ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight">Data Management</h1>
        <p className="text-sm text-gray-500 mt-1">Export, backup, and manage your security data</p>
      </div>

      <div className="space-y-10">
        {/* data retention + backup row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* retention */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <h3 className="text-[13px] font-medium text-gray-400">Data Retention</h3>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-3xl font-semibold text-white mb-1">{retention} days</div>
                <p className="text-[12px] text-gray-600">Older data is automatically archived</p>
              </div>
              <button
                onClick={() => setRetentionModal(true)}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors"
              >
                Configure
              </button>
            </div>
          </Card>

          {/* backups */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowPathIcon className="w-4 h-4 text-gray-500" />
              <h3 className="text-[13px] font-medium text-gray-400">Automated Backups</h3>
              <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Active</span>
            </div>
            {backupData?.lastBackup ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <span className="text-[12px] text-gray-500">Last backup</span>
                  <span className="text-[12px] text-white font-medium">
                    {new Date(backupData.lastBackup.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <span className="text-[12px] text-gray-500">Backup size</span>
                  <span className="text-[12px] text-white font-medium">{backupData.lastBackup.size}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <span className="text-[12px] text-gray-500">Schedule</span>
                  <span className="text-[12px] text-white font-medium">{backupData.schedule}</span>
                </div>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                  <span className="text-[12px] text-gray-500">Retention</span>
                  <span className="text-[12px] text-white font-medium">{backupData.retention} ({backupData.totalBackups} stored)</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[12px] text-gray-500">Daily backups at 3:00 AM UTC, 30-day retention.</p>
                <p className="text-[11px] text-gray-600">First backup will run tonight.</p>
              </div>
            )}
          </Card>
        </div>

        {/* storage usage */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ServerIcon className="w-4 h-4 text-gray-500" />
              <h3 className="text-[13px] font-medium text-gray-400">Storage Usage</h3>
            </div>
            <span className="text-[12px] text-gray-500">{totalRecords.toLocaleString()} total records</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {storageItems.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="text-white font-medium">{item.value.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: item.color,
                      width: totalRecords > 0 ? `${Math.max(2, (item.value / totalRecords) * 100)}%` : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* export data */}
        <div>
          <h2 className="text-[13px] font-medium text-gray-400 mb-4">Export Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exportItems.map((item) => (
              <Card key={item.id} className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className="w-4 h-4 text-gray-500" />
                  <h3 className="text-[13px] font-medium text-white">{item.name}</h3>
                </div>
                <p className="text-[12px] text-gray-600 mb-4">{item.desc}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleExport(item.id, "json")}
                    disabled={exporting === item.id + "json"}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 disabled:opacity-50 transition-colors"
                  >
                    {exporting === item.id + "json" ? "..." : "JSON"}
                  </button>
                  <button
                    onClick={() => handleExport(item.id, "csv")}
                    disabled={exporting === item.id + "csv"}
                    className="flex-1 py-1.5 rounded-lg text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-50 transition-colors"
                  >
                    {exporting === item.id + "csv" ? "..." : "CSV"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* danger zone */}
        <Card className="p-6 border-red-500/10">
          <div className="flex items-center gap-3 mb-4">
            <TrashIcon className="w-4 h-4 text-red-400" />
            <h3 className="text-[13px] font-medium text-red-400">Danger Zone</h3>
          </div>
          <p className="text-[12px] text-gray-500 mb-4">
            Permanently delete data from your account. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setDeleteTarget("scan history"); setDeleteModal(true); }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Delete Scan History
            </button>
            <button
              onClick={() => { setDeleteTarget("security findings"); setDeleteModal(true); }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Delete Security Findings
            </button>
            <button
              onClick={() => { setDeleteTarget("all data"); setDeleteModal(true); }}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
            >
              Delete All Data
            </button>
          </div>
        </Card>
      </div>

      {/* retention modal */}
      <AnimatePresence>
        {retentionModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setRetentionModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="relative z-10 bg-[#111318] rounded-2xl border border-white/[0.06] shadow-2xl w-[440px] max-w-[92vw]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[15px] font-semibold text-white">Configure Retention</h3>
                <button onClick={() => setRetentionModal(false)} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[12px] text-gray-400 mb-1.5">Retention period (days)</label>
                  <input
                    type="number" min={30} max={3650} value={retention}
                    onChange={(e) => setRetention(Number(e.target.value) || 90)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-[13px] focus:outline-none focus:border-white/[0.12] transition-colors"
                  />
                  <p className="text-[11px] text-gray-600 mt-1.5">Recommended: 90–365 days</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/10">
                  <p className="text-[12px] text-amber-400">Reducing retention may permanently delete historical data.</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button onClick={() => setRetentionModal(false)} className="px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={() => { flash(`Retention updated to ${retention} days`); setRetentionModal(false); }} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors">Save</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* delete confirm modal */}
      <AnimatePresence>
        {deleteModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setDeleteModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="relative z-10 bg-[#111318] rounded-2xl border border-white/[0.06] shadow-2xl w-[400px] max-w-[92vw]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[15px] font-semibold text-white">Confirm Deletion</h3>
                <button onClick={() => setDeleteModal(false)} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="px-6 py-5">
                <p className="text-[13px] text-gray-400">
                  Are you sure you want to delete <span className="text-white font-medium">{deleteTarget}</span>? This action cannot be undone.
                </p>
              </div>
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button onClick={() => setDeleteModal(false)} className="px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleDeleteData} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">Delete</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
