"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ShieldExclamationIcon,
  FireIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart, Bar, AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";

const fetcher = (url: string, tid: string) =>
  fetch(url, { headers: { "x-tenant-id": tid } }).then((r) => r.json());

const tip = {
  contentStyle: { background: "#111318", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12 },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#64748b" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

function Badge({ children, color = "#94a3b8" }: { children: React.ReactNode; color?: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: color + "18", color }}>{children}</span>
  );
}

const sevColor: Record<string, string> = { critical: "#ef4444", high: "#f59e0b", medium: "#eab308", low: "#10b981" };

export function ThreatIntelligencePage({ companyId }: { companyId: string }) {
  const [timeframe, setTimeframe] = useState("24h");
  const [tab, setTab] = useState("threats");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [blockingIPs, setBlockingIPs] = useState<Set<string>>(new Set());
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => { setToast({ text, ok }); setTimeout(() => setToast(null), 2500); };

  const { data, isLoading, mutate } = useSWR(
    [`/api/customer/threat-intelligence?timeframe=${timeframe}`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 30000 },
  );
  const { data: statsData, mutate: mutateStats } = useSWR(
    [`/api/customer/threats/stats?timeframe=${timeframe}`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 10000 },
  );
  const { data: auditData, mutate: mutateAudit } = useSWR(
    [`/api/customer/threats/audit?limit=10`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 5000 },
  );

  const toggleBlock = async (ip: string, isBlocked: boolean) => {
    setBlockingIPs((s) => new Set(s).add(ip));
    try {
      const action = isBlocked ? "unblock" : "block";
      const r = await fetch("/api/customer/block-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ sourceIp: ip, action, duration: 86400000 }),
      });
      const result = await r.json();
      if (result.success) {
        setBlockedIPs((s) => { const n = new Set(s); action === "block" ? n.add(ip) : n.delete(ip); return n; });
        flash(`${ip} ${action}ed`);
        mutate(); mutateAudit();
      } else flash(result.error || `${action} failed`, false);
    } catch { flash("Network error", false); }
    setBlockingIPs((s) => { const n = new Set(s); n.delete(ip); return n; });
  };

  const doExport = (fmt: "csv" | "json") => {
    if (!data?.threatIntelligence) return;
    const threats = data.threatIntelligence.recentBlocked;
    if (fmt === "json") {
      const blob = new Blob([JSON.stringify(threats, null, 2)], { type: "application/json" });
      const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `threats-${Date.now()}.json`; a.click(); URL.revokeObjectURL(u);
    } else {
      const csv = ["ID,Type,IP,Target,Severity,Risk,Timestamp", ...threats.map((t: any) => [t.id, t.threat_type, t.source_ip, t.target_endpoint, t.severity, t.risk_score, t.blocked_at].join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv" }); const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = `threats-${Date.now()}.csv`; a.click(); URL.revokeObjectURL(u);
    }
    flash(`Exported as ${fmt.toUpperCase()}`);
  };

  if (isLoading) return <PageSkeleton />;
  if (!data?.success) return (
    <div className="text-center py-20">
      <ExclamationTriangleIcon className="w-10 h-10 text-red-400 mx-auto mb-3" />
      <p className="text-white font-medium mb-1">Failed to load threat data</p>
      <button onClick={() => mutate()} className="text-[12px] text-cyan-400 hover:text-cyan-300">Retry</button>
    </div>
  );

  const { summary, topThreats, recentBlocked, threatSources, patterns, attackVectors, trends: trendData } = data.threatIntelligence;
  const sevDist = statsData?.stats?.severityDistribution || [
    { name: "Critical", value: summary.criticalThreats },
    { name: "High", value: summary.highThreats },
    { name: "Medium", value: summary.mediumThreats },
    { name: "Low", value: summary.lowThreats },
  ].filter((i: any) => i.value > 0);

  const timeline = statsData?.stats?.activityTimeline || trendData || [];
  const auditLogs = auditData?.logs || [];

  const filtered = recentBlocked.filter((t: any) => {
    if (sevFilter !== "all" && t.severity.toLowerCase() !== sevFilter) return false;
    if (statusFilter === "blocked" && !blockedIPs.has(t.source_ip)) return false;
    if (statusFilter === "active" && blockedIPs.has(t.source_ip)) return false;
    return true;
  });

  const tabs = [
    { key: "threats", label: "Live Threats" },
    { key: "sources", label: "Threat Sources" },
    { key: "patterns", label: "Patterns" },
    { key: "audit", label: "Audit Log" },
  ];

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
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Threat Intelligence</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time threat detection and monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => doExport("csv")} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/5 text-gray-400 border border-white/[0.06] hover:bg-white/10 transition-colors flex items-center gap-1.5">
            <ArrowDownTrayIcon className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={() => doExport("json")} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/5 text-gray-400 border border-white/[0.06] hover:bg-white/10 transition-colors flex items-center gap-1.5">
            <DocumentTextIcon className="w-3.5 h-3.5" /> JSON
          </button>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}
            className="px-2 py-1.5 rounded-lg text-[12px] bg-white/[0.03] border border-white/[0.06] text-gray-300 focus:outline-none appearance-none cursor-pointer">
            <option value="1h">1h</option><option value="24h">24h</option><option value="7d">7d</option><option value="30d">30d</option>
          </select>
          <button onClick={() => { mutate(); mutateStats(); mutateAudit(); }} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI cards — clean minimal style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Critical Threats", value: summary.criticalThreats, icon: FireIcon },
          { label: "Blocked", value: summary.blockedThreats, icon: ShieldExclamationIcon },
          { label: "Threat Sources", value: summary.uniqueSources, icon: GlobeAltIcon },
          { label: "Avg Risk Score", value: Math.round(summary.averageRiskScore), icon: ChartBarIcon },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <k.icon className="w-4 h-4 text-gray-500" />
                <span className="text-[12px] text-gray-500 font-medium">{k.label}</span>
              </div>
              <div className="text-2xl font-semibold text-white tracking-tight">{k.value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* filter bar */}
      <Card className="p-3 mb-8">
        <div className="flex items-center gap-3 text-[12px]">
          <FunnelIcon className="w-4 h-4 text-gray-500" />
          <select value={sevFilter} onChange={(e) => setSevFilter(e.target.value)}
            className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-300 focus:outline-none appearance-none cursor-pointer text-[12px]">
            <option value="all">All Severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-300 focus:outline-none appearance-none cursor-pointer text-[12px]">
            <option value="all">All Status</option><option value="blocked">Blocked</option><option value="active">Active</option>
          </select>
          {(sevFilter !== "all" || statusFilter !== "all") && (
            <button onClick={() => { setSevFilter("all"); setStatusFilter("all"); }} className="text-gray-500 hover:text-white transition-colors">Clear</button>
          )}
          <span className="ml-auto text-gray-600">{filtered.length} of {recentBlocked.length}</span>
        </div>
      </Card>

      {/* charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* severity distribution */}
        <Card className="p-6">
          <h3 className="text-[13px] font-medium text-gray-400 mb-6">Severity Breakdown</h3>
          {sevDist.length > 0 ? (
            <div className="space-y-3">
              {sevDist.map((s: any) => {
                const total = sevDist.reduce((a: number, b: any) => a + b.value, 0) || 1;
                const c = sevColor[s.name.toLowerCase()] || "#94a3b8";
                return (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="w-16 text-[12px] text-gray-500">{s.name}</div>
                    <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(s.value / total) * 100}%`, backgroundColor: c }} />
                    </div>
                    <div className="w-6 text-right text-[12px] text-white font-medium tabular-nums">{s.value}</div>
                  </div>
                );
              })}
            </div>
          ) : <div className="text-center py-10 text-gray-600 text-[12px]">No threats</div>}
        </Card>

        {/* top threat types */}
        <Card className="p-6">
          <h3 className="text-[13px] font-medium text-gray-400 mb-6">Top Threat Types</h3>
          {(statsData?.stats?.topThreatTypes || topThreats).length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={(statsData?.stats?.topThreatTypes || topThreats).slice(0, 5)} barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="type" stroke="#4b5563" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={60} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
                <RechartsTooltip {...tip} />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10 text-gray-600 text-[12px]">No data</div>}
        </Card>

        {/* attack vectors / timeline */}
        <Card className="p-6">
          <h3 className="text-[13px] font-medium text-gray-400 mb-6">Activity Timeline</h3>
          {timeline.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeline}>
                <defs>
                  <linearGradient id="ti-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="timestamp" stroke="#4b5563" tick={{ fontSize: 10 }} tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
                <RechartsTooltip {...tip} />
                <Area type="monotone" dataKey="count" name="Threats" stroke="#06b6d4" fill="url(#ti-fill)" strokeWidth={1.5} />
                <Line type="monotone" dataKey="blocked" name="Blocked" stroke="#10b981" strokeWidth={1.5} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="text-center py-10 text-gray-600 text-[12px]">No data</div>}
        </Card>
      </div>

      {/* tabs */}
      <LayoutGroup>
        <div className="flex gap-6 border-b border-white/[0.06] mb-6">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative pb-3 text-[13px] font-medium transition-colors ${tab === t.key ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {t.label}
              {tab === t.key && <motion.div layoutId="ti-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" transition={{ type: "spring", stiffness: 500, damping: 35 }} />}
            </button>
          ))}
        </div>
      </LayoutGroup>

      {/* tab content */}
      {tab === "threats" && (
        <div className="space-y-2">
          {filtered.length > 0 ? filtered.map((t: any, i: number) => {
            const isBlocked = blockedIPs.has(t.source_ip);
            const loading = blockingIPs.has(t.source_ip);
            return (
              <Card key={t.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge color={sevColor[t.severity.toLowerCase()]}>{t.severity}</Badge>
                      <span className="text-[13px] text-white font-medium">{t.threat_type}</span>
                      <Badge color="#06b6d4">Risk: {Math.round(t.risk_score)}</Badge>
                      {isBlocked && <Badge color="#ef4444">Blocked</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-gray-500">
                      <code className="text-cyan-400">{t.source_ip}</code>
                      <span>→</span>
                      <code className="text-gray-400 truncate">{t.target_endpoint}</code>
                      <span className="shrink-0">· {new Date(t.blocked_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <button disabled={loading} onClick={() => toggleBlock(t.source_ip, isBlocked)}
                    className={`shrink-0 ml-4 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50 ${
                      isBlocked ? "bg-white/5 text-gray-400 border border-white/[0.06] hover:bg-white/10" : "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    }`}>
                    {loading ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" /> : isBlocked ? "Unblock" : "Block"}
                  </button>
                </div>
              </Card>
            );
          }) : (
            <div className="text-center py-16">
              <ShieldCheckIcon className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
              <p className="text-[13px] text-gray-500">{sevFilter !== "all" || statusFilter !== "all" ? "No threats match filters" : "No active threats"}</p>
            </div>
          )}
        </div>
      )}

      {tab === "sources" && (
        <div className="space-y-2">
          {threatSources.length > 0 ? threatSources.map((s: any, i: number) => {
            const isBlocked = blockedIPs.has(s.source_ip);
            const loading = blockingIPs.has(s.source_ip);
            return (
              <Card key={i} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <code className="text-[14px] font-mono text-cyan-400">{s.source_ip}</code>
                      <Badge color="#ef4444">{s.threat_count} threats</Badge>
                      {isBlocked && <Badge color="#ef4444">Blocked</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-gray-500 mb-2">
                      <span>Blocked: {s.blocked_count}</span>
                      <span>· Risk: {Math.round(s.avg_risk_score)}</span>
                      <span>· Last: {new Date(s.last_activity).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-1">
                      {s.threat_types.slice(0, 4).map((t: string, j: number) => (
                        <span key={j} className="px-1.5 py-0.5 text-[10px] rounded bg-white/[0.04] text-gray-500">{t}</span>
                      ))}
                    </div>
                  </div>
                  <button disabled={loading} onClick={() => toggleBlock(s.source_ip, isBlocked)}
                    className={`shrink-0 ml-4 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors disabled:opacity-50 ${
                      isBlocked ? "bg-white/5 text-gray-400 border border-white/[0.06]" : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}>
                    {loading ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent" /> : isBlocked ? "Unblock" : "Block"}
                  </button>
                </div>
              </Card>
            );
          }) : <div className="text-center py-16 text-gray-600 text-[13px]">No threat sources identified</div>}
        </div>
      )}

      {tab === "patterns" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {patterns.length > 0 ? patterns.map((p: any) => (
            <Card key={p.id} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[13px] text-white font-medium">{p.name}</span>
                <Badge color={p.isActive ? "#10b981" : "#ef4444"}>{p.isActive ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={sevColor[p.severity.toLowerCase()]}>{p.severity}</Badge>
                <span className="text-[12px] text-gray-500 capitalize">{p.type}</span>
              </div>
            </Card>
          )) : <div className="col-span-2 text-center py-16 text-gray-600 text-[13px]">No patterns detected</div>}
        </div>
      )}

      {tab === "audit" && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["IP Address", "Action", "User", "Timestamp"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {auditLogs.length > 0 ? auditLogs.map((log: any, i: number) => (
                <tr key={log.id || i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><code className="text-cyan-400 font-mono text-[12px]">{log.ip_address}</code></td>
                  <td className="px-4 py-3"><Badge color={log.action === "block" ? "#ef4444" : "#10b981"}>{log.action?.toUpperCase()}</Badge></td>
                  <td className="px-4 py-3 text-gray-400 text-[12px]">{log.user || "System"}</td>
                  <td className="px-4 py-3 text-gray-500 text-[12px]">{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-4 py-16 text-center text-gray-600 text-[13px]">No audit logs</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </div></FadeIn>
  );
}
