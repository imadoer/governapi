"use client";

import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import useSWR from "swr";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import {
  ShieldExclamationIcon,
  BugAntIcon,
  ArrowPathIcon,
  GlobeAltIcon,
  BoltIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  DocumentTextIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  SignalIcon,
} from "@heroicons/react/24/outline";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Data                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

const fetcher = (url: string, tid: string) =>
  fetch(url, { headers: { "x-tenant-id": tid } }).then((r) => r.json());

/* ────────────────────────────────────────────────────────────────────────── */
/*  Shared primitives                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

/* Card — matches overview dashboard exactly */
function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}
    >
      {children}
    </div>
  );
}

function Badge({
  children,
  color = "#94a3b8",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{ backgroundColor: color + "18", color }}
    >
      {children}
    </span>
  );
}

function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
}) {
  if (!open) return null;
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 28, stiffness: 380 }}
            className="relative z-10 bg-[#111318] rounded-2xl border border-white/[0.06] shadow-2xl"
            style={{ maxWidth: width, width: "92vw", maxHeight: "85vh", overflow: "auto" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-[15px] font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5">{children}</div>
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-[560px] max-w-[90vw] bg-[#111318] border-l border-white/[0.06] overflow-y-auto"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
              <h3 className="text-[15px] font-semibold text-white">{title}</h3>
              <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

const chartTooltipStyle = {
  contentStyle: {
    background: "#111318",
    border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: "10px",
    fontSize: 12,
  },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#64748b" },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Main                                                                     */
/* ────────────────────────────────────────────────────────────────────────── */

export default function BotProtectionPage({
  companyId,
}: {
  companyId: string;
}) {
  const [tab, setTab] = useState("overview");
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const flash = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 2500);
  };

  const { data: raw, mutate, isLoading } = useSWR(
    [`/api/customer/bot-detection`, companyId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: 30_000 },
  );

  const bot = raw?.success ? raw.botDetection : null;
  const stats = bot?.statistics;
  const detections = bot?.recentDetections ?? [];
  const sources = bot?.topBotSources ?? [];
  const trends = bot?.hourlyTrends ?? [];
  const scoreDist = bot?.scoreDistribution;
  const asn = bot?.asnIntelligence;
  const headless = bot?.headlessDetection;
  const velocity = bot?.velocityAnalysis;
  const crawler = bot?.crawlerVerification;

  const blockIp = async (ip: string) => {
    try {
      const r = await fetch("/api/customer/block-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ action: "block", sourceIp: ip, reason: "Manual block" }),
      });
      if (r.ok) { setBlockedIps((s) => new Set(s).add(ip)); mutate(); flash(`Blocked ${ip}`); }
      else flash("Block failed", false);
    } catch { flash("Block failed", false); }
  };

  const unblockIp = async (ip: string) => {
    try {
      const r = await fetch("/api/customer/block-ip", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ action: "unblock", sourceIp: ip, reason: "Manual unblock" }),
      });
      if (r.ok) {
        setBlockedIps((s) => { const n = new Set(s); n.delete(ip); return n; });
        mutate(); flash(`Unblocked ${ip}`);
      } else flash("Unblock failed", false);
    } catch { flash("Unblock failed", false); }
  };

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "threats", label: "Live Threats" },
    { key: "rules", label: "Rules" },
    { key: "analytics", label: "Analytics" },
    { key: "export", label: "Export" },
  ];

  if (isLoading && !stats) {
    return <PageSkeleton />;
  }

  return (
    <FadeIn><div>
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
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Bot Protection</h1>
          <p className="text-sm text-gray-500 mt-1">Automated threat detection & response</p>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {/* tabs — underline style */}
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
                  layoutId="bot-tab"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>

      {/* content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {tab === "overview" && <OverviewTab stats={stats} scoreDist={scoreDist} trends={trends} />}
          {tab === "threats" && (
            <ThreatsTab
              detections={detections}
              sources={sources}
              blockedIps={blockedIps}
              onBlock={blockIp}
              onUnblock={unblockIp}
            />
          )}
          {tab === "rules" && <RulesTab companyId={companyId} flash={flash} />}
          {tab === "analytics" && (
            <AnalyticsTab asn={asn} headless={headless} velocity={velocity} crawler={crawler} trends={trends} />
          )}
          {tab === "export" && <ExportTab stats={stats} flash={flash} />}
        </motion.div>
      </AnimatePresence>
    </div></FadeIn>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Overview                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

function OverviewTab({ stats, scoreDist, trends }: any) {
  const kpis = [
    { label: "Bot Requests", value: stats?.botRequests ?? 0, icon: BugAntIcon },
    { label: "Blocked", value: stats?.blockedRequests ?? 0, icon: ShieldExclamationIcon },
    { label: "Unique IPs", value: stats?.uniqueIps ?? 0, icon: GlobeAltIcon },
    { label: "Detection Rate", value: `${stats?.botDetectionRate ?? 0}%`, icon: SignalIcon },
  ];

  return (
    <div className="space-y-10">
      {/* kpi row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
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

      {/* score ring + distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3">
          <ScoreRing score={scoreDist?.avg_score ?? 0} />
        </div>
        <div className="lg:col-span-9">
          <DistributionBars dist={scoreDist} />
        </div>
      </div>

      {/* timeline */}
      <TimelineChart trends={trends} />
    </div>
  );
}

/* slim animated ring — same SVG approach as SecurityScore on overview */
function ScoreRing({ score }: { score: number }) {
  const v = Math.round(score);
  const color = v >= 80 ? "#ef4444" : v >= 60 ? "#f59e0b" : v >= 40 ? "#eab308" : "#10b981";
  const label = v >= 80 ? "Critical" : v >= 60 ? "High" : v >= 40 ? "Medium" : "Secure";
  const r = 54;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(v, 100) / 100);

  return (
    <Card className="p-6 flex flex-col items-center justify-center h-full">
      <span className="text-[11px] text-gray-500 font-medium uppercase tracking-widest mb-4">Bot Score</span>
      <div className="relative w-[130px] h-[130px]">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
          <motion.circle
            cx="60" cy="60" r={r}
            fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: off }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-semibold text-white">{v}</span>
          <span className="text-[11px] text-gray-500">{label}</span>
        </div>
      </div>
    </Card>
  );
}

/* horizontal bar chart for score distribution */
function DistributionBars({ dist }: { dist: any }) {
  const levels = [
    { label: "Critical", key: "critical_count", range: "80–100", color: "#ef4444" },
    { label: "High",     key: "high_count",     range: "60–79",  color: "#f59e0b" },
    { label: "Medium",   key: "medium_count",   range: "40–59",  color: "#eab308" },
    { label: "Low",      key: "low_count",       range: "20–39",  color: "#06b6d4" },
    { label: "Safe",     key: "safe_count",      range: "0–19",   color: "#10b981" },
  ];
  const total = levels.reduce((s, l) => s + (dist?.[l.key] ?? 0), 0) || 1;

  return (
    <Card className="p-6 h-full">
      <h3 className="text-[13px] font-medium text-gray-400 mb-6">Threat Score Distribution</h3>
      <div className="space-y-4">
        {levels.map((l) => {
          const count = dist?.[l.key] ?? 0;
          const pct = (count / total) * 100;
          return (
            <div key={l.key} className="flex items-center gap-4">
              <div className="w-16 text-[12px] text-gray-500 shrink-0">{l.label}</div>
              <div className="flex-1 h-2 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color(l.color) }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="w-8 text-right text-[12px] font-medium text-white tabular-nums">{count}</div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function color(c: string) { return c; }

function TimelineChart({ trends }: { trends: any[] }) {
  const data = trends.map((t: any) => ({
    time: new Date(t.hour).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    requests: t.totalRequests ?? 0,
    bots: t.botRequests ?? 0,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-[13px] font-medium text-gray-400 mb-6">24-Hour Activity</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="bp-req" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="bp-bot" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="time" stroke="#4b5563" tick={{ fontSize: 11 }} />
            <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
            <RechartsTooltip {...chartTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
            <Area type="monotone" dataKey="requests" name="Requests" stroke="#06b6d4" fill="url(#bp-req)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="bots" name="Bots" stroke="#ef4444" fill="url(#bp-bot)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-16 text-gray-600 text-sm">No activity data</div>
      )}
    </Card>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Live Threats                                                             */
/* ────────────────────────────────────────────────────────────────────────── */

function ThreatsTab({ detections, sources, blockedIps, onBlock, onUnblock }: any) {
  const [selected, setSelected] = useState<any>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(detections.length / pageSize));
  const rows = detections.slice((page - 1) * pageSize, page * pageSize);

  const sevColor = (s: number) => (s >= 80 ? "#ef4444" : s >= 60 ? "#f59e0b" : s >= 40 ? "#eab308" : "#06b6d4");

  return (
    <div className="space-y-8">
      {/* threat table */}
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h3 className="text-[13px] font-medium text-white">Live Threat Feed</h3>
          </div>
          <span className="text-[12px] text-gray-500">{detections.length} threats</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Time", "Source IP", "Type", "Confidence", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => {
                const blocked = blockedIps.has(r.sourceIp);
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r)}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-500 text-[12px]">{new Date(r.detectedAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-3 font-mono text-cyan-400 text-[13px]">{r.sourceIp}</td>
                    <td className="px-4 py-3 text-gray-400 text-[12px]">{r.detectionReason}</td>
                    <td className="px-4 py-3"><Badge color={sevColor(r.confidenceScore)}>{r.confidenceScore}%</Badge></td>
                    <td className="px-4 py-3"><Badge color={blocked ? "#ef4444" : "#f59e0b"}>{blocked ? "Blocked" : "Detected"}</Badge></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {!blocked ? (
                        <button onClick={() => onBlock(r.sourceIp)} className="text-[11px] text-red-400 hover:text-red-300">Block</button>
                      ) : (
                        <button onClick={() => onUnblock(r.sourceIp)} className="text-[11px] text-gray-500 hover:text-gray-300">Unblock</button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-16 text-center text-gray-600 text-sm">No threats detected</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-white/[0.04]">
            <span className="text-[11px] text-gray-600">{detections.length} total</span>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2.5 py-1 rounded text-[11px] text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors">Prev</button>
              <span className="text-[11px] text-gray-500">{page}/{totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2.5 py-1 rounded text-[11px] text-gray-400 hover:bg-white/5 disabled:opacity-30 transition-colors">Next</button>
            </div>
          </div>
        )}
      </Card>

      {/* top sources */}
      {sources.length > 0 && (
        <div>
          <h3 className="text-[13px] font-medium text-gray-400 mb-4">Top Sources</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sources.slice(0, 6).map((s: any, i: number) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-[13px] text-cyan-400">{s.sourceIp}</span>
                  <span className="text-xl font-semibold text-red-400">{s.detectionCount}</span>
                </div>
                <div className="flex gap-4 text-[12px] text-gray-500">
                  <span>Blocked: <span className="text-emerald-400">{s.blockedCount}</span></span>
                  <span>Confidence: <span className="text-amber-400">{Math.round(s.averageConfidence)}%</span></span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* drawer */}
      <Drawer open={!!selected} onClose={() => setSelected(null)} title="Investigate Threat">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Badge color={sevColor(selected.confidenceScore)}>
                {selected.confidenceScore >= 80 ? "Critical" : selected.confidenceScore >= 60 ? "High" : "Medium"}
              </Badge>
              <span className="text-3xl font-semibold" style={{ color: sevColor(selected.confidenceScore) }}>{selected.confidenceScore}%</span>
            </div>
            <div className="space-y-2">
              {[
                ["IP Address", selected.sourceIp, true],
                ["Time", new Date(selected.detectedAt).toLocaleString()],
                ["Reason", selected.detectionReason],
                ["User Agent", selected.userAgent],
                ["Path", selected.requestPath],
              ].map(([label, val, mono]: any) => (
                <div key={label} className="flex justify-between py-2 border-b border-white/[0.04]">
                  <span className="text-[12px] text-gray-500">{label}</span>
                  <span className={`text-[12px] text-white text-right max-w-[300px] truncate ${mono ? "font-mono text-cyan-400" : ""}`}>{val}</span>
                </div>
              ))}
            </div>
            <div className="pt-2">
              {!blockedIps.has(selected.sourceIp) ? (
                <button onClick={() => { onBlock(selected.sourceIp); setSelected(null); }} className="w-full py-2.5 rounded-lg text-[13px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors">Block IP</button>
              ) : (
                <button onClick={() => { onUnblock(selected.sourceIp); setSelected(null); }} className="w-full py-2.5 rounded-lg text-[13px] font-medium bg-white/5 text-gray-400 border border-white/[0.06] hover:bg-white/10 transition-colors">Unblock IP</button>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Rules                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

function RulesTab({ companyId, flash }: { companyId: string; flash: (t: string, ok?: boolean) => void }) {
  const { data, mutate, isLoading } = useSWR(
    [`/api/customer/bot-rules`, companyId],
    ([url, id]: [string, string]) => fetcher(url, id),
  );
  const rules = data?.success ? data.rules ?? [] : [];

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [action, setAction] = useState("BLOCK");
  const [priority, setPriority] = useState(50);

  const reset = () => { setName(""); setDesc(""); setAction("BLOCK"); setPriority(50); };

  const actionColor = (a: string) => {
    if (a === "BLOCK") return "#ef4444";
    if (a === "CHALLENGE") return "#f59e0b";
    if (a === "MONITOR") return "#06b6d4";
    if (a === "ALLOW") return "#10b981";
    return "#94a3b8";
  };

  const save = async () => {
    if (!name) return;
    try {
      const r = await fetch("/api/customer/bot-rules", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify(editing ? { id: editing.id, name, description: desc, action, priority } : { name, description: desc, action, priority }),
      });
      if (r.ok) { setModal(false); setEditing(null); reset(); mutate(); flash(editing ? "Rule updated" : "Rule created"); }
      else flash("Save failed", false);
    } catch { flash("Save failed", false); }
  };

  const toggle = async (id: number, enabled: boolean) => {
    const rule = rules.find((r: any) => r.id === id);
    if (!rule) return;
    try {
      await fetch("/api/customer/bot-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ ...rule, id, enabled }),
      });
      mutate(); flash(enabled ? "Rule enabled" : "Rule disabled");
    } catch { flash("Toggle failed", false); }
  };

  const confirmDelete = async () => {
    if (deleting == null) return;
    try {
      await fetch(`/api/customer/bot-rules?id=${deleting}`, { method: "POST", headers: { "x-tenant-id": companyId } });
      mutate(); flash("Rule deleted");
    } catch { flash("Delete failed", false); }
    setDeleting(null);
  };

  const input = "w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white text-[13px] placeholder-gray-600 focus:outline-none focus:border-white/[0.12] transition-colors";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-medium text-gray-400">Detection Rules</h3>
        <button
          onClick={() => { setEditing(null); reset(); setModal(true); }}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors"
        >
          New Rule
        </button>
      </div>

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-cyan-500/30 border-t-cyan-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {["Priority", "Name", "Action", "Enabled", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r: any) => (
                <tr key={r.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><span className="text-[12px] text-gray-500 font-mono">{r.priority}</span></td>
                  <td className="px-4 py-3">
                    <div className="text-[13px] text-white font-medium">{r.name}</div>
                    {r.description && <div className="text-[11px] text-gray-600 mt-0.5">{r.description}</div>}
                  </td>
                  <td className="px-4 py-3"><Badge color={actionColor(r.action)}>{r.action}</Badge></td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle(r.id, !r.enabled)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${r.enabled ? "bg-emerald-500" : "bg-gray-700"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${r.enabled ? "left-[18px]" : "left-0.5"}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setEditing(r); setName(r.name); setDesc(r.description || ""); setAction(r.action); setPriority(r.priority); setModal(true); }} className="text-[11px] text-gray-500 hover:text-white transition-colors">Edit</button>
                      <button onClick={() => setDeleting(r.id)} className="text-[11px] text-gray-500 hover:text-red-400 transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {rules.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-16 text-center text-gray-600 text-sm">No rules configured</td></tr>
              )}
            </tbody>
          </table>
        )}
      </Card>

      {/* create/edit */}
      <Modal open={modal} onClose={() => { setModal(false); setEditing(null); reset(); }} title={editing ? "Edit Rule" : "Create Rule"}
        footer={<>
          <button onClick={() => { setModal(false); reset(); }} className="px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={save} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors">{editing ? "Update" : "Create"}</button>
        </>}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[12px] text-gray-400 mb-1.5">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Block Datacenter IPs" className={input} />
          </div>
          <div>
            <label className="block text-[12px] text-gray-400 mb-1.5">Description</label>
            <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Optional" className={input + " resize-none"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] text-gray-400 mb-1.5">Action</label>
              <select value={action} onChange={(e) => setAction(e.target.value)} className={input + " appearance-none cursor-pointer"}>
                <option value="BLOCK">Block</option>
                <option value="CHALLENGE">Challenge</option>
                <option value="MONITOR">Monitor</option>
                <option value="ALLOW">Allow</option>
              </select>
            </div>
            <div>
              <label className="block text-[12px] text-gray-400 mb-1.5">Priority</label>
              <input type="number" value={priority} onChange={(e) => setPriority(+e.target.value)} className={input} />
            </div>
          </div>
        </div>
      </Modal>

      {/* delete confirm */}
      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete Rule" width={400}
        footer={<>
          <button onClick={() => setDeleting(null)} className="px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
          <button onClick={confirmDelete} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">Delete</button>
        </>}
      >
        <p className="text-[13px] text-gray-400">This rule will be permanently removed.</p>
      </Modal>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Analytics                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

function AnalyticsTab({ asn, headless, velocity, crawler, trends }: any) {
  const topAsn = asn?.topDatacenterAsns?.[0];
  const hs = headless?.statistics;
  const cs = crawler?.statistics;
  const totalHeadless = hs?.total_headless ?? 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ASN */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <GlobeAltIcon className="w-4 h-4 text-gray-500" />
            <h3 className="text-[12px] font-medium text-gray-500">ASN Intelligence</h3>
          </div>
          {topAsn ? (
            <div className="space-y-3">
              <div>
                <div className="text-[13px] text-white font-medium truncate">{topAsn.asn_org || "Unknown"}</div>
                <div className="text-[11px] text-emerald-400 font-mono">{topAsn.asn_number}</div>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Attacks</span>
                <span className="text-red-400 font-medium">{topAsn.attack_count}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-gray-500">Block Rate</span>
                <span className="text-emerald-400 font-medium">{Math.round((topAsn.blocked_count / topAsn.attack_count) * 100)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div className="h-full rounded-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(topAsn.blocked_count / topAsn.attack_count) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 text-[12px]">No data</div>
          )}
        </Card>

        {/* Headless */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <CpuChipIcon className="w-4 h-4 text-gray-500" />
            <h3 className="text-[12px] font-medium text-gray-500">Headless Browsers</h3>
          </div>
          {totalHeadless > 0 ? (
            <div className="space-y-3">
              <div className="flex gap-4">
                <div className="flex-1 text-center py-3 rounded-lg bg-violet-500/[0.06] border border-violet-500/10">
                  <div className="text-xl font-semibold text-violet-400">{totalHeadless}</div>
                  <div className="text-[10px] text-gray-500">Detected</div>
                </div>
                <div className="flex-1 text-center py-3 rounded-lg bg-red-500/[0.06] border border-red-500/10">
                  <div className="text-xl font-semibold text-red-400">{hs?.blocked_count ?? 0}</div>
                  <div className="text-[10px] text-gray-500">Blocked</div>
                </div>
              </div>
              {[
                { name: "Playwright", val: hs?.playwright_count ?? 0, col: "#a78bfa" },
                { name: "Puppeteer", val: hs?.puppeteer_count ?? 0, col: "#06b6d4" },
                { name: "Selenium", val: hs?.selenium_count ?? 0, col: "#10b981" },
              ].map((b) => (
                <div key={b.name} className="flex items-center justify-between text-[12px]">
                  <span className="text-gray-500">{b.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{b.val}</span>
                    <div className="w-14 h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: totalHeadless ? `${(b.val / totalHeadless) * 100}%` : "0%", backgroundColor: b.col }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 text-[12px]">No data</div>
          )}
        </Card>

        {/* Crawler */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheckIcon className="w-4 h-4 text-gray-500" />
            <h3 className="text-[12px] font-medium text-gray-500">Crawler Verification</h3>
          </div>
          <div className="flex gap-4 mb-4">
            <div className="flex-1 text-center py-3 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/10">
              <div className="text-xl font-semibold text-emerald-400">{cs?.verified_count ?? 0}</div>
              <div className="text-[10px] text-gray-500">Verified</div>
            </div>
            <div className="flex-1 text-center py-3 rounded-lg bg-red-500/[0.06] border border-red-500/10">
              <div className="text-xl font-semibold text-red-400">{cs?.impostor_count ?? 0}</div>
              <div className="text-[10px] text-gray-500">Fake</div>
            </div>
          </div>
          {cs && (
            <div className="space-y-2 pt-3 border-t border-white/[0.04]">
              {[
                ["Googlebot", cs.googlebot_count ?? 0],
                ["Bingbot", cs.bingbot_count ?? 0],
                ["DuckDuckBot", cs.duckduckbot_count ?? 0],
              ].map(([name, val]) => (
                <div key={name as string} className="flex justify-between text-[12px]">
                  <span className="text-gray-500">{name}</span>
                  <span className="text-white font-medium">{val}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* velocity */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <BoltIcon className="w-4 h-4 text-gray-500" />
          <h3 className="text-[12px] font-medium text-gray-500">Velocity Analysis</h3>
        </div>
        {(() => {
          const data = trends.slice(-12).map((t: any) => ({ hour: new Date(t.hour).getHours() + "h", bots: t.botRequests ?? 0 }));
          if (!data.length) return <div className="text-center py-12 text-gray-600 text-[12px]">No data</div>;
          return (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="bp-vel" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="hour" stroke="#4b5563" tick={{ fontSize: 11 }} />
                <YAxis stroke="#4b5563" tick={{ fontSize: 11 }} />
                <RechartsTooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="bots" stroke="#eab308" fill="url(#bp-vel)" strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          );
        })()}
        {velocity?.topRequesters?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-2">
            <span className="text-[11px] text-gray-500 font-medium">Top Requesters</span>
            {velocity.topRequesters.slice(0, 3).map((r: any, i: number) => (
              <div key={i} className="flex justify-between text-[12px]">
                <span className="font-mono text-white">{r.source_ip}</span>
                <span className="text-amber-400 font-medium">{r.total_requests} req</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Export                                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

function ExportTab({ stats, flash }: any) {
  const [busy, setBusy] = useState(false);

  const doExport = async (type: "pdf" | "csv") => {
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const rows = [
        ["Metric", "Value"],
        ["Total Requests", stats?.totalRequests ?? 0],
        ["Bot Requests", stats?.botRequests ?? 0],
        ["Blocked", stats?.blockedRequests ?? 0],
        ["Detection Rate", `${stats?.botDetectionRate ?? 0}%`],
        ...(type === "csv" ? [["Unique IPs", stats?.uniqueIps ?? 0]] : []),
      ];
      const csv = rows.map((r) => r.join(",")).join("\n");
      const b = new Blob([csv], { type: "text/csv" });
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u; a.download = `bot-protection-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); URL.revokeObjectURL(u); a.remove();
      flash(`${type.toUpperCase()} exported`);
    } catch { flash("Export failed", false); }
    setBusy(false);
  };

  return (
    <div className="space-y-8">
      <h3 className="text-[13px] font-medium text-gray-400">Reports & Export</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <DocumentTextIcon className="w-6 h-6 text-red-400 mb-4" />
          <h4 className="text-[14px] font-medium text-white mb-1">PDF Report</h4>
          <p className="text-[12px] text-gray-500 mb-5">Comprehensive security report</p>
          <button disabled={busy} onClick={() => doExport("pdf")}
            className="w-full py-2 rounded-lg text-[12px] font-medium border transition-colors disabled:opacity-50 bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20">
            {busy ? "Exporting..." : "Generate PDF"}
          </button>
        </Card>
        <Card className="p-6">
          <ArrowDownTrayIcon className="w-6 h-6 text-emerald-400 mb-4" />
          <h4 className="text-[14px] font-medium text-white mb-1">CSV Data</h4>
          <p className="text-[12px] text-gray-500 mb-5">Raw data for analysis</p>
          <button disabled={busy} onClick={() => doExport("csv")}
            className="w-full py-2 rounded-lg text-[12px] font-medium border transition-colors disabled:opacity-50 bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20">
            {busy ? "Exporting..." : "Generate CSV"}
          </button>
        </Card>
      </div>

      {/* summary */}
      <Card className="p-6">
        <h3 className="text-[13px] font-medium text-gray-400 mb-6">Summary (24h)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: "Total Requests", value: stats?.totalRequests?.toLocaleString() ?? "0", color: "text-white" },
            { label: "Bot Requests", value: stats?.botRequests?.toLocaleString() ?? "0", color: "text-amber-400" },
            { label: "Blocked", value: stats?.blockedRequests?.toLocaleString() ?? "0", color: "text-red-400" },
            { label: "Detection Rate", value: `${stats?.botDetectionRate ?? 0}%`, color: "text-emerald-400" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[12px] text-gray-500 mb-1">{s.label}</div>
              <div className={`text-2xl font-semibold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
