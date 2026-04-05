"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { FadeIn } from "./PageSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ComposedChart, Line, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import {
  ArrowPathIcon,
  PlayCircleIcon,
  ArrowDownTrayIcon,
  FireIcon,
  BugAntIcon,
  ShieldExclamationIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const fetcher = (url: string, tenantId: string) =>
  fetch(url, { headers: { "x-tenant-id": tenantId } }).then((res) => res.json());

const tip = {
  contentStyle: { background: "#111318", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12 },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#64748b" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

export function SecurityCenterPage({ company, onNavigate }: any) {
  const [scanModal, setScanModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formScanType, setFormScanType] = useState("comprehensive");
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const tenantId = company?.id || "1";
  const flash = (text: string, ok = true) => { setToast({ text, ok }); setTimeout(() => setToast(null), 2500); };

  const { data: metricsData, mutate: refreshMetrics, isLoading: metricsLoading } = useSWR(
    [`/api/customer/security-metrics`, tenantId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 30000 },
  );
  const { data: scansData, mutate: refreshScans, isLoading: scansLoading } = useSWR(
    [`/api/customer/security-scans?limit=10`, tenantId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 10000 },
  );
  const { data: vulnsData, mutate: refreshVulns, isLoading: vulnsLoading } = useSWR(
    [`/api/customer/vulnerabilities?limit=5&status=open`, tenantId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 15000 },
  );
  const { data: threatsData, isLoading: threatsLoading } = useSWR(
    [`/api/customer/threat-blocking`, tenantId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 10000 },
  );
  const { data: trendsData, mutate: refreshTrends, isLoading: trendsLoading } = useSWR(
    [`/api/customer/security-metrics/trends`, tenantId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 60000 },
  );

  const refreshAll = async () => {
    // Force revalidate all SWR caches — await to ensure data is fresh before render
    await Promise.all([
      refreshMetrics(), refreshScans(), refreshVulns(), refreshTrends(),
    ]);
  };

  const metrics = metricsData?.success ? metricsData.metrics : null;
  const scans = scansData?.success ? scansData.securityScans : [];
  const vulns = vulnsData?.success ? vulnsData.vulnerabilities : [];
  const threats = threatsData?.success ? threatsData.threatBlocking : null;
  const trends = trendsData?.success ? trendsData.trends : [];

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) { setFormError("Enter a URL"); return; }
    setFormError(""); setSubmitting(true);
    try {
      const r = await fetch("/api/customer/security-scans", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": tenantId },
        body: JSON.stringify({ url: formUrl, scanType: formScanType }),
      });
      const data = await r.json();
      if (data.success) {
        flash("Scan started — results will appear automatically");
        setScanModal(false); setFormUrl("");

        // Poll: re-fetch scans list every 3s, check if our scan completed
        const scanId = data.securityScan?.id;
        let attempts = 0;
        const poll = setInterval(async () => {
          attempts++;
          try {
            // Re-fetch the scans list via SWR mutate and check the result
            const freshScans = await refreshScans();
            const allScans = freshScans?.securityScans ?? [];
            const ourScan = allScans.find((s: any) => s.id === scanId);

            if (ourScan && ourScan.status !== "pending" && ourScan.status !== "running") {
              clearInterval(poll);
              const score = ourScan.securityScore ?? ourScan.security_score;
              flash(`Scan complete${score != null ? ` — endpoint score: ${score}/100` : ""}. Refreshing...`);
              // Refresh everything — score, vulns, trends all need recalculation
              await refreshAll();
              flash("All data updated");
            }
          } catch { /* ignore */ }

          // Give up after 20 attempts (60s)
          if (attempts >= 20) {
            clearInterval(poll);
            await refreshAll();
          }
        }, 3000);
      } else flash(data.error || "Scan failed", false);
    } catch { flash("Scan failed", false); }
    setSubmitting(false);
  };

  const handleExportPDF = async () => {
    try {
      flash("Generating PDF...");
      const response = await fetch('/api/customer/security-report/pdf', { headers: { 'x-tenant-id': tenantId } });
      const data = await response.json();
      if (!data.success) throw new Error();
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const doc = new jsPDF();
      const rd = data.reportData;
      doc.setFontSize(20); doc.setTextColor(6, 182, 212); doc.text('GovernAPI Security Report', 14, 20);
      doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated: ${new Date(rd.generatedAt).toLocaleString()}`, 14, 28);
      doc.setFontSize(14); doc.setTextColor(0); doc.text('Executive Summary', 14, 40);
      doc.setFontSize(10);
      doc.text(`Security Score: ${rd.metrics.securityScore}/100`, 14, 48);
      doc.text(`Vulnerability Score: ${rd.metrics.vulnScore}/100`, 20, 55);
      doc.text(`Threat Score: ${rd.metrics.threatScore}/100`, 20, 62);
      (autoTable as any)(doc, {
        startY: 72, head: [['Severity', 'Count']],
        body: [['Critical', rd.vulnerabilities.critical], ['High', rd.vulnerabilities.high], ['Medium', rd.vulnerabilities.medium], ['Low', rd.vulnerabilities.low]],
        theme: 'grid', headStyles: { fillColor: [6, 182, 212] },
      });
      doc.save(`GovernAPI-Security-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      flash("PDF downloaded");
    } catch { flash("PDF export failed", false); }
  };

  const scoreColor = (s: number) => s >= 70 ? "#10b981" : s >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <FadeIn><div>
      {/* toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-[200] px-4 py-2 rounded-lg text-[13px] font-medium shadow-xl border border-white/[0.06] ${toast.ok ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Security Center</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time security operations and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleExportPDF} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/5 text-gray-400 border border-white/[0.06] hover:bg-white/10 transition-colors flex items-center gap-1.5">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={() => refreshMetrics()} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button onClick={() => setScanModal(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-1.5">
            <PlayCircleIcon className="w-3.5 h-3.5" /> Start Scan
          </button>
        </div>
      </div>

      {/* stat bar */}
      {metrics && (
        <Card className="p-4 mb-8">
          <div className="flex items-center gap-8">
            {[
              { label: "Security Score", value: `${metrics.securityScore}/100`, color: scoreColor(metrics.securityScore) },
              { label: "Active Threats", value: metrics.activeThreats },
              { label: "Open Vulns", value: metrics.openVulnerabilities, color: metrics.openVulnerabilities > 0 ? "#f59e0b" : undefined },
              { label: "Compliance", value: `${metrics.complianceScore}%` },
              { label: "Scan Hygiene", value: `${metrics.scanHygieneScore}%` },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div className="h-6 w-px bg-white/[0.06]" />}
                <div>
                  <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-0.5">{s.label}</div>
                  <div className="text-lg font-semibold" style={{ color: s.color || "white" }}>{s.value}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
        </Card>
      )}

      {/* score ring + trend chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-3">
          <Card className="p-6 flex flex-col items-center justify-center h-full">
            {metricsLoading ? (
              <div className="animate-pulse bg-slate-700/30 rounded-full w-[130px] h-[130px]" />
            ) : (() => {
              const s = metrics?.securityScore ?? 0;
              const c = scoreColor(s);
              const r = 54, circ = 2 * Math.PI * r;
              return (
                <>
                  <span className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mb-4">Score</span>
                  <div className="relative w-[130px] h-[130px]">
                    <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                      <motion.circle cx="60" cy="60" r={r} fill="none" stroke={c} strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
                        animate={{ strokeDashoffset: circ * (1 - Math.min(s, 100) / 100) }}
                        transition={{ duration: 1.2, ease: "easeOut" }} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-semibold text-white">{s}</span>
                      <span className="text-[11px] text-gray-500">/ 100</span>
                    </div>
                  </div>
                  {metrics?.securityScoreTrend !== undefined && (
                    <div className="mt-3 text-[12px]">
                      <span className={metrics.securityScoreTrend >= 0 ? "text-emerald-400" : "text-red-400"}>
                        {metrics.securityScoreTrend >= 0 ? "↑" : "↓"} {Math.abs(metrics.securityScoreTrend)}%
                      </span>
                      <span className="text-gray-600"> vs last week</span>
                    </div>
                  )}
                </>
              );
            })()}
          </Card>
        </div>

        <div className="lg:col-span-9">
          <Card className="p-6 h-full">
            <h3 className="text-[13px] font-medium text-gray-400 mb-6">30-Day Security Trend</h3>
            {trendsLoading ? (
              <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-slate-700/30 rounded h-5 w-3/4" />)}</div>
            ) : trends.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <ComposedChart data={trends}>
                  <defs>
                    <linearGradient id="sc-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })} />
                  <YAxis yAxisId="left" stroke="#4b5563" tick={{ fontSize: 11 }} domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#4b5563" tick={{ fontSize: 11 }} />
                  <RechartsTooltip {...tip} />
                  <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                  <Area yAxisId="left" type="monotone" dataKey="securityScore" name="Score" stroke="#06b6d4" fill="url(#sc-fill)" strokeWidth={1.5} />
                  <Line yAxisId="right" type="monotone" dataKey="activeThreats" name="Threats" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[230px] text-gray-600 text-[13px]">
                <ChartBarIcon className="w-6 h-6 mr-2 opacity-40" /> No trend data
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Threats", value: metrics?.activeThreats ?? 0, icon: FireIcon, live: (metrics?.activeThreats ?? 0) > 0 },
          { label: "Critical Vulns", value: metrics?.criticalVulns ?? 0, icon: BugAntIcon },
          { label: "Scans Running", value: metrics?.scansRunning ?? 0, icon: ChartBarIcon },
          { label: "Compliance", value: `${metrics?.complianceScore ?? 0}%`, icon: ShieldExclamationIcon },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <k.icon className="w-4 h-4 text-gray-500" />
                <span className="text-[12px] text-gray-500 font-medium">{k.label}</span>
                {k.live && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
              </div>
              <div className="text-2xl font-semibold text-white">{k.value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* vulns + threats panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* vulnerabilities */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-white flex items-center gap-2">
              <BugAntIcon className="w-4 h-4 text-gray-500" /> Critical Vulnerabilities
              {(metrics?.criticalVulns ?? 0) > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-orange-500/20 text-orange-400">{metrics.criticalVulns}</span>}
            </h3>
            <button onClick={() => onNavigate?.("vulnerability-scanner")} className="text-[11px] text-gray-500 hover:text-white transition-colors">View All →</button>
          </div>
          <div className="p-4">
            {vulnsLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-slate-700/30 rounded-xl h-14" />)}</div>
            ) : vulns.length > 0 ? (
              <div className="space-y-2">
                {vulns.slice(0, 5).map((v: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-1.5 py-0.5 text-[10px] font-medium rounded-full ${
                        v.severity === "critical" ? "bg-red-500/15 text-red-400" : v.severity === "high" ? "bg-orange-500/15 text-orange-400" : "bg-amber-500/15 text-amber-400"
                      }`}>{v.severity}</span>
                    </div>
                    <div className="text-[13px] text-white">{v.title}</div>
                    <div className="text-[11px] text-gray-600 mt-0.5">{v.vulnerability_type}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <CheckCircleIcon className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                <p className="text-[13px] text-gray-500">No critical vulnerabilities</p>
              </div>
            )}
          </div>
        </Card>

        {/* live threats */}
        <Card className="overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-white flex items-center gap-2">
              <FireIcon className="w-4 h-4 text-gray-500" /> Live Threats
              {(metrics?.activeThreats ?? 0) > 0 && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
            </h3>
            <button onClick={() => onNavigate?.("threat-intelligence")} className="text-[11px] text-gray-500 hover:text-white transition-colors">Details →</button>
          </div>
          <div className="p-4">
            {threatsLoading ? (
              <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="animate-pulse bg-slate-700/30 rounded-xl h-20" />)}</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] text-center">
                  <div className="text-2xl font-semibold text-red-400">{threats?.recentBlocked?.length ?? 0}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Blocked Today</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.03] text-center">
                  <div className="text-2xl font-semibold text-amber-400">{metrics?.activeThreats ?? 0}</div>
                  <div className="text-[11px] text-gray-500 mt-1">Active Now</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* recent scans */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <h3 className="text-[13px] font-medium text-white">Recent Scans</h3>
          <button onClick={() => setScanModal(true)} className="text-[11px] text-gray-500 hover:text-white transition-colors">New Scan →</button>
        </div>
        {scansLoading ? (
          <div className="p-4 grid grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <div key={i} className="animate-pulse bg-slate-700/30 rounded-xl h-20" />)}</div>
        ) : scans.length > 0 ? (
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scans.slice(0, 6).map((s: any, i: number) => (
              <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                <div className="text-[12px] text-cyan-400 font-mono mb-2 truncate">{s.target}</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-cyan-500/15 text-cyan-400">{s.scan_type}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${s.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>{s.status}</span>
                </div>
                {s.security_score != null && (
                  <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${s.security_score}%`, background: s.security_score >= 80 ? "#10b981" : "#f59e0b" }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <ClockIcon className="w-8 h-8 text-gray-600 mx-auto mb-2" />
            <p className="text-[13px] text-gray-500 mb-3">No recent scans</p>
            <button onClick={() => setScanModal(true)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors">Start First Scan</button>
          </div>
        )}
      </Card>

      {/* scan modal */}
      <AnimatePresence>
        {scanModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setScanModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 bg-[#111318] rounded-2xl border border-white/[0.06] shadow-2xl w-[440px] max-w-[92vw]"
            >
              <div className="px-6 py-4 border-b border-white/[0.06]">
                <h2 className="text-[15px] font-semibold text-white">New Security Scan</h2>
              </div>
              <form onSubmit={handleStartScan} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-[12px] text-gray-400 mb-1.5">Target URL</label>
                  <input type="text" value={formUrl} onChange={(e) => { setFormUrl(e.target.value); setFormError(""); }} placeholder="https://api.example.com"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-[13px] placeholder-gray-600 focus:outline-none focus:border-white/[0.12] transition-colors" />
                  {formError && <p className="text-red-400 text-[11px] mt-1">{formError}</p>}
                </div>
                <div>
                  <label className="block text-[12px] text-gray-400 mb-1.5">Scan Type</label>
                  <select value={formScanType} onChange={(e) => setFormScanType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-[13px] focus:outline-none focus:border-white/[0.12] appearance-none cursor-pointer">
                    <option value="quick">Quick</option>
                    <option value="comprehensive">Comprehensive</option>
                    <option value="deep">Deep</option>
                    <option value="owasp_top10">OWASP Top 10</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setScanModal(false)} className="px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    {submitting && <div className="animate-spin rounded-full h-3 w-3 border-2 border-black/30 border-t-black" />}
                    Start Scan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div></FadeIn>
  );
}
