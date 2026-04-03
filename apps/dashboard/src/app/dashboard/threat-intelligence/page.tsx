"use client";

import { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldExclamationIcon,
  FireIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  ChartBarIcon,
  MapPinIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

const fetcher = (url: string, tenantId: string) =>
  fetch(url, { headers: { "x-tenant-id": tenantId } }).then((res) => res.json());

interface ThreatIntelligenceData {
  success: boolean;
  threatIntelligence: {
    summary: {
      totalThreats: number;
      blockedThreats: number;
      criticalThreats: number;
      highThreats: number;
      mediumThreats: number;
      lowThreats: number;
      averageRiskScore: number;
      uniqueSources: number;
      timeframe: string;
      updatedAt: string;
    };
    topThreats: Array<{
      type: string;
      count: number;
      avgRiskScore: number;
      lastSeen: string;
    }>;
    geoDistribution: Array<{
      country: string;
      count: number;
      blocked: number;
    }>;
    trends: Array<{
      timestamp: string;
      count: number;
      blocked: number;
      avgRisk: number;
    }>;
    recentBlocked: Array<{
      id: string;
      threat_type: string;
      source_ip: string;
      target_endpoint: string;
      severity: string;
      action_taken: string;
      blocked_at: string;
      risk_score: number;
      country: string;
    }>;
    threatSources: Array<{
      source_ip: string;
      threat_count: number;
      blocked_count: number;
      last_activity: string;
      threat_types: string[];
      country: string;
      avg_risk_score: number;
    }>;
    patterns: Array<{
      id: string;
      name: string;
      type: string;
      severity: string;
      isActive: boolean;
      createdAt: string;
    }>;
    attackVectors: Array<{
      vector: string;
      count: number;
    }>;
  };
}

function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
    HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    LOW: "bg-green-500/15 text-green-400 border-green-500/30",
  };
  const cls = colors[severity.toUpperCase()] || "bg-slate-500/15 text-slate-400 border-slate-500/30";
  return (
    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${cls}`}>
      {severity}
    </span>
  );
}

function TagPill({ children, color = "cyan" }: { children: React.ReactNode; color?: string }) {
  const colorMap: Record<string, string> = {
    cyan: "bg-cyan-500/15 text-cyan-400",
    red: "bg-red-500/15 text-red-400",
    blue: "bg-blue-500/15 text-blue-400",
    green: "bg-green-500/15 text-green-400",
    slate: "bg-slate-500/15 text-slate-400",
  };
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${colorMap[color] || colorMap.cyan}`}>
      {children}
    </span>
  );
}

export default function ThreatIntelligencePage() {
  const [timeframe, setTimeframe] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState("live-threats");
  const [blockingIPs, setBlockingIPs] = useState<Set<string>>(new Set());
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const tenantId = "1";

  const { data, error, isLoading, mutate } = useSWR<ThreatIntelligenceData>(
    [`/api/customer/threat-intelligence?timeframe=${timeframe}`, tenantId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: autoRefresh ? 30000 : 0 }
  );

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleToggleBlock = async (ip: string, currentlyBlocked: boolean) => {
    setBlockingIPs(prev => new Set(prev).add(ip));

    try {
      const action = currentlyBlocked ? "unblock" : "block";
      const response = await fetch("/api/customer/block-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({
          sourceIp: ip,
          action: action,
          duration: 86400000,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setBlockedIPs(prev => {
          const newSet = new Set(prev);
          if (action === "block") newSet.add(ip);
          else newSet.delete(ip);
          return newSet;
        });
        showToast(`${ip} ${action}ed successfully`);
        mutate();
      } else {
        showToast(result.error || `Failed to ${action} IP`);
      }
    } catch {
      showToast("Network error - please try again");
    } finally {
      setBlockingIPs(prev => {
        const newSet = new Set(prev);
        newSet.delete(ip);
        return newSet;
      });
    }
  };

  const isIPBlocked = (ip: string) => blockedIPs.has(ip);
  const isIPBlocking = (ip: string) => blockingIPs.has(ip);

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL": return "#dc2626";
      case "HIGH": return "#ea580c";
      case "MEDIUM": return "#ca8a04";
      case "LOW": return "#16a34a";
      default: return "#6b7280";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto" />
          <p className="text-slate-400 mt-4">Loading Threat Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Failed to load threat data</h3>
          <p className="text-slate-400 mb-4">Please try again later</p>
          <button
            onClick={() => mutate()}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { threatIntelligence } = data;
  const { summary } = threatIntelligence;

  const threatDistribution = [
    { name: "Critical", value: summary.criticalThreats, color: "#dc2626" },
    { name: "High", value: summary.highThreats, color: "#ea580c" },
    { name: "Medium", value: summary.mediumThreats, color: "#ca8a04" },
    { name: "Low", value: summary.lowThreats, color: "#16a34a" },
  ].filter((item) => item.value > 0);

  const blockRate = summary.totalThreats > 0
    ? Math.round((summary.blockedThreats / summary.totalThreats) * 100)
    : 0;

  const tabs = [
    { key: "live-threats", label: "Live Threats", icon: FireIcon, count: threatIntelligence.recentBlocked.length },
    { key: "threat-sources", label: "Threat Sources", icon: GlobeAltIcon, count: threatIntelligence.threatSources.length },
    { key: "patterns", label: "Threat Patterns", icon: BoltIcon, count: threatIntelligence.patterns.length },
  ];

  const timeframeOptions = [
    { value: "1h", label: "Last Hour" },
    { value: "24h", label: "Last 24h" },
    { value: "7d", label: "Last 7d" },
    { value: "30d", label: "Last 30d" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-slate-800 border border-white/10 text-white px-5 py-3 rounded-xl shadow-2xl"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-10"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <ShieldExclamationIcon className="w-12 h-12 text-cyan-400" />
              </motion.div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
                Threat Intelligence Command Center
              </h1>
            </div>
            <p className="text-slate-400 text-lg flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-yellow-500" />
              Real-time threat detection and advanced security analytics
            </p>
            <div className="flex items-center gap-4 mt-3">
              <p className="text-xs text-slate-500 flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Last updated: {new Date(summary.updatedAt).toLocaleString()}
              </p>
              <span className={`flex items-center gap-1.5 text-xs ${autoRefresh ? "text-emerald-400" : "text-slate-500"}`}>
                <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                {autoRefresh ? "Live" : "Paused"}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${blockRate > 80 ? "bg-green-500/15 text-green-400" : "bg-orange-500/15 text-orange-400"}`}>
                {blockRate}% Block Rate
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all text-sm ${
                autoRefresh
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-slate-800/50 border-white/10 text-slate-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400" : "bg-slate-500"}`} />
              Auto-refresh
            </button>

            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
            >
              {timeframeOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-800">
                  {opt.label}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => mutate()}
              className="p-2.5 bg-cyan-500 hover:bg-cyan-600 rounded-xl transition-colors shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <ArrowPathIcon className="w-5 h-5 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: "Total Threats", value: summary.totalThreats, cls: "bg-slate-800/30 border-slate-700" },
            { label: "Blocked", value: summary.blockedThreats, cls: "bg-green-500/10 border-green-500/30", valueCls: "text-green-400" },
            { label: "Critical", value: summary.criticalThreats, cls: "bg-red-500/10 border-red-500/30", valueCls: "text-red-400" },
            { label: "Sources", value: summary.uniqueSources, cls: "bg-orange-500/10 border-orange-500/30", valueCls: "text-orange-400" },
            { label: "Avg Risk", value: Math.round(summary.averageRiskScore), cls: "bg-purple-500/10 border-purple-500/30", valueCls: "text-purple-400" },
          ].map((stat) => (
            <div key={stat.label} className={`border rounded-xl p-4 text-center ${stat.cls}`}>
              <div className={`text-2xl font-bold ${stat.valueCls || "text-white"}`}>{stat.value}</div>
              <div className={`text-xs ${stat.valueCls ? stat.valueCls.replace("text-", "text-").replace("-400", "-300") : "text-slate-400"}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Severity Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-cyan-500/20 transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FireIcon className="w-5 h-5 text-cyan-400" />
            Severity Distribution
          </h3>
          {threatDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={threatDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }: any) =>
                    `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {threatDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-500">
              No threats detected
            </div>
          )}
        </motion.div>

        {/* Top Threat Types Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-cyan-500/20 transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-cyan-400" />
            Top Threat Types
          </h3>
          {threatIntelligence.topThreats.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={threatIntelligence.topThreats.slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="type" stroke="#94a3b8" angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-500">
              No threat data
            </div>
          )}
        </motion.div>

        {/* Attack Vectors Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-cyan-500/20 transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-yellow-400" />
            Attack Vectors
          </h3>
          {threatIntelligence.attackVectors && threatIntelligence.attackVectors.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={threatIntelligence.attackVectors}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="vector" stroke="#94a3b8" />
                <PolarRadiusAxis stroke="#94a3b8" />
                <Radar name="Attacks" dataKey="count" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "12px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-500">
              No attack vectors
            </div>
          )}
        </motion.div>
      </div>

      {/* Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden"
      >
        {/* Tab Headers */}
        <div className="flex border-b border-white/10">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.key
                    ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/[0.02]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
                  activeTab === tab.key
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-slate-700 text-slate-400"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Live Threats Tab */}
          {activeTab === "live-threats" && (
            <div className="space-y-3">
              <AnimatePresence>
                {threatIntelligence.recentBlocked.length > 0 ? (
                  threatIntelligence.recentBlocked.map((threat, index) => {
                    const blocked = isIPBlocked(threat.source_ip);
                    const loading = isIPBlocking(threat.source_ip);

                    return (
                      <motion.div
                        key={threat.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-5 bg-slate-800/40 border-l-4 rounded-r-2xl hover:bg-slate-700/40 transition-all"
                        style={{ borderLeftColor: getSeverityColor(threat.severity) }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <SeverityBadge severity={threat.severity} />
                              <span className="text-white font-bold text-lg">{threat.threat_type}</span>
                              <TagPill color="blue">Risk: {Math.round(threat.risk_score)}</TagPill>
                              {blocked && (
                                <TagPill color="red">BLOCKED</TagPill>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-400">
                              <span className="flex items-center gap-1" title="Source IP">
                                <MapPinIcon className="w-4 h-4" />
                                <code className="text-cyan-400 font-mono">{threat.source_ip}</code>
                              </span>
                              <span>-&gt;</span>
                              <code className="text-purple-400" title="Target">{threat.target_endpoint}</code>
                              <span className="flex items-center gap-1">
                                <ClockIcon className="w-4 h-4" />
                                {new Date(threat.blocked_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleBlock(threat.source_ip, blocked)}
                            disabled={loading}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                              blocked
                                ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                                : "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                            }`}
                          >
                            {loading ? (
                              <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : blocked ? (
                              <ShieldCheckIcon className="w-4 h-4" />
                            ) : (
                              <XCircleIcon className="w-4 h-4" />
                            )}
                            {blocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center py-20">
                    <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <p className="text-2xl text-white font-bold mb-2">All Clear!</p>
                    <p className="text-slate-400">No active threats detected</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Threat Sources Tab */}
          {activeTab === "threat-sources" && (
            <div className="space-y-3">
              {threatIntelligence.threatSources.length > 0 ? (
                threatIntelligence.threatSources.map((source, index) => {
                  const blocked = isIPBlocked(source.source_ip);
                  const loading = isIPBlocking(source.source_ip);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-5 bg-slate-800/40 border border-slate-700 rounded-2xl hover:border-red-500/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <code className="text-xl font-mono text-red-400">{source.source_ip}</code>
                            <span className="bg-red-500/15 text-red-400 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              {source.threat_count} threats
                            </span>
                            {source.country && (
                              <span className="flex items-center gap-1 text-xs text-slate-400">
                                <MapPinIcon className="w-3 h-3" />
                                {source.country}
                              </span>
                            )}
                            {blocked && <TagPill color="red">BLOCKED</TagPill>}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                            <span>Blocked: <strong className="text-green-400">{source.blocked_count}</strong></span>
                            <span>Avg Risk: <strong className="text-orange-400">{Math.round(source.avg_risk_score)}</strong></span>
                            <span>Last: {new Date(source.last_activity).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {source.threat_types.slice(0, 4).map((type, i) => (
                              <TagPill key={i} color="red">{type}</TagPill>
                            ))}
                            {source.threat_types.length > 4 && (
                              <TagPill color="slate">+{source.threat_types.length - 4} more</TagPill>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleBlock(source.source_ip, blocked)}
                          disabled={loading}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                            blocked
                              ? "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                              : "bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                          }`}
                        >
                          {loading ? (
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          ) : blocked ? (
                            <ShieldCheckIcon className="w-5 h-5" />
                          ) : (
                            <XCircleIcon className="w-5 h-5" />
                          )}
                          {blocked ? "Unblock Source" : "Block Source"}
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-20 text-slate-500">
                  No repeat threat sources identified
                </div>
              )}
            </div>
          )}

          {/* Patterns Tab */}
          {activeTab === "patterns" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {threatIntelligence.patterns.length > 0 ? (
                threatIntelligence.patterns.map((pattern, index) => (
                  <motion.div
                    key={pattern.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-5 bg-slate-800/40 border border-slate-700 rounded-2xl hover:border-cyan-500/50 transition-all"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-bold text-lg">{pattern.name}</h4>
                      <span className={`flex items-center gap-1.5 text-xs ${pattern.isActive ? "text-emerald-400" : "text-slate-500"}`}>
                        <span className={`w-2 h-2 rounded-full ${pattern.isActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"}`} />
                        {pattern.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <SeverityBadge severity={pattern.severity} />
                      <TagPill color="blue">{pattern.type}</TagPill>
                    </div>
                    <p className="text-xs text-slate-500 mt-3">
                      Created: {new Date(pattern.createdAt).toLocaleDateString()}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-3 text-center py-20 text-slate-500">
                  No threat patterns detected
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
