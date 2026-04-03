"use client";

import React, { useState } from "react";
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
  ShieldCheckIcon,
  ClockIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";

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
      country: string | null;
    }>;
    threatSources: Array<{
      source_ip: string;
      threat_count: number;
      blocked_count: number;
      last_activity: string;
      threat_types: string[];
      country: string | null;
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

interface ThreatStats {
  stats: {
    severityDistribution: Array<{ name: string; value: number; }>;
    topThreatTypes: Array<{ type: string; count: number; }>;
    activityTimeline: Array<{ timestamp: string; count: number; blocked: number; }>;
  };
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details?: string;
}

const fetcher = (url: string, tenantId: string) =>
  fetch(url, { headers: { "x-tenant-id": tenantId } }).then((res) => res.json());

// Severity tag color mappings for native tags
const severityTagClasses: Record<string, string> = {
  CRITICAL: "bg-red-500/20 text-red-400 border border-red-500/30",
  HIGH: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
  MEDIUM: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  LOW: "bg-green-500/20 text-green-400 border border-green-500/30",
};

function SeverityTag({ severity }: { severity: string }) {
  const cls = severityTagClasses[severity.toUpperCase()] || "bg-slate-500/20 text-slate-400 border border-slate-500/30";
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${cls}`}>
      {severity}
    </span>
  );
}

function ColorTag({ color, children, className = "" }: { color: string; children: React.ReactNode; className?: string }) {
  const colorMap: Record<string, string> = {
    red: "bg-red-500/20 text-red-400 border border-red-500/30",
    orange: "bg-orange-500/20 text-orange-400 border border-orange-500/30",
    gold: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    green: "bg-green-500/20 text-green-400 border border-green-500/30",
    blue: "bg-cyan-500/15 text-cyan-400 border border-cyan-500/30",
    default: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  };
  const cls = colorMap[color] || colorMap.default;
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full inline-flex items-center ${cls} ${className}`}>
      {children}
    </span>
  );
}

// Toast notification component
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${
        type === "success"
          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
          : "bg-red-500/20 border-red-500/30 text-red-300"
      }`}
    >
      {message}
    </motion.div>
  );
}

export function ThreatIntelligencePage({ companyId }: { companyId: string }) {
  const [timeframe, setTimeframe] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [blockingIPs, setBlockingIPs] = useState<Set<string>>(new Set());
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());

  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<any>(null);

  const [activeTab, setActiveTab] = useState("live-threats");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [auditPage, setAuditPage] = useState(0);
  const auditPageSize = 10;

  const { data, error, isLoading, mutate } = useSWR<ThreatIntelligenceData>(
    [`/api/customer/threat-intelligence?timeframe=${timeframe}`, companyId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: autoRefresh ? 30000 : 0 }
  );

  const { data: statsData, mutate: mutateStats } = useSWR<ThreatStats>(
    [`/api/customer/threats/stats?timeframe=${timeframe}`, companyId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: 10000 }
  );

  const { data: auditData, mutate: mutateAudit } = useSWR(
    [`/api/customer/threats/audit?limit=10`, companyId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: 5000 }
  );

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const handleToggleBlock = async (ip: string, currentlyBlocked: boolean) => {
    setBlockingIPs(prev => new Set(prev).add(ip));

    try {
      const action = currentlyBlocked ? "unblock" : "block";
      const response = await fetch("/api/customer/block-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
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
          if (action === "block") {
            newSet.add(ip);
          } else {
            newSet.delete(ip);
          }
          return newSet;
        });

        showToast(
          action === "block"
            ? `${ip} blocked successfully`
            : `${ip} unblocked - traffic allowed`,
          "success"
        );

        mutate();
        mutateAudit();
      } else {
        showToast(result.error || `Failed to ${action} IP`, "error");
      }
    } catch (error) {
      showToast("Network error - please try again", "error");
    } finally {
      setBlockingIPs(prev => {
        const newSet = new Set(prev);
        newSet.delete(ip);
        return newSet;
      });
    }
  };

  const handleExport = (format: 'csv' | 'json') => {
    if (!data?.threatIntelligence) return;

    const threats = data.threatIntelligence.recentBlocked;

    if (format === 'json') {
      const dataStr = JSON.stringify(threats, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `threats-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Threats exported as JSON', 'success');
    } else {
      const headers = ['ID', 'Threat Type', 'Source IP', 'Target', 'Severity', 'Risk Score', 'Timestamp'];
      const csv = [
        headers.join(','),
        ...threats.map(t => [
          t.id,
          t.threat_type,
          t.source_ip,
          t.target_endpoint,
          t.severity,
          t.risk_score,
          t.blocked_at
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `threats-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      showToast('Threats exported as CSV', 'success');
    }
  };

  const isIPBlocked = (ip: string) => blockedIPs.has(ip);
  const isIPBlocking = (ip: string) => blockingIPs.has(ip);

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "red";
      case "HIGH":
        return "orange";
      case "MEDIUM":
        return "gold";
      case "LOW":
        return "green";
      default:
        return "default";
    }
  };

  const getSeverityGradient = (severity: string) => {
    switch (severity.toUpperCase()) {
      case "CRITICAL":
        return "from-red-500/10 to-red-900/5 border-red-500/30";
      case "HIGH":
        return "from-orange-500/10 to-orange-900/5 border-orange-500/30";
      case "MEDIUM":
        return "from-yellow-500/10 to-yellow-900/5 border-yellow-500/30";
      case "LOW":
        return "from-green-500/10 to-green-900/5 border-green-500/30";
      default:
        return "from-slate-500/10 to-slate-900/5 border-slate-500/30";
    }
  };

  const filteredThreats = data?.threatIntelligence.recentBlocked.filter(threat => {
    if (severityFilter !== "all" && threat.severity.toLowerCase() !== severityFilter.toLowerCase()) return false;
    if (statusFilter === "blocked" && !isIPBlocked(threat.source_ip)) return false;
    if (statusFilter === "active" && isIPBlocked(threat.source_ip)) return false;
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="text-center py-16">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Failed to load threat data</h3>
        <p className="text-slate-400 mb-4">Please try again later</p>
        <button
          onClick={() => mutate()}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-white/10 text-white rounded-xl hover:bg-slate-700/50 transition-all"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  const { threatIntelligence } = data;
  const { summary } = threatIntelligence;

  const severityData = statsData?.stats?.severityDistribution || [
    { name: "Critical", value: summary.criticalThreats },
    { name: "High", value: summary.highThreats },
    { name: "Medium", value: summary.mediumThreats },
    { name: "Low", value: summary.lowThreats },
  ].filter((item) => item.value > 0);

  const COLORS = {
    Critical: "#dc2626",
    High: "#ea580c",
    Medium: "#ca8a04",
    Low: "#16a34a"
  };

  const tabs = [
    { key: "live-threats", label: "Live Threats", icon: "🔴" },
    { key: "threat-sources", label: "Threat Sources", icon: "🌐" },
    { key: "patterns", label: "Threat Patterns", icon: "🧬" },
    { key: "audit-log", label: "Audit Log", icon: "📋" },
  ];

  const auditLogs = auditData?.logs || [];
  const pagedAuditLogs = auditLogs.slice(auditPage * auditPageSize, (auditPage + 1) * auditPageSize);
  const totalAuditPages = Math.max(1, Math.ceil(auditLogs.length / auditPageSize));

  return (
    <div className="space-y-6">
      <style jsx global>{`
        @keyframes statusPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.02); }
        }
        .status-changing {
          animation: statusPulse 0.6s ease-in-out;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <ShieldExclamationIcon className="w-8 h-8 text-cyan-400" />
            Threat Intelligence
          </h2>
          <p className="text-slate-400">Real-time threat detection and security monitoring</p>
          <p className="text-xs text-slate-500 mt-1">
            Last updated: {new Date(summary.updatedAt).toLocaleString()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export Buttons */}
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800/50 text-gray-200 border border-white/10 rounded-xl hover:bg-slate-700/50 transition-all text-sm"
            onClick={() => handleExport('csv')}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export CSV
          </button>
          <button
            className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800/50 text-gray-200 border border-white/10 rounded-xl hover:bg-slate-700/50 transition-all text-sm"
            onClick={() => handleExport('json')}
          >
            <DocumentTextIcon className="w-4 h-4" />
            Export JSON
          </button>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>

          {/* Timeframe Select */}
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-slate-800/50 border border-white/10 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24h</option>
            <option value="7d">Last 7d</option>
            <option value="30d">Last 30d</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={() => {
              mutate();
              mutateStats();
              mutateAudit();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl hover:bg-cyan-600 transition-all text-sm font-medium"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </motion.div>

      {/* Filter Bar */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4"
      >
        <div className="flex items-center gap-4">
          <FunnelIcon className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">Filters:</span>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-800/50 border border-white/10 text-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800/50 border border-white/10 text-white rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="all">All Status</option>
            <option value="blocked">Blocked</option>
            <option value="active">Active</option>
          </select>

          <button
            className="px-3 py-1.5 bg-slate-800/50 text-gray-200 border border-white/10 rounded-xl hover:bg-slate-700/50 transition-all text-sm"
            onClick={() => {
              setSeverityFilter("all");
              setStatusFilter("all");
              setDateRange(null);
            }}
          >
            Clear Filters
          </button>

          <div className="ml-auto text-sm text-slate-400">
            Showing {filteredThreats.length} of {data.threatIntelligence.recentBlocked.length} threats
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-gradient-to-br ${getSeverityGradient("critical")} border rounded-2xl p-6 backdrop-blur-xl slide-in`}
        >
          <div className="flex items-center justify-between mb-4">
            <FireIcon className="w-10 h-10 text-red-500" />
            <div className="text-right">
              <p className="text-sm text-red-300 font-semibold">Critical Threats</p>
              <p className="text-4xl font-black text-red-500">{summary.criticalThreats}</p>
            </div>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5">
            <div className="bg-red-500 h-1.5 rounded-full" style={{ width: '100%' }} />
          </div>
          <p className="text-xs text-red-300 mt-2">Requires immediate attention</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-gradient-to-br ${getSeverityGradient("low")} border rounded-2xl p-6 backdrop-blur-xl slide-in`}
        >
          <div className="flex items-center justify-between mb-4">
            <ShieldExclamationIcon className="w-10 h-10 text-green-500" />
            <div className="text-right">
              <p className="text-sm text-green-300 font-semibold">Blocked</p>
              <p className="text-4xl font-black text-green-500">{summary.blockedThreats}</p>
            </div>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5">
            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${Math.round((summary.blockedThreats / summary.totalThreats) * 100)}%` }} />
          </div>
          <p className="text-xs text-green-300 mt-2">Threats blocked automatically</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${getSeverityGradient("high")} border rounded-2xl p-6 backdrop-blur-xl slide-in`}
        >
          <div className="flex items-center justify-between mb-4">
            <GlobeAltIcon className="w-10 h-10 text-orange-500" />
            <div className="text-right">
              <p className="text-sm text-orange-300 font-semibold">Threat Sources</p>
              <p className="text-4xl font-black text-orange-500">{summary.uniqueSources}</p>
            </div>
          </div>
          <p className="text-xs text-orange-300">Unique attacker IPs</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-900/5 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-xl slide-in"
        >
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="w-10 h-10 text-purple-500" />
            <div className="text-right">
              <p className="text-sm text-purple-300 font-semibold">Avg Risk Score</p>
              <p className="text-4xl font-black text-purple-500">
                {Math.round(summary.averageRiskScore)}
              </p>
            </div>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5">
            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${summary.averageRiskScore}%` }} />
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0a0a0f]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <FireIcon className="w-5 h-5 text-cyan-400" />
            Severity Distribution
          </h3>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }: any) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {severityData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0a0a0f]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-cyan-400" />
            Top Threat Types
          </h3>
          {(statsData?.stats?.topThreatTypes || threatIntelligence.topThreats).length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={(statsData?.stats?.topThreatTypes || threatIntelligence.topThreats).slice(0, 5)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="type" stroke="#94a3b8" angle={-15} textAnchor="end" height={80} />
                <YAxis stroke="#94a3b8" />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[8, 8, 0, 0]} animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-slate-500">
              No threat data
            </div>
          )}
        </motion.div>

        {threatIntelligence.attackVectors && threatIntelligence.attackVectors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-[#0a0a0f]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-yellow-400" />
              Attack Vectors
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={threatIntelligence.attackVectors}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="vector" stroke="#94a3b8" />
                <PolarRadiusAxis stroke="#94a3b8" />
                <Radar name="Attacks" dataKey="count" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.5} animationDuration={800} />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-[#0a0a0f]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ChartBarIcon className="w-5 h-5 text-cyan-400" />
          Activity Timeline
        </h3>
        {(statsData?.stats?.activityTimeline || threatIntelligence.trends).length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={statsData?.stats?.activityTimeline || threatIntelligence.trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="timestamp"
                stroke="#94a3b8"
                tickFormatter={(value) =>
                  new Date(value).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                }
              />
              <YAxis stroke="#94a3b8" />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #475569",
                  borderRadius: "8px",
                }}
                labelFormatter={(value) => new Date(value).toLocaleString()}
              />
              <Line type="monotone" dataKey="count" stroke="#06b6d4" strokeWidth={2} dot={{ r: 4 }} animationDuration={1000} />
              <Line type="monotone" dataKey="blocked" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} animationDuration={1000} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-slate-500">
            No trend data
          </div>
        )}
      </motion.div>

      {/* Tabs Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-[#0a0a0f]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        {/* Tab Buttons */}
        <div className="flex items-center gap-1 border-b border-white/10 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === tab.key
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "live-threats" && (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredThreats.length > 0 ? (
                filteredThreats.map((threat, index) => {
                  const isBlocked = isIPBlocked(threat.source_ip);
                  const isLoading = isIPBlocking(threat.source_ip);

                  return (
                    <motion.div
                      key={threat.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`bg-slate-800/90 border border-white/10 rounded-xl p-4 ${
                        isLoading ? 'status-changing' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <SeverityTag severity={threat.severity} />
                            <span className="text-white font-bold">{threat.threat_type}</span>
                            <ColorTag color="blue">Risk: {Math.round(threat.risk_score)}</ColorTag>
                            {isBlocked && (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                BLOCKED
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-slate-400">
                            <span className="flex items-center gap-1">
                              <MapPinIcon className="w-4 h-4" />
                              <code className="text-cyan-400">{threat.source_ip}</code>
                            </span>
                            <span>→</span>
                            <code className="text-purple-400">{threat.target_endpoint}</code>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {new Date(threat.blocked_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={isLoading}
                            onClick={() => handleToggleBlock(threat.source_ip, isBlocked)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                              isBlocked
                                ? "bg-slate-700/50 border border-white/10 text-slate-200 hover:bg-slate-600/50"
                                : "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                            }`}
                          >
                            {isLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                            ) : isBlocked ? (
                              <ShieldCheckIcon className="w-4 h-4" />
                            ) : (
                              <XCircleIcon className="w-4 h-4" />
                            )}
                            {isBlocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-16">
                  <ShieldExclamationIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-xl text-white font-semibold mb-2">
                    {severityFilter !== "all" || statusFilter !== "all" ? "No threats match filters" : "No Active Threats"}
                  </p>
                  <p className="text-slate-400">
                    {severityFilter !== "all" || statusFilter !== "all" ? "Try adjusting your filters" : "Your infrastructure is secure"}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {activeTab === "threat-sources" && (
          <div className="space-y-3">
            {threatIntelligence.threatSources.length > 0 ? (
              threatIntelligence.threatSources.map((source, index) => {
                const isBlocked = isIPBlocked(source.source_ip);
                const isLoading = isIPBlocking(source.source_ip);

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`bg-slate-800/90 border border-white/10 rounded-xl p-4 ${
                      isLoading ? 'status-changing' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-lg font-mono text-red-400">{source.source_ip}</code>
                          <ColorTag color="red">{source.threat_count} threats</ColorTag>
                          {isBlocked && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              BLOCKED
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mb-2">
                          <span>Blocked: {source.blocked_count}</span>
                          <span>•</span>
                          <span>Avg Risk: {Math.round(source.avg_risk_score)}</span>
                          <span>•</span>
                          <span>Last: {new Date(source.last_activity).toLocaleString()}</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {source.threat_types.slice(0, 5).map((type, i) => (
                            <ColorTag key={i} color="default" className="text-xs">
                              {type}
                            </ColorTag>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          disabled={isLoading}
                          onClick={() => handleToggleBlock(source.source_ip, isBlocked)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 ${
                            isBlocked
                              ? "bg-slate-700/50 border border-white/10 text-slate-200 hover:bg-slate-600/50"
                              : "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                          }`}
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                          ) : isBlocked ? (
                            <ShieldCheckIcon className="w-4 h-4" />
                          ) : (
                            <XCircleIcon className="w-4 h-4" />
                          )}
                          {isBlocked ? "Unblock" : "Block Source"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="flex items-center justify-center py-16 text-slate-500">
                No threat sources identified
              </div>
            )}
          </div>
        )}

        {activeTab === "patterns" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threatIntelligence.patterns.length > 0 ? (
              threatIntelligence.patterns.map((pattern, index) => (
                <motion.div
                  key={pattern.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/80 border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-semibold">{pattern.name}</h4>
                    <ColorTag color={pattern.isActive ? "green" : "red"}>
                      {pattern.isActive ? "Active" : "Inactive"}
                    </ColorTag>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <SeverityTag severity={pattern.severity} />
                    <span className="capitalize">{pattern.type}</span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-2 flex items-center justify-center py-16 text-slate-500">
                No threat patterns detected
              </div>
            )}
          </div>
        )}

        {activeTab === "audit-log" && (
          <div className="slide-in">
            {!auditData ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 bg-slate-800/50 first:rounded-tl-lg last:rounded-tr-lg">IP Address</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 bg-slate-800/50">Action</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 bg-slate-800/50">User</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300 bg-slate-800/50 first:rounded-tl-lg last:rounded-tr-lg">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedAuditLogs.length > 0 ? (
                        pagedAuditLogs.map((log: any, idx: number) => (
                          <tr key={log.id || idx} className="border-b border-white/5 hover:bg-slate-800/30 transition-colors">
                            <td className="py-3 px-4">
                              <code className="text-cyan-400 font-mono text-sm">{log.ip_address}</code>
                            </td>
                            <td className="py-3 px-4">
                              <ColorTag color={log.action === 'block' ? 'red' : 'green'}>
                                {log.action?.toUpperCase()}
                              </ColorTag>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-300">{log.user || 'System'}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className="text-slate-400 text-sm">
                                {new Date(log.timestamp).toLocaleString()}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-500">
                            No audit logs available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {auditLogs.length > auditPageSize && (
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <button
                      disabled={auditPage === 0}
                      onClick={() => setAuditPage(p => p - 1)}
                      className="px-3 py-1 text-sm bg-slate-800/50 border border-white/10 text-slate-300 rounded-lg disabled:opacity-30 hover:bg-slate-700/50 transition-all"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-400">
                      {auditPage + 1} / {totalAuditPages}
                    </span>
                    <button
                      disabled={auditPage >= totalAuditPages - 1}
                      onClick={() => setAuditPage(p => p + 1)}
                      className="px-3 py-1 text-sm bg-slate-800/50 border border-white/10 text-slate-300 rounded-lg disabled:opacity-30 hover:bg-slate-700/50 transition-all"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
