"use client";

import { useState } from "react";
import useSWR from "swr";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ArrowPathIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BugAntIcon,
  GlobeAltIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";

const fetcher = (url: string, tid: string) =>
  fetch(url, { headers: { "x-tenant-id": tid } }).then((r) => r.json());

const tip = {
  contentStyle: {
    background: "#111318",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 10,
    fontSize: 12,
  },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#64748b" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

/* ───────────────────────────────────────────────── */

export function AnalyticsInsightsPage({ companyId }: { companyId: string }) {
  const [tab, setTab] = useState("overview");

  const { data: dashData, mutate, isLoading: dashLoading } = useSWR(
    [`/api/customer/dashboard`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 60_000 },
  );

  const { data: metricsData, isLoading: metricsLoading } = useSWR(
    [`/api/customer/security-metrics`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 60_000 },
  );

  const { data: trendsData, isLoading: trendsLoading } = useSWR(
    [`/api/customer/security-metrics/trends`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 120_000 },
  );

  const { data: scansData, isLoading: scansLoading } = useSWR(
    [`/api/customer/security-scans?limit=50`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 60_000 },
  );

  const { data: vulnsData } = useSWR(
    [`/api/customer/vulnerabilities`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
  );

  const loading = dashLoading && metricsLoading;

  const stats = dashData?.success ? dashData.stats : null;
  const metrics = metricsData?.success ? metricsData.metrics : null;
  const trends = trendsData?.success ? trendsData.trends ?? [] : [];
  const scans = scansData?.success ? scansData.securityScans ?? [] : [];
  const scanStats = scansData?.success ? scansData.statistics : null;
  const vulns = vulnsData?.success ? vulnsData.vulnerabilities ?? [] : [];
  const vulnSummary = vulnsData?.success ? vulnsData.summary : null;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "scans", label: "Scan History" },
    { key: "vulnerabilities", label: "Vulnerabilities" },
    { key: "trends", label: "Score History" },
  ];

  if (loading && !stats) {
    return <PageSkeleton />;
  }

  return (
    <FadeIn><div>
      {/* header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Analytics & Insights</h1>
          <p className="text-sm text-gray-500 mt-1">API usage, scan activity, and security trends</p>
        </div>
        <button onClick={() => mutate()} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {/* tabs */}
      <LayoutGroup>
        <div className="flex gap-6 border-b border-white/[0.06] mb-10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`relative pb-3 text-[13px] font-medium transition-colors ${
                tab === t.key ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
              {tab === t.key && (
                <motion.div
                  layoutId="analytics-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "overview" && <OverviewTab stats={stats} metrics={metrics} scanStats={scanStats} vulnSummary={vulnSummary} trends={trends} />}
          {tab === "scans" && <ScansTab scans={scans} loading={scansLoading} />}
          {tab === "vulnerabilities" && <VulnerabilitiesTab vulns={vulns} summary={vulnSummary} />}
          {tab === "trends" && <TrendsTab trends={trends} loading={trendsLoading} />}
        </motion.div>
      </AnimatePresence>
    </div></FadeIn>
  );
}

/* ───────────────────── Overview ───────────────────── */

function OverviewTab({ stats, metrics, scanStats, vulnSummary, trends }: any) {
  const kpis = [
    { label: "Total Scans", value: stats?.totalScans ?? 0, icon: ChartBarIcon },
    { label: "Avg Score", value: stats?.avgSecurityScore ?? 0, icon: ShieldCheckIcon },
    { label: "Open Vulns", value: metrics?.openVulnerabilities ?? 0, icon: BugAntIcon },
    { label: "Endpoints", value: stats?.totalEndpoints ?? 0, icon: GlobeAltIcon },
    { label: "Threats Blocked", value: stats?.blockedThreats ?? 0, icon: ShieldCheckIcon },
  ];

  /* scan frequency — group scans by week from trends */
  const last14 = (trends ?? []).slice(-14);
  const scoreChart = last14.map((t: any) => ({
    date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: t.securityScore ?? 0,
    threats: t.activeThreats ?? 0,
  }));

  /* vuln severity breakdown for bar chart */
  const vulnBars = vulnSummary
    ? [
        { severity: "Critical", count: vulnSummary.critical ?? 0, fill: "#ef4444" },
        { severity: "High", count: vulnSummary.high ?? 0, fill: "#f59e0b" },
        { severity: "Medium", count: vulnSummary.medium ?? 0, fill: "#eab308" },
        { severity: "Low", count: vulnSummary.low ?? 0, fill: "#06b6d4" },
      ]
    : [];

  return (
    <div className="space-y-10">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <k.icon className="w-4 h-4 text-gray-500" />
                <span className="text-[12px] text-gray-500 font-medium">{k.label}</span>
              </div>
              <div className="text-2xl font-semibold text-white tracking-tight">
                {typeof k.value === "number" ? k.value.toLocaleString() : k.value}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* security score trend */}
        <Card className="p-6">
          <h3 className="text-[13px] font-medium text-gray-400 mb-6">Security Score (14 days)</h3>
          {scoreChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={scoreChart}>
                <defs>
                  <linearGradient id="ai-score" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fontSize: 11 }} />
                <RechartsTooltip {...tip} />
                <Area type="monotone" dataKey="score" name="Score" stroke="#06b6d4" fill="url(#ai-score)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="No trend data yet" />
          )}
        </Card>

        {/* vulnerability breakdown */}
        <Card className="p-6">
          <h3 className="text-[13px] font-medium text-gray-400 mb-6">Vulnerability Breakdown</h3>
          {vulnBars.some((b) => b.count > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vulnBars} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="severity" stroke="#4b5563" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke="#4b5563" tick={{ fontSize: 11 }} />
                <RechartsTooltip {...tip} />
                <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                  {vulnBars.map((b, i) => (
                    <rect key={i} fill={b.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="No vulnerabilities found" />
          )}
        </Card>
      </div>

      {/* scan stats */}
      {scanStats && (
        <Card className="p-6">
          <h3 className="text-[13px] font-medium text-gray-400 mb-4">Scan Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total", value: scanStats.total ?? 0, color: "text-white" },
              { label: "Completed", value: scanStats.completed ?? 0, color: "text-emerald-400" },
              { label: "Running", value: scanStats.running ?? 0, color: "text-cyan-400" },
              { label: "Failed", value: scanStats.failed ?? 0, color: "text-red-400" },
              { label: "Avg Score", value: scanStats.averageSecurityScore != null ? Math.round(scanStats.averageSecurityScore) : "—", color: "text-amber-400" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[12px] text-gray-500 mb-1">{s.label}</div>
                <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ───────────────────── Scan History ──────────────── */

function ScansTab({ scans, loading }: { scans: any[]; loading: boolean }) {
  if (loading) return <Spinner />;

  /* group scans by date for frequency chart */
  const freq: Record<string, number> = {};
  scans.forEach((s: any) => {
    const d = new Date(s.createdAt ?? s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    freq[d] = (freq[d] ?? 0) + 1;
  });
  const freqData = Object.entries(freq).map(([date, count]) => ({ date, scans: count }));

  return (
    <div className="space-y-8">
      {/* scan frequency chart */}
      <Card className="p-6">
        <h3 className="text-[13px] font-medium text-gray-400 mb-6">Scan Frequency</h3>
        {freqData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={freqData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke="#4b5563" tick={{ fontSize: 11 }} />
              <RechartsTooltip {...tip} />
              <Bar dataKey="scans" name="Scans" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="No scans recorded" />
        )}
      </Card>

      {/* scan table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h3 className="text-[13px] font-medium text-white">Recent Scans</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["URL", "Type", "Status", "Score", "Date"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scans.map((s: any) => (
                <tr key={s.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 font-mono text-cyan-400 text-[12px] max-w-[240px] truncate">{s.url || s.target}</td>
                  <td className="px-4 py-3 text-gray-400 text-[12px]">{s.scanType ?? s.scan_type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                      s.status === "completed" ? "bg-emerald-500/15 text-emerald-400" :
                      s.status === "failed" ? "bg-red-500/15 text-red-400" :
                      "bg-amber-500/15 text-amber-400"
                    }`}>{s.status}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium text-[13px]">{s.securityScore ?? s.security_score ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-[12px]">{new Date(s.createdAt ?? s.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {scans.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-600 text-sm">No scans yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ───────────────── Vulnerabilities ──────────────── */

function VulnerabilitiesTab({ vulns, summary }: { vulns: any[]; summary: any }) {
  /* severity over time — group by created_at date + severity */
  const byDate: Record<string, { critical: number; high: number; medium: number; low: number }> = {};
  vulns.forEach((v: any) => {
    const d = new Date(v.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!byDate[d]) byDate[d] = { critical: 0, high: 0, medium: 0, low: 0 };
    const sev = v.severity?.toLowerCase();
    if (sev && sev in byDate[d]) (byDate[d] as any)[sev]++;
  });
  const trendData = Object.entries(byDate).map(([date, counts]) => ({ date, ...counts }));

  /* most targeted endpoints */
  const epCount: Record<string, number> = {};
  vulns.forEach((v: any) => {
    const ep = v.affected_url || v.endpoint || "Unknown";
    epCount[ep] = (epCount[ep] ?? 0) + 1;
  });
  const topEndpoints = Object.entries(epCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([endpoint, count]) => ({ endpoint: endpoint.length > 40 ? endpoint.slice(0, 40) + "..." : endpoint, count }));

  return (
    <div className="space-y-8">
      {/* summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: summary?.total ?? 0, color: "text-white" },
          { label: "Critical", value: summary?.critical ?? 0, color: "text-red-400" },
          { label: "High", value: summary?.high ?? 0, color: "text-amber-400" },
          { label: "Resolved", value: summary?.resolved ?? 0, color: "text-emerald-400" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-[12px] text-gray-500 mb-2">{s.label}</div>
            <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* vuln trend */}
        <Card className="p-6">
          <h3 className="text-[13px] font-medium text-gray-400 mb-6">Vulnerability Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} stroke="#4b5563" tick={{ fontSize: 11 }} />
                <RechartsTooltip {...tip} />
                <Area type="monotone" dataKey="critical" name="Critical" stackId="1" stroke="#ef4444" fill="#ef444420" strokeWidth={1.5} />
                <Area type="monotone" dataKey="high" name="High" stackId="1" stroke="#f59e0b" fill="#f59e0b20" strokeWidth={1.5} />
                <Area type="monotone" dataKey="medium" name="Medium" stackId="1" stroke="#eab308" fill="#eab30820" strokeWidth={1.5} />
                <Area type="monotone" dataKey="low" name="Low" stackId="1" stroke="#06b6d4" fill="#06b6d420" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="No vulnerability data" />
          )}
        </Card>

        {/* most targeted endpoints */}
        <Card className="p-6">
          <h3 className="text-[13px] font-medium text-gray-400 mb-6">Most Affected Endpoints</h3>
          {topEndpoints.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topEndpoints} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis type="number" allowDecimals={false} stroke="#4b5563" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="endpoint" width={160} stroke="#4b5563" tick={{ fontSize: 10 }} />
                <RechartsTooltip {...tip} />
                <Bar dataKey="count" name="Vulns" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Empty text="No endpoint data" />
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─────────────────── Score History ──────────────── */

function TrendsTab({ trends, loading }: { trends: any[]; loading: boolean }) {
  if (loading) return <Spinner />;

  const data = trends.map((t: any) => ({
    date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: t.securityScore ?? 0,
    threats: t.activeThreats ?? 0,
  }));

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h3 className="text-[13px] font-medium text-gray-400 mb-6">Security Score History (30 days)</h3>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="ai-hist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fontSize: 11 }} />
              <RechartsTooltip {...tip} />
              <Area type="monotone" dataKey="score" name="Security Score" stroke="#06b6d4" fill="url(#ai-hist)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="No history data" />
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-[13px] font-medium text-gray-400 mb-6">Active Threats Over Time</h3>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="ai-threat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} stroke="#4b5563" tick={{ fontSize: 11 }} />
              <RechartsTooltip {...tip} />
              <Area type="monotone" dataKey="threats" name="Active Threats" stroke="#ef4444" fill="url(#ai-threat)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="No threat history" />
        )}
      </Card>
    </div>
  );
}

/* ───────────────────── Helpers ───────────────────── */

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-600">
      <ChartBarIcon className="w-8 h-8 mb-2 opacity-40" />
      <span className="text-[13px]">{text}</span>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-cyan-500/30 border-t-cyan-500" />
    </div>
  );
}
