"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowPathIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { padChartData } from "../../../../utils/chart-utils";
import { PageSkeleton } from "./PageSkeleton";
const fetcher = (url: string, _tid: string) => {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") || "" : "";
  return fetch(url, { headers: token ? { "Authorization": `Bearer ${token}` } : {}, credentials: "include" }).then((r) => r.json());
};

const tip = {
  contentStyle: { background: "#111318", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12 },
  itemStyle: { color: "#e2e8f0" }, labelStyle: { color: "#64748b" },
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

/* ── Attack surface mappings ── */
const ATTACK_VECTORS: Record<string, { name: string; description: string; risk: string; indicators: string[] }> = {
  "Missing HSTS": {
    name: "Man-in-the-Middle Attack",
    description: "Without HSTS, attackers can intercept traffic by downgrading HTTPS to HTTP. This is especially dangerous on public Wi-Fi networks.",
    risk: "high",
    indicators: ["HTTP Strict Transport Security Not Enabled"],
  },
  "Missing CSP": {
    name: "Cross-Site Scripting (XSS)",
    description: "Without CSP, injected scripts can execute freely — stealing session tokens, redirecting users, or exfiltrating data.",
    risk: "high",
    indicators: ["No Content Security Policy"],
  },
  "Missing X-Frame-Options": {
    name: "Clickjacking",
    description: "Your API responses can be embedded in iframes on attacker-controlled sites to trick users into unintended actions.",
    risk: "medium",
    indicators: ["Clickjacking Protection Missing"],
  },
  "Insecure CORS Configuration": {
    name: "Cross-Origin Data Theft",
    description: "Overly permissive CORS allows any website to read your API responses, potentially exposing user data to malicious sites.",
    risk: "high",
    indicators: ["Overly Permissive CORS Policy"],
  },
  "Information Disclosure": {
    name: "Server Fingerprinting",
    description: "Exposed server version headers help attackers identify known vulnerabilities in your specific software version.",
    risk: "medium",
    indicators: ["Server Version Disclosure"],
  },
  "Missing X-Content-Type-Options": {
    name: "MIME Sniffing Attack",
    description: "Without this header, browsers may interpret files as a different content type, enabling content injection attacks.",
    risk: "low",
    indicators: ["MIME Sniffing Not Prevented"],
  },
};

export default function ThreatSurfacePage({ companyId }: { companyId: string }) {
  const [tab, setTab] = useState("surface");
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: vulnData, mutate } = useSWR(
    [`/api/customer/vulnerabilities`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
  );

  const { data: trendsData } = useSWR(
    [`/api/customer/security-metrics/trends/per-scan`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
  );

  const { data: metricsData } = useSWR(
    [`/api/customer/security-metrics`, companyId],
    ([u, id]: [string, string]) => fetcher(u, id),
  );

  const vulns = vulnData?.success ? vulnData.vulnerabilities ?? [] : [];
  const summary = vulnData?.success ? vulnData.summary : null;
  const metrics = metricsData?.success ? metricsData.metrics : null;
  const trends = trendsData?.success ? trendsData.trends ?? [] : [];
  const hasData = vulns.length > 0 || (metrics?.securityScore ?? 0) > 0;

  // Group vulns by type, deduplicate by endpoint URL
  const vulnsByType: Record<string, any[]> = {};
  for (const v of vulns) {
    const t = v.vulnerability_type || "Other";
    if (!vulnsByType[t]) vulnsByType[t] = [];
    const url = v.affected_url || v.scan_url || v.endpoint;
    const alreadyHas = vulnsByType[t].some((existing) =>
      (existing.affected_url || existing.scan_url || existing.endpoint) === url
    );
    if (!alreadyHas) vulnsByType[t].push(v);
  }

  // Build attack surface from actual vulnerabilities
  const attackSurface = Object.entries(ATTACK_VECTORS)
    .filter(([type]) => vulnsByType[type])
    .map(([type, vector]) => ({
      ...vector,
      vulnType: type,
      count: vulnsByType[type].length,
      vulns: vulnsByType[type],
    }));

  // Trend data for chart — per-scan: each scan is a point
  const trendChart = trends.slice(-20).map((t: any, i: number) => {
    const d = new Date(t.date);
    const host = t.target ? (() => { try { return new URL(t.target).hostname.replace(/^www\./, ""); } catch { return ""; } })() : "";
    return {
      date: host ? `${host.split(".")[0]}` : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      score: t.securityScore ?? 0,
    };
  });

  const tabs = [
    { key: "surface", label: "Attack Surface" },
    { key: "trend", label: "Trend" },
  ];

  if (!hasData && !metricsData) return <PageSkeleton />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Threat Surface</h1>
          <p className="text-sm text-gray-500 mt-1">What attackers see when they look at your APIs</p>
        </div>
        <button onClick={() => mutate()} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
          <ArrowPathIcon className="w-4 h-4" />
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Security Score", value: `${metrics?.securityScore ?? 0}/100`, color: (metrics?.securityScore ?? 0) >= 80 ? "#10b981" : (metrics?.securityScore ?? 0) >= 60 ? "#f59e0b" : "#ef4444" },
          { label: "Open Findings", value: summary?.total ?? vulns.length },
          { label: "Attack Vectors", value: attackSurface.length },
          { label: "High Risk", value: attackSurface.filter((a) => a.risk === "high").length },
        ].map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="p-5">
              <div className="text-[12px] text-gray-500 mb-2">{k.label}</div>
              <div className="text-2xl font-semibold" style={{ color: (k as any).color || "white" }}>{k.value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <LayoutGroup>
        <div className="flex gap-6 border-b border-white/[0.06] mb-8">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`relative pb-3 text-[13px] font-medium transition-colors ${tab === t.key ? "text-white" : "text-gray-500 hover:text-gray-300"}`}>
              {t.label}
              {tab === t.key && (
                <motion.div layoutId="ts-tab" className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-full"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }} />
              )}
            </button>
          ))}
        </div>
      </LayoutGroup>

      {tab === "surface" && (
        <div className="space-y-6">
          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <p className="text-[15px] text-gray-400 mb-1">No findings yet</p>
              <p className="text-[13px] text-gray-600">Run a security scan to map your threat surface</p>
            </div>
          ) : (
            <>
              {/* Disclosure note */}
              <p className="text-[11px] text-gray-600">
                Based on external scanning of your API endpoints. Shows what an attacker would find without authentication.
              </p>

              {/* Attack vectors */}
              {attackSurface.length > 0 ? (
                <div className="space-y-2">
                  {attackSurface.map((attack) => {
                    const isOpen = expanded === attack.vulnType;
                    return (
                      <Card key={attack.vulnType} className="overflow-hidden">
                        <button
                          onClick={() => setExpanded(isOpen ? null : attack.vulnType)}
                          className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className={`shrink-0 w-2 h-2 rounded-full ${
                              attack.risk === "high" ? "bg-red-400" : attack.risk === "medium" ? "bg-amber-400" : "bg-cyan-400"
                            }`} />
                            <div className="min-w-0">
                              <div className="text-[13px] text-white font-medium">{attack.name}</div>
                              <div className="text-[11px] text-gray-600 truncate">{attack.count} finding{attack.count > 1 ? "s" : ""} — {attack.vulnType}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              attack.risk === "high" ? "bg-red-500/15 text-red-400" :
                              attack.risk === "medium" ? "bg-amber-500/15 text-amber-400" :
                              "bg-cyan-500/15 text-cyan-400"
                            }`}>{attack.risk.toUpperCase()}</span>
                            <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                          </div>
                        </button>

                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="overflow-hidden">
                              <div className="px-4 pb-4 space-y-3">
                                <div>
                                  <div className="text-[11px] font-medium text-gray-400 mb-1">How this could be exploited</div>
                                  <p className="text-[12px] text-gray-300">{attack.description}</p>
                                </div>
                                <div>
                                  <div className="text-[11px] font-medium text-gray-400 mb-1">What our scan found</div>
                                  <div className="space-y-1">
                                    {attack.vulns.slice(0, 8).map((v: any, i: number) => {
                                      const url = v.affected_url || v.scan_url || v.endpoint;
                                      return (
                                        <div key={i} className="flex items-center gap-2 text-[12px] py-1.5 px-2 rounded bg-white/[0.02]">
                                          <span className="text-red-400 shrink-0">●</span>
                                          <span className="text-white shrink-0">{v.title}</span>
                                          {url && <span className="text-gray-500 truncate">— {url}</span>}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-[11px] font-medium text-gray-400 mb-1">Impact if exploited</div>
                                  <p className="text-[12px] text-gray-300">
                                    {attack.risk === "high"
                                      ? "Could lead to data breach, session hijacking, or unauthorized data access."
                                      : attack.risk === "medium"
                                      ? "Could enable targeted attacks or help attackers plan more sophisticated exploits."
                                      : "Low-severity issue that provides minor information advantage to attackers."}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-[14px] text-emerald-400 font-medium mb-1">No attack vectors identified</p>
                  <p className="text-[12px] text-gray-500">Your APIs passed all security checks. Keep scanning regularly to stay safe.</p>
                </Card>
              )}

              {/* Server tech detected */}
              {vulns.some((v: any) => v.vulnerability_type === "Information Disclosure") && (
                <Card className="p-5">
                  <h3 className="text-[13px] font-medium text-gray-400 mb-3">Detected Technology Stack</h3>
                  <p className="text-[11px] text-gray-600 mb-2">Exposed server headers reveal your tech stack to attackers</p>
                  <div className="flex flex-wrap gap-2">
                    {vulns.filter((v: any) => v.vulnerability_type === "Information Disclosure").map((v: any, i: number) => (
                      <span key={i} className="px-2 py-1 text-[11px] bg-white/[0.03] border border-white/[0.06] rounded text-gray-400">
                        {v.title}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {tab === "trend" && (
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-[13px] font-medium text-gray-400 mb-6">Security Score Over Time</h3>
            {trendChart.length > 0 ? (
              <>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={padChartData(trendChart)}>
                  <defs>
                    <linearGradient id="ts-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="date" stroke="#4b5563" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fontSize: 11 }} />
                  <RechartsTooltip {...tip} />
                  <Area type="monotone" dataKey="score" name="Score" stroke="#06b6d4" fill="url(#ts-fill)" strokeWidth={2} dot={{ r: 4, fill: "#06b6d4", strokeWidth: 0 }} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
              {trendChart.length < 3 && (
                <p className="text-[11px] text-gray-600 mt-3 text-center">
                  Charts populate as you run more scans over time. Set up scheduled scans in API Management to track trends automatically.
                </p>
              )}
              </>
            ) : (
              <div className="text-center py-16 text-gray-600 text-[13px]">
                Need at least 2 data points. Run more scans to see trends.
                <p className="text-[11px] text-gray-700 mt-2">Set up scheduled scans in API Management to track trends automatically.</p>
              </div>
            )}
          </Card>

          <p className="text-[11px] text-gray-600">
            Scores are calculated from external scan results. Higher is better. Fix vulnerabilities to improve your score over time.
          </p>
        </div>
      )}
    </div>
  );
}
