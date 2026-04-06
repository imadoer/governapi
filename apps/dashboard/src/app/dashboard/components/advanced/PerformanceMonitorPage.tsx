"use client";

import { useState } from "react";
import useSWR from "swr";
import { FadeIn } from "./PageSkeleton";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  ArrowPathIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const fetcher = (url: string, _tid: string) => {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") || "" : "";
  return fetch(url, { headers: token ? { "Authorization": `Bearer ${token}` } : {}, credentials: "include" }).then((r) => r.json());
};

const tip = {
  contentStyle: { background: "#111318", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12 },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#64748b" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-700/30 rounded-xl ${className}`} />;
}

export function PerformanceMonitorPage({ companyId }: { companyId: string }) {
  const [tab, setTab] = useState("endpoints");

  const { data: raw, mutate, isLoading } = useSWR(
    [`/api/customer/performance`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 30_000 },
  );

  const perf = raw?.success ? raw.performance : null;
  const summary = perf?.summary;
  const hourlyTrends = perf?.hourlyTrends ?? [];
  const endpoints = perf?.endpointPerformance ?? [];
  const errors = perf?.errorAnalysis;
  const slowest = perf?.slowestEndpoints ?? [];

  const tabs = [
    { key: "endpoints", label: "Endpoints" },
    { key: "slowest", label: "Slowest" },
    { key: "errors", label: "Errors" },
  ];

  const rtColor = (ms: number) => ms < 200 ? "#10b981" : ms < 500 ? "#3b82f6" : ms < 1000 ? "#f59e0b" : "#ef4444";
  const rtLabel = (ms: number) => ms < 200 ? "Excellent" : ms < 500 ? "Good" : ms < 1000 ? "Fair" : "Slow";

  if (isLoading && !summary) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-7 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-5 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-16" />
            </Card>
          ))}
        </div>
        <Card className="p-6 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-48" />
        </Card>
      </div>
    );
  }

  const avg = summary?.averageResponseTime ?? 0;
  const reqs = summary?.totalRequests ?? 0;

  return (
    <FadeIn><div>
      {/* header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Performance Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">API performance data from security scans</p>
        </div>
        <button onClick={() => mutate()} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Avg Response", value: `${avg}ms`, sub: `Median: ${summary?.medianResponseTime ?? 0}ms` },
          { label: "P95 Response", value: `${summary?.p95ResponseTime ?? 0}ms`, sub: `Max: ${summary?.maxResponseTime ?? 0}ms` },
          { label: "Success Rate", value: `${summary?.successRate ?? 0}%` },
          { label: "Slow Requests", value: summary?.slowRequests ?? 0, sub: `${summary?.slowRequestRate ?? 0}% of total` },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-5">
              <div className="text-[12px] text-gray-500 mb-2">{k.label}</div>
              <div className="text-2xl font-semibold text-white tracking-tight">{k.value}</div>
              {k.sub && <div className="text-[11px] text-gray-600 mt-1">{k.sub}</div>}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <Card className="p-6 mb-10">
        <h3 className="text-[13px] font-medium text-gray-400 mb-6">24-Hour Response Time</h3>
        {hourlyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={hourlyTrends}>
              <defs>
                <linearGradient id="pm-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="hour" stroke="#4b5563" tick={{ fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleTimeString([], { hour: "2-digit" })} />
              <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
              <Tooltip {...tip} labelFormatter={(v) => new Date(v).toLocaleString()} />
              <Area type="monotone" dataKey="averageResponseTime" name="Avg (ms)" stroke="#06b6d4" fill="url(#pm-fill)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <Empty text="No response time data yet" />
        )}
      </Card>

      {/* Tabs */}
      <LayoutGroup>
        <div className="flex gap-6 border-b border-white/[0.06] mb-8">
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
                <motion.div layoutId="pm-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {tab === "endpoints" && <EndpointsTab endpoints={endpoints} rtColor={rtColor} />}
          {tab === "slowest" && <SlowestTab endpoints={slowest} />}
          {tab === "errors" && <ErrorsTab errors={errors} />}
        </motion.div>
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="text-[11px] text-gray-600 mt-6">
        Performance data collected during security scans. Response times reflect scan duration, not live API latency. For continuous uptime monitoring, upgrade to Enterprise.
      </p>
    </div></FadeIn>
  );
}

/* ─── Endpoints tab ─── */
function EndpointsTab({ endpoints, rtColor }: { endpoints: any[]; rtColor: (ms: number) => string }) {
  if (endpoints.length === 0) return <Empty text="No endpoint performance data. Start making API requests to see metrics." />;
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.04]">
            {["Endpoint", "Requests", "Avg (ms)", "P95 (ms)", "Slow"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {endpoints.map((ep: any, i: number) => (
            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
              <td className="px-4 py-3 font-mono text-cyan-400 text-[12px]">{ep.endpoint}</td>
              <td className="px-4 py-3 text-white text-[13px] font-medium">{ep.requestCount}</td>
              <td className="px-4 py-3">
                <span className="text-[12px] font-medium" style={{ color: rtColor(ep.averageResponseTime) }}>{Math.round(ep.averageResponseTime)}ms</span>
              </td>
              <td className="px-4 py-3 text-gray-400 text-[12px]">{Math.round(ep.p95ResponseTime)}ms</td>
              <td className="px-4 py-3 text-amber-400 text-[12px]">{ep.slowRequests}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ─── Slowest tab ─── */
function SlowestTab({ endpoints }: { endpoints: any[] }) {
  if (endpoints.length === 0) return <Empty text="No slow endpoints detected. All endpoints performing well." />;
  return (
    <div className="space-y-2">
      {endpoints.map((ep: any, i: number) => (
        <Card key={i} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <code className="text-[13px] font-mono text-red-400">{ep.endpoint}</code>
              <div className="flex items-center gap-3 text-[12px] text-gray-500 mt-1">
                <span>Avg: <span className="text-red-400 font-medium">{Math.round(ep.averageResponseTime)}ms</span></span>
                <span>· {ep.requestCount} requests</span>
              </div>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-500/15 text-red-400">SLOW</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Errors tab ─── */
function ErrorsTab({ errors }: { errors: any }) {
  const items = [
    { label: "Client Errors (4xx)", value: errors?.clientErrors ?? 0, desc: "Bad requests, unauthorized, not found" },
    { label: "Server Errors (5xx)", value: errors?.serverErrors ?? 0, desc: "Internal server errors" },
    { label: "Rate Limited (429)", value: errors?.rateLimitErrors ?? 0, desc: "Too many requests" },
    { label: "Unavailable (503)", value: errors?.serviceUnavailable ?? 0, desc: "Service temporarily unavailable" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="p-5">
          <div className="text-[12px] text-gray-500 mb-2">{item.label}</div>
          <div className="text-2xl font-semibold text-white mb-1">{item.value}</div>
          <div className="text-[11px] text-gray-600">{item.desc}</div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Empty state ─── */
function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ChartBarIcon className="w-8 h-8 text-gray-600 mb-3" />
      <p className="text-[13px] text-gray-500 max-w-sm">{text}</p>
    </div>
  );
}
