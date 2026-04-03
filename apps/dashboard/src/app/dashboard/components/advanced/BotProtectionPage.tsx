"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

import {
  ShieldExclamationIcon,
  BugAntIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  CheckCircleIcon,
  GlobeAltIcon,
  BoltIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  FireIcon,
  CpuChipIcon,
  MapIcon,
  DocumentTextIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
} from "recharts";

import { GlassCard } from "./GlassCard";

// ─── Reusable Primitives ────────────────────────────────────────────────────

function CustomModal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 700,
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
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative z-10 rounded-2xl border border-cyan-400/20 shadow-2xl"
            style={{
              background: "#0b1628",
              maxWidth: width,
              width: "90vw",
              maxHeight: "85vh",
              overflow: "auto",
            }}
          >
            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-400/10">
              <h3 className="text-lg font-semibold text-[#E8F0FF]">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            {/* body */}
            <div className="px-6 py-5">{children}</div>
            {/* footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-cyan-400/10">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SlidePanel({
  open,
  onClose,
  title,
  children,
  width = 720,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
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
            className="fixed top-0 right-0 h-full bg-slate-800/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto"
            style={{ width, maxWidth: "90vw" }}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-[#E8F0FF]">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  labelOn = "ON",
  labelOff = "OFF",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  labelOn?: string;
  labelOff?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 focus:outline-none ${
        checked ? "bg-cyan-500" : "bg-slate-600"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-200 ${
          checked ? "translate-x-8" : "translate-x-1"
        }`}
      />
      <span className={`absolute text-[10px] font-bold ${checked ? "left-1.5 text-white" : "right-1.5 text-slate-300"}`}>
        {checked ? labelOn : labelOff}
      </span>
    </button>
  );
}

function Pill({
  children,
  color = "#94a3b8",
  style,
}: {
  children: React.ReactNode;
  color?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: color + "20",
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <CustomModal
      open={open}
      onClose={onCancel}
      title={title}
      width={420}
      footer={
        <>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-red-500/80 hover:bg-red-500 text-white transition-colors"
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-slate-300">{message}</p>
    </CustomModal>
  );
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

interface BotStatistics {
  totalRequests: number;
  botRequests: number;
  blockedRequests: number;
  highConfidenceDetections: number;
  uniqueIps: number;
  botDetectionRate: number;
  blockRate: number;
  averageConfidenceScore: number;
}

interface BotDetection {
  id: number;
  sourceIp: string;
  userAgent: string;
  requestPath: string;
  confidenceScore: number;
  detectionReason: string;
  isBlocked: boolean;
  detectedAt: string;
}

interface BotSource {
  sourceIp: string;
  detectionCount: number;
  averageConfidence: number;
  lastDetected: string;
  blockedCount: number;
}

interface AsnIntelligence {
  topDatacenterAsns: any[];
  asnStats: any[];
}

interface HeadlessDetection {
  statistics: any;
  trends: any[];
}

interface VelocityAnalysis {
  anomalies: any[];
  topRequesters: any[];
}

interface CrawlerVerification {
  statistics: any;
  fakeCrawlers: any[];
}

interface ScoreDistribution {
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  safe_count: number;
  avg_score: number;
  max_score: number;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function BotProtectionPage({ companyId }: { companyId: string }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState<BotStatistics | null>(null);
  const [recentDetections, setRecentDetections] = useState<BotDetection[]>([]);
  const [topBotSources, setTopBotSources] = useState<BotSource[]>([]);
  const [hourlyTrends, setHourlyTrends] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [asnIntelligence, setAsnIntelligence] = useState<AsnIntelligence | null>(null);
  const [headlessDetection, setHeadlessDetection] = useState<HeadlessDetection | null>(null);
  const [velocityAnalysis, setVelocityAnalysis] = useState<VelocityAnalysis | null>(null);
  const [crawlerVerification, setCrawlerVerification] = useState<CrawlerVerification | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution | null>(null);

  const fetchBotData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customer/bot-detection", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.botDetection.statistics);
        setRecentDetections(data.botDetection.recentDetections || []);
        setTopBotSources(data.botDetection.topBotSources || []);
        setHourlyTrends(data.botDetection.hourlyTrends || []);
        setAsnIntelligence(data.botDetection.asnIntelligence || null);
        setHeadlessDetection(data.botDetection.headlessDetection || null);
        setVelocityAnalysis(data.botDetection.velocityAnalysis || null);
        setCrawlerVerification(data.botDetection.crawlerVerification || null);
        setScoreDistribution(data.botDetection.scoreDistribution || null);
      }
    } catch (error) {
      console.error("Failed to fetch bot data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockIp = async (ip: string) => {
    try {
      const response = await fetch("/api/customer/block-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          action: "block",
          sourceIp: ip,
          reason: "Manual block from Bot Protection",
        }),
      });

      if (response.ok) {
        setBlockedIps((prev) => new Set(prev).add(ip));
        fetchBotData();
      }
    } catch (error) {
      console.error("Failed to block IP:", error);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    try {
      const response = await fetch("/api/customer/block-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          action: "unblock",
          sourceIp: ip,
          reason: "Manual unblock from Bot Protection",
        }),
      });

      if (response.ok) {
        setBlockedIps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(ip);
          return newSet;
        });
        fetchBotData();
      }
    } catch (error) {
      console.error("Failed to unblock IP:", error);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchBotData();
      const interval = setInterval(fetchBotData, 30000);
      return () => clearInterval(interval);
    }
  }, [companyId]);

  const avgScore = scoreDistribution?.avg_score || 0;
  const botDetectionRate = stats?.botDetectionRate || 0;

  const tabs = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: <ShieldCheckIcon className="w-4 h-4" />,
    },
    {
      key: "live-threats",
      label: "Live Threats",
      icon: <FireIcon className="w-4 h-4" />,
    },
    {
      key: "rules",
      label: "Rules & Actions",
      icon: <BoltIcon className="w-4 h-4" />,
    },
    {
      key: "analytics",
      label: "Analytics",
      icon: <ChartBarIcon className="w-4 h-4" />,
    },
    {
      key: "reports",
      label: "Reports",
      icon: <DocumentTextIcon className="w-4 h-4" />,
    },
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0a0a0f" }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: "radial-gradient(120% 120% at 60% 30%, #0B1228 0%, #10172C 60%, #0A0F1E 100%)",
        margin: "-2rem",
        padding: "2rem",
      }}
    >
      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none z-0"
        style={{
          height: "40%",
          background: "linear-gradient(180deg, rgba(22,119,255,0.04) 0%, transparent 100%)",
        }}
      />

      <div className="relative z-10">
        {/* HEADER */}
        <div className="relative w-full px-6 py-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <motion.div
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(0, 255, 255, 0.4)",
                    "0 0 40px rgba(0, 255, 255, 0.6)",
                    "0 0 20px rgba(0, 255, 255, 0.4)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-4 rounded-2xl bg-cyan-400/10 backdrop-blur-sm"
              >
                <ShieldExclamationIcon className="w-10 h-10 text-cyan-400" />
              </motion.div>

              <div>
                <h1 className="text-4xl font-semibold text-[#E8F0FF] mb-1">
                  Bot Protection Command Center
                </h1>
                <p className="text-slate-300/85">
                  Real-time threat detection & response intelligence
                </p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchBotData}
              className="p-4 rounded-2xl bg-[#0b1628]/80 border border-cyan-400/10 shadow-[inset_0_0_20px_rgba(0,255,255,0.08),0_0_20px_rgba(0,255,255,0.12)] backdrop-blur-md transition-all duration-200 hover:shadow-[inset_0_0_25px_rgba(0,255,255,0.15),0_0_25px_rgba(0,255,255,0.20)]"
            >
              <ArrowPathIcon className="w-6 h-6 text-cyan-400" />
            </motion.button>
          </div>
        </div>

        {/* TABS */}
        <div className="px-6">
          <div className="flex gap-1 p-1 rounded-t-2xl border border-white/[0.04] bg-[rgba(20,25,40,0.65)] backdrop-blur-[20px]">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "text-cyan-400 bg-cyan-400/10 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8">
            {activeTab === "dashboard" && (
              <DashboardTab
                stats={stats}
                scoreDistribution={scoreDistribution}
                hourlyTrends={hourlyTrends}
                loading={loading}
                avgScore={avgScore}
                botDetectionRate={botDetectionRate}
              />
            )}
            {activeTab === "live-threats" && (
              <LiveThreatsTab
                recentDetections={recentDetections}
                topBotSources={topBotSources}
                blockedIps={blockedIps}
                onBlock={handleBlockIp}
                onUnblock={handleUnblockIp}
                loading={loading}
              />
            )}
            {activeTab === "rules" && <RulesTab companyId={companyId} />}
            {activeTab === "analytics" && (
              <AnalyticsTab
                asnIntelligence={asnIntelligence}
                headlessDetection={headlessDetection}
                velocityAnalysis={velocityAnalysis}
                crawlerVerification={crawlerVerification}
                hourlyTrends={hourlyTrends}
                loading={loading}
              />
            )}
            {activeTab === "reports" && <ReportsTab companyId={companyId} stats={stats} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── TAB 1: DASHBOARD ───────────────────────────────────────────────────────

function DashboardTab({ stats, scoreDistribution, hourlyTrends, loading, avgScore, botDetectionRate }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KPICard
          title="Bot Requests"
          value={stats?.botRequests || 0}
          icon={<BugAntIcon className="w-8 h-8" />}
          accentColor="#ffb35b"
        />
        <KPICard
          title="Blocked Threats"
          value={stats?.blockedRequests || 0}
          icon={<ShieldExclamationIcon className="w-8 h-8" />}
          accentColor="#ff5b67"
        />
        <KPICard
          title="Unique IPs"
          value={stats?.uniqueIps || 0}
          icon={<GlobeAltIcon className="w-8 h-8" />}
          accentColor="#3ee8c4"
        />
        <KPICard
          title="Detection Rate"
          value={`${botDetectionRate}%`}
          icon={<ChartBarIcon className="w-8 h-8" />}
          accentColor="#00d0ff"
        />
      </div>

      {/* UNIFIED SCORE + DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UnifiedScoreCard score={avgScore} />
        <div className="lg:col-span-2">
          <ScoreDistributionCard distribution={scoreDistribution} />
        </div>
      </div>

      {/* 24H TIMELINE */}
      <ActivityTimelineCard trends={hourlyTrends} />
    </div>
  );
}

// ─── TAB 2: LIVE THREATS ────────────────────────────────────────────────────

function LiveThreatsTab({ recentDetections, topBotSources, blockedIps, onBlock, onUnblock, loading }: any) {
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const handleRowClick = (record: any) => {
    setSelectedThreat(record);
    setDrawerVisible(true);
  };

  const handleBulkBlock = () => {
    if (selectedRows.length === 0) return;
    selectedRows.forEach((row) => {
      if (!blockedIps.has(row.sourceIp)) {
        onBlock(row.sourceIp);
      }
    });
    setSelectedRows([]);
  };

  const handleBulkUnblock = () => {
    if (selectedRows.length === 0) return;
    selectedRows.forEach((row) => {
      if (blockedIps.has(row.sourceIp)) {
        onUnblock(row.sourceIp);
      }
    });
    setSelectedRows([]);
  };

  const getSeverityColor = (score: number) => {
    if (score >= 80) return "#ff5b67";
    if (score >= 60) return "#ffb35b";
    if (score >= 40) return "#ffdd6b";
    return "#2F81F7";
  };

  const toggleRowSelection = (record: any) => {
    setSelectedRows((prev) => {
      const exists = prev.find((r) => r.id === record.id);
      if (exists) return prev.filter((r) => r.id !== record.id);
      return [...prev, record];
    });
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows([...paginatedData]);
    }
  };

  // Sorting
  const sortedData = [...recentDetections].sort((a: any, b: any) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (sortDir === "asc") return aVal > bVal ? 1 : -1;
    return aVal < bVal ? 1 : -1;
  });

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  return (
    <div className="space-y-6">
      {/* LIVE FEED TABLE */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h3 className="text-2xl font-semibold text-[#E8F0FF] flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50" />
              </motion.div>
              Live Threat Feed
            </h3>
            <Pill color="#ff5b67">{recentDetections.length} threats</Pill>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoRefresh
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30"
                  : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
              }`}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </button>
          </div>
        </div>

        {/* BULK ACTIONS */}
        {selectedRows.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 rounded-lg"
            style={{
              background: "rgba(6, 182, 212, 0.1)",
              border: "1px solid rgba(6, 182, 212, 0.3)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-cyan-400 font-semibold">
                {selectedRows.length} threat(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkBlock}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30 transition-colors"
                >
                  Block Selected
                </button>
                <button
                  onClick={handleBulkUnblock}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Unblock Selected
                </button>
                <button
                  onClick={() => setSelectedRows([])}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* TABLE */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-600 bg-slate-800 text-cyan-400 focus:ring-cyan-400/30"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Source IP</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Threat Type</th>
                  <th
                    className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-cyan-400 transition-colors"
                    onClick={() => handleSort("confidenceScore")}
                  >
                    Confidence {sortField === "confidenceScore" ? (sortDir === "asc" ? "^" : "v") : ""}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((record: any) => {
                  const isBlocked = blockedIps.has(record.sourceIp);
                  const isSelected = selectedRows.some((r) => r.id === record.id);
                  return (
                    <tr
                      key={record.id}
                      onClick={() => handleRowClick(record)}
                      className={`border-b border-white/5 cursor-pointer transition-colors hover:bg-cyan-400/5 ${
                        isSelected ? "bg-cyan-400/10" : ""
                      }`}
                    >
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleRowSelection(record)}
                          className="rounded border-slate-600 bg-slate-800 text-cyan-400 focus:ring-cyan-400/30"
                        />
                      </td>
                      <td className="px-3 py-3 text-slate-300 text-sm">
                        {new Date(record.detectedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-3 py-3 font-mono text-cyan-400 font-semibold text-sm">
                        {record.sourceIp}
                      </td>
                      <td className="px-3 py-3 text-slate-200 text-sm">{record.detectionReason}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getSeverityColor(record.confidenceScore) }}
                          />
                          <Pill
                            color={getSeverityColor(record.confidenceScore)}
                            style={{ fontWeight: 600 }}
                          >
                            {record.confidenceScore}%
                          </Pill>
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Pill color={isBlocked ? "#ff5b67" : "#ffb35b"}>
                          {isBlocked ? "BLOCKED" : "DETECTED"}
                        </Pill>
                      </td>
                      <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {!isBlocked ? (
                            <button
                              onClick={() => onBlock(record.sourceIp)}
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30 transition-colors"
                            >
                              Block
                            </button>
                          ) : (
                            <button
                              onClick={() => onUnblock(record.sourceIp)}
                              className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                              Unblock
                            </button>
                          )}
                          <button
                            onClick={() => handleRowClick(record)}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-500/30 transition-colors"
                          >
                            Investigate
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-16 text-center text-slate-400">
                      No threats detected
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <span className="text-xs text-slate-400">
                Total {sortedData.length} threats
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-slate-800/80 border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-400/40"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-xs text-slate-400">
                  {page} / {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </GlassCard>

      {/* TOP ATTACKERS */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-[#E8F0FF] mb-6 flex items-center gap-2">
          <FireIcon className="w-6 h-6 text-red-400" />
          Top Attack Sources (Last 24h)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topBotSources.slice(0, 6).map((source: any, idx: number) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="p-4 rounded-xl transition-all cursor-pointer"
              style={{
                background: "rgba(255, 91, 103, 0.1)",
                border: "1px solid rgba(255, 91, 103, 0.2)",
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="font-mono text-lg text-cyan-400 font-semibold">
                    {source.sourceIp}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Last: {new Date(source.lastDetected).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-400">
                    {source.detectionCount}
                  </div>
                  <p className="text-xs text-slate-400">attacks</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                <div>
                  <span className="text-sm text-slate-300">Blocked</span>
                  <p className="text-lg font-semibold text-green-400">
                    {source.blockedCount}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-slate-300">Confidence</span>
                  <p className="text-lg font-semibold text-orange-400">
                    {Math.round(source.averageConfidence)}%
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* INVESTIGATE DRAWER */}
      <SlidePanel
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        title="Threat Investigation"
      >
        {selectedThreat && (
          <div className="space-y-6">
            <div
              className="p-4 rounded-xl"
              style={{
                background: `${getSeverityColor(selectedThreat.confidenceScore)}15`,
                border: `1px solid ${getSeverityColor(selectedThreat.confidenceScore)}30`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-400">THREAT LEVEL</span>
                <Pill
                  color={getSeverityColor(selectedThreat.confidenceScore)}
                  style={{ fontSize: 14, padding: "4px 12px", fontWeight: 600 }}
                >
                  {selectedThreat.confidenceScore >= 80
                    ? "CRITICAL"
                    : selectedThreat.confidenceScore >= 60
                    ? "HIGH"
                    : "MEDIUM"}
                </Pill>
              </div>
              <div className="text-4xl font-bold">
                <span style={{ color: getSeverityColor(selectedThreat.confidenceScore) }}>
                  {selectedThreat.confidenceScore}%
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase">Source Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
                  <span className="text-slate-400">IP Address</span>
                  <span className="font-mono text-cyan-400 font-semibold">{selectedThreat.sourceIp}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
                  <span className="text-slate-400">Detection Time</span>
                  <span className="text-white">{new Date(selectedThreat.detectedAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between p-3 bg-slate-800/30 rounded-lg">
                  <span className="text-slate-400">Status</span>
                  <Pill color={blockedIps.has(selectedThreat.sourceIp) ? "#ff5b67" : "#ffb35b"}>
                    {blockedIps.has(selectedThreat.sourceIp) ? "BLOCKED" : "DETECTED"}
                  </Pill>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-400 mb-3 uppercase">Threat Details</h4>
              <div className="space-y-3">
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <span className="text-sm text-slate-400 block mb-1">Detection Reason</span>
                  <span className="text-white font-semibold">{selectedThreat.detectionReason}</span>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <span className="text-sm text-slate-400 block mb-1">User Agent</span>
                  <span className="text-sm text-slate-300 break-all">{selectedThreat.userAgent}</span>
                </div>
                <div className="p-3 bg-slate-800/30 rounded-lg">
                  <span className="text-sm text-slate-400 block mb-1">Request Path</span>
                  <span className="text-sm text-slate-300 font-mono">{selectedThreat.requestPath}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-700/50">
              {!blockedIps.has(selectedThreat.sourceIp) ? (
                <button
                  onClick={() => onBlock(selectedThreat.sourceIp)}
                  className="w-full px-6 py-3 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30 transition-colors"
                >
                  Block This IP
                </button>
              ) : (
                <button
                  onClick={() => onUnblock(selectedThreat.sourceIp)}
                  className="w-full px-6 py-3 rounded-xl text-sm font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  Unblock This IP
                </button>
              )}
            </div>
          </div>
        )}
      </SlidePanel>
    </div>
  );
}

// ─── TAB 3: RULES ───────────────────────────────────────────────────────────

function RulesTab({ companyId }: { companyId: string }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [templatesVisible, setTemplatesVisible] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  // Form state (replaces antd Form)
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formAction, setFormAction] = useState("BLOCK");
  const [formPriority, setFormPriority] = useState(50);

  const resetForm = () => {
    setFormName("");
    setFormDescription("");
    setFormAction("BLOCK");
    setFormPriority(50);
  };

  const populateForm = (values: any) => {
    setFormName(values.name || "");
    setFormDescription(values.description || "");
    setFormAction(values.action || "BLOCK");
    setFormPriority(values.priority ?? 50);
  };

  const RULE_TEMPLATES = [
    {
      name: "Block All Datacenter IPs",
      description: "Block traffic from AWS, GCP, Azure, and other cloud providers",
      action: "BLOCK",
      conditions: { asnType: "datacenter" },
      priority: 100,
    },
    {
      name: "Challenge High Velocity Requests",
      description: "Show CAPTCHA for IPs making >100 requests/minute",
      action: "CHALLENGE",
      conditions: { velocityScore: { min: 80 } },
      priority: 90,
    },
    {
      name: "Block Headless Browsers",
      description: "Block detected headless browsers (Puppeteer, Playwright, Selenium)",
      action: "BLOCK",
      conditions: { headlessDetected: true },
      priority: 95,
    },
    {
      name: "Allow Verified Crawlers",
      description: "Always allow verified Googlebot, Bingbot, etc.",
      action: "ALLOW",
      conditions: { crawlerVerified: true },
      priority: 110,
    },
    {
      name: "Monitor Suspicious Patterns",
      description: "Log and monitor medium-risk traffic without blocking",
      action: "MONITOR",
      conditions: { finalScore: { min: 50, max: 70 } },
      priority: 50,
    },
  ];

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customer/bot-rules", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();
      if (data.success) {
        setRules(data.rules || []);
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [companyId]);

  const handleCreateRule = async () => {
    const values = {
      name: formName,
      description: formDescription,
      action: formAction,
      priority: formPriority,
    };
    if (!values.name) return;

    try {
      const response = await fetch("/api/customer/bot-rules", {
        method: editingRule ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify(editingRule ? { ...values, id: editingRule.id } : values),
      });

      if (response.ok) {
        setModalVisible(false);
        setEditingRule(null);
        resetForm();
        fetchRules();
      }
    } catch (error) {
      console.error("Failed to create/update rule:", error);
    }
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    try {
      const rule = rules.find((r) => r.id === ruleId);
      if (!rule) return;

      await fetch("/api/customer/bot-rules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          action: "block",
          ...rule,
          id: ruleId,
          enabled,
        }),
      });
      fetchRules();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    setDeleteConfirm(ruleId);
  };

  const confirmDelete = async () => {
    if (deleteConfirm === null) return;
    try {
      await fetch(`/api/customer/bot-rules?id=${deleteConfirm}`, {
        method: "POST",
        headers: { "x-tenant-id": companyId },
      });
      fetchRules();
    } catch (error) {
      console.error("Failed to delete rule:", error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleTestRule = async (rule: any) => {
    setTestModalVisible(true);
    const mockResults = {
      wouldBlock: Math.floor(Math.random() * 1000),
      wouldChallenge: Math.floor(Math.random() * 500),
      totalRequests: 5000,
      matchRate: Math.floor(Math.random() * 30),
    };
    setTestResults(mockResults);
  };

  const handleCreateFromTemplate = (template: any) => {
    populateForm({
      name: template.name,
      description: template.description,
      action: template.action,
      priority: template.priority,
    });
    setTemplatesVisible(false);
    setModalVisible(true);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "BLOCK":
        return "#ff5b67";
      case "CHALLENGE":
        return "#ffb35b";
      case "MONITOR":
        return "#2F81F7";
      case "ALLOW":
        return "#22c55e";
      default:
        return "#94a3b8";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold text-[#E8F0FF] mb-2">Bot Detection Rules</h3>
          <p className="text-sm text-slate-400">Configure automated rules to detect and block bot traffic</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTemplatesVisible(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
          >
            Rule Templates
          </button>
          <button
            onClick={() => {
              setEditingRule(null);
              resetForm();
              setModalVisible(true);
            }}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-500/30 transition-colors"
          >
            Create Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Total Rules</div>
          <div className="text-3xl font-bold text-white">{rules.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Active Rules</div>
          <div className="text-3xl font-bold text-green-400">
            {rules.filter((r) => r.enabled).length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Blocking Rules</div>
          <div className="text-3xl font-bold text-red-400">
            {rules.filter((r) => r.action === "BLOCK" && r.enabled).length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Challenge Rules</div>
          <div className="text-3xl font-bold text-orange-400">
            {rules.filter((r) => r.action === "CHALLENGE" && r.enabled).length}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Priority</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Rule Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule: any) => (
                  <tr
                    key={rule.id}
                    className="border-b border-white/5 hover:bg-cyan-400/5 transition-colors"
                  >
                    <td className="px-3 py-3">
                      <Pill color="#06b6d4" style={{ fontWeight: 600, fontSize: 14 }}>
                        {rule.priority}
                      </Pill>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-white mb-1">{rule.name}</div>
                      {rule.description && (
                        <div className="text-xs text-slate-400">{rule.description}</div>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <Pill color={getActionColor(rule.action)} style={{ fontWeight: 600 }}>
                        {rule.action}
                      </Pill>
                    </td>
                    <td className="px-3 py-3">
                      <ToggleSwitch
                        checked={rule.enabled}
                        onChange={(checked) => handleToggleRule(rule.id, checked)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestRule(rule)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            populateForm(rule);
                            setModalVisible(true);
                          }}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-16 text-center text-slate-400">
                      No rules configured
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Create/Edit Rule Modal */}
      <CustomModal
        open={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingRule(null);
          resetForm();
        }}
        title={editingRule ? "Edit Rule" : "Create Bot Detection Rule"}
        footer={
          <>
            <button
              onClick={() => {
                setModalVisible(false);
                setEditingRule(null);
                resetForm();
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateRule}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-500/30 transition-colors"
            >
              {editingRule ? "Update" : "Create"}
            </button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateRule();
          }}
          className="space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-[#E8F0FF] mb-1.5">
              Rule Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., Block Datacenter IPs"
              required
              className="w-full px-3 py-2.5 rounded-lg bg-[rgba(11,22,40,0.8)] border border-cyan-400/20 text-[#E8F0FF] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#E8F0FF] mb-1.5">Description</label>
            <textarea
              rows={2}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Describe what this rule does..."
              className="w-full px-3 py-2.5 rounded-lg bg-[rgba(11,22,40,0.8)] border border-cyan-400/20 text-[#E8F0FF] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#E8F0FF] mb-1.5">
              Action <span className="text-red-400">*</span>
            </label>
            <select
              value={formAction}
              onChange={(e) => setFormAction(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[rgba(11,22,40,0.8)] border border-cyan-400/20 text-[#E8F0FF] text-sm focus:outline-none focus:border-cyan-400/50 transition-colors appearance-none cursor-pointer"
            >
              <option value="BLOCK">Block</option>
              <option value="CHALLENGE">Challenge</option>
              <option value="MONITOR">Monitor</option>
              <option value="ALLOW">Allow</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#E8F0FF] mb-1.5">Priority</label>
            <input
              type="number"
              value={formPriority}
              onChange={(e) => setFormPriority(Number(e.target.value))}
              placeholder="0-100"
              className="w-full px-3 py-2.5 rounded-lg bg-[rgba(11,22,40,0.8)] border border-cyan-400/20 text-[#E8F0FF] placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400/50 transition-colors"
            />
          </div>
        </form>
      </CustomModal>

      {/* Rule Templates Modal */}
      <CustomModal
        open={templatesVisible}
        onClose={() => setTemplatesVisible(false)}
        title="Rule Templates"
      >
        <div className="space-y-3">
          {RULE_TEMPLATES.map((template, idx) => (
            <div
              key={idx}
              className="p-4 border border-slate-700 rounded-lg cursor-pointer hover:border-cyan-400 transition-colors"
              onClick={() => handleCreateFromTemplate(template)}
            >
              <h4 className="font-semibold text-lg mb-1 text-white">{template.name}</h4>
              <p className="text-sm text-slate-400 mb-2">{template.description}</p>
              <div className="flex items-center gap-2">
                <Pill color={getActionColor(template.action)}>{template.action}</Pill>
                <Pill color="#94a3b8">Priority: {template.priority}</Pill>
              </div>
            </div>
          ))}
        </div>
      </CustomModal>

      {/* Test Results Modal */}
      <CustomModal
        open={testModalVisible}
        onClose={() => setTestModalVisible(false)}
        title="Rule Test Results"
        footer={
          <button
            onClick={() => setTestModalVisible(false)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-white/10 border border-white/10 transition-colors"
          >
            Close
          </button>
        }
      >
        {testResults && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Would Block</div>
              <div className="text-3xl font-bold text-red-400">{testResults.wouldBlock}</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Would Challenge</div>
              <div className="text-3xl font-bold text-orange-400">{testResults.wouldChallenge}</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Total Requests</div>
              <div className="text-3xl font-bold text-white">{testResults.totalRequests}</div>
            </div>
            <div className="p-4 bg-slate-800/30 rounded-lg">
              <div className="text-sm text-slate-400 mb-1">Match Rate</div>
              <div className="text-3xl font-bold text-cyan-400">{testResults.matchRate}%</div>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        title="Delete Rule"
        message="Are you sure you want to delete this rule?"
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}

// ─── TAB 4: ANALYTICS ───────────────────────────────────────────────────────

function AnalyticsTab({ asnIntelligence, headlessDetection, velocityAnalysis, crawlerVerification, hourlyTrends, loading }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* TOP ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AsnIntelligenceCard data={asnIntelligence} />
        <HeadlessBrowserCard data={headlessDetection} />
        <CrawlerVerificationCard data={crawlerVerification} />
      </div>

      {/* VELOCITY ANALYSIS */}
      <VelocityAnalysisCard data={velocityAnalysis} trends={hourlyTrends} />
    </div>
  );
}

// ─── TAB 5: REPORTS ─────────────────────────────────────────────────────────

function ReportsTab({ companyId, stats }: any) {
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const csvData = [
        ["Metric", "Value"],
        ["Total Requests", stats?.totalRequests || 0],
        ["Bot Requests", stats?.botRequests || 0],
        ["Blocked Requests", stats?.blockedRequests || 0],
        ["Detection Rate", `${stats?.botDetectionRate || 0}%`],
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bot-Protection-Report-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const csvData = [
        ["Metric", "Value"],
        ["Total Requests", stats?.totalRequests || 0],
        ["Bot Requests", stats?.botRequests || 0],
        ["Blocked Requests", stats?.blockedRequests || 0],
        ["Detection Rate", `${stats?.botDetectionRate || 0}%`],
        ["Unique IPs", stats?.uniqueIps || 0],
      ];

      const csvContent = csvData.map((row) => row.join(",")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Bot-Protection-Data-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("CSV export error:", error);
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-[#E8F0FF] mb-2">Reports & Export</h3>
        <p className="text-sm text-slate-400">Generate reports and export data for compliance</p>
      </div>

      {/* EXPORT ACTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="text-center">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-red-400" />
            <h4 className="text-lg font-semibold text-white mb-2">Export PDF Report</h4>
            <p className="text-sm text-slate-400 mb-4">
              Comprehensive security report with analysis
            </p>
            <button
              disabled={exportLoading}
              onClick={handleExportPDF}
              className="w-full px-6 py-3 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 border border-red-400/30 hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exportLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
              )}
              Generate PDF
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-center">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h4 className="text-lg font-semibold text-white mb-2">Export CSV Data</h4>
            <p className="text-sm text-slate-400 mb-4">Raw data for analysis in Excel</p>
            <button
              disabled={exportLoading}
              onClick={handleExportCSV}
              className="w-full px-6 py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {exportLoading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-400" />
              )}
              Generate CSV
            </button>
          </div>
        </GlassCard>
      </div>

      {/* SUMMARY STATISTICS */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-[#E8F0FF] mb-6">Report Summary (Last 24 Hours)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-slate-400 mb-2">Total Requests</p>
            <p className="text-4xl font-bold text-white">{stats?.totalRequests?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Bot Requests</p>
            <p className="text-4xl font-bold text-orange-400">{stats?.botRequests?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Blocked Threats</p>
            <p className="text-4xl font-bold text-red-400">{stats?.blockedRequests?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-2">Detection Rate</p>
            <p className="text-4xl font-bold text-green-400">{stats?.botDetectionRate || 0}%</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function KPICard({ title, value, icon, accentColor }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="transition-all duration-200"
    >
      <GlassCard className="p-6 h-full">
        <div className="flex items-start justify-between mb-4">
          <div
            className="p-3 rounded-2xl"
            style={{
              background: `${accentColor}20`,
              boxShadow: `0 0 20px ${accentColor}40`,
            }}
          >
            <div style={{ color: accentColor }}>{icon}</div>
          </div>
        </div>
        <h3 className="text-4xl font-semibold text-[#E8F0FF] mb-2">{value}</h3>
        <p className="text-sm text-slate-300/85">{title}</p>
      </GlassCard>
    </motion.div>
  );
}

function UnifiedScoreCard({ score }: any) {
  const gaugeColor =
    score >= 80
      ? "#ff5b67"
      : score >= 60
      ? "#ffb35b"
      : score >= 40
      ? "#ffdd6b"
      : "#00e7b7";

  const data = [{ name: "Score", value: score, fill: gaugeColor }];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <GlassCard className="p-6 relative overflow-hidden h-full">
        <div className="absolute inset-0 flex items-center justify-center opacity-5">
          <ShieldCheckIcon className="w-64 h-64" />
        </div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <ShieldCheckIcon
            className="w-6 h-6"
            style={{ color: "#00e7b7", filter: "drop-shadow(0 0 8px #00e7b780)" }}
          />
          <h3 className="text-lg font-semibold text-[#E8F0FF]">Unified Bot Score</h3>
        </div>

        <div className="relative z-10 flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="95%"
              data={data}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar background dataKey="value" cornerRadius={15} fill={gaugeColor} />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl font-semibold mb-2"
                style={{
                  color: gaugeColor,
                  filter: `drop-shadow(0 0 20px ${gaugeColor}80)`,
                }}
              >
                {Math.round(score)}
              </motion.div>

              <div className="text-sm font-semibold text-slate-300/85">
                {score >= 80
                  ? "CRITICAL"
                  : score >= 60
                  ? "HIGH RISK"
                  : score >= 40
                  ? "MEDIUM"
                  : "SECURE"}
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ScoreDistributionCard({ distribution }: any) {
  if (!distribution) return null;

  const heatmapData = [
    { level: "Critical", count: distribution.critical_count, range: "80-100", color: "#ff5b67" },
    { level: "High", count: distribution.high_count, range: "60-79", color: "#ffb35b" },
    { level: "Medium", count: distribution.medium_count, range: "40-59", color: "#ffdd6b" },
    { level: "Low", count: distribution.low_count, range: "20-39", color: "#2F81F7" },
    { level: "Safe", count: distribution.safe_count, range: "0-19", color: "#00e7b7" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-6 h-full">
        <div className="flex items-center gap-3 mb-6">
          <ChartBarIcon
            className="w-6 h-6"
            style={{ color: "#00cfff", filter: "drop-shadow(0 0 8px #00cfff80)" }}
          />
          <h3 className="text-lg font-semibold text-[#E8F0FF]">Threat Score Distribution</h3>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {heatmapData.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="p-4 rounded-xl text-center cursor-pointer"
              style={{
                background: `${item.color}${item.count > 0 ? "25" : "10"}`,
                border: `1px solid ${item.color}${item.count > 0 ? "50" : "20"}`,
                boxShadow: item.count > 0 ? `0 0 25px ${item.color}40` : "none",
              }}
            >
              <div className="text-3xl font-semibold mb-2" style={{ color: item.color }}>
                {item.count}
              </div>
              <div className="text-sm font-semibold mb-1 text-[#E8F0FF]">{item.level}</div>
              <div className="text-xs text-slate-300/85">{item.range}</div>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function ActivityTimelineCard({ trends }: any) {
  const chartData = trends.map((t: any) => ({
    time: new Date(t.hour).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    requests: t.totalRequests || 0,
    bots: t.botRequests || 0,
    blocked: t.blockedRequests || 0,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-6 h-full">
        <div className="flex items-center gap-3 mb-6">
          <ChartBarIcon
            className="w-6 h-6"
            style={{ color: "#00cfff", filter: "drop-shadow(0 0 8px #00cfff80)" }}
          />
          <h3 className="text-lg font-semibold text-[#E8F0FF]">24-Hour Activity Timeline</h3>
        </div>

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="botsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5b67" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ff5b67" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="requestsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00cfff" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#00cfff" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,255,0.1)" />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />

              <RechartsTooltip
                contentStyle={{
                  background: "#0b1628",
                  border: "1px solid rgba(0,255,255,0.2)",
                  borderRadius: "12px",
                }}
              />

              <Legend />

              <Area
                type="monotone"
                dataKey="requests"
                stroke="#00cfff"
                fill="url(#requestsGradient)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="bots"
                stroke="#ff5b67"
                fill="url(#botsGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-16 text-slate-300/85">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No activity data available</p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function AsnIntelligenceCard({ data }: any) {
  const topAsn = data?.topDatacenterAsns?.[0];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <GlassCard className="p-6 relative overflow-hidden h-full">
        <div className="absolute right-0 bottom-0 opacity-5">
          <GlobeAltIcon className="w-48 h-48" />
        </div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <GlobeAltIcon
            className="w-6 h-6"
            style={{ color: "#00e1b0", filter: "drop-shadow(0 0 8px #00e1b080)" }}
          />
          <h3 className="text-lg font-semibold text-[#E8F0FF]">ASN Intelligence</h3>
        </div>

        {topAsn ? (
          <div className="space-y-4 relative z-10">
            <div>
              <p className="text-xs mb-2 text-slate-300/85">Top Threat Source</p>
              <p className="text-xl font-semibold truncate text-[#E8F0FF]">
                {topAsn.asn_org || "Unknown"}
              </p>
              <p className="text-sm font-mono mt-1" style={{ color: "#00e1b0" }}>
                {topAsn.asn_number}
              </p>
            </div>

            <div
              className="flex items-center justify-between p-4 rounded-xl"
              style={{
                background: "#ff5b6720",
                border: "1px solid #ff5b6740",
                boxShadow: "0 0 20px #ff5b6720",
              }}
            >
              <div>
                <p className="text-xs mb-1 text-slate-300/85">Total Attacks</p>
                <p className="text-3xl font-semibold" style={{ color: "#ff5b67" }}>
                  {topAsn.attack_count}
                </p>
              </div>
              <FireIcon className="w-10 h-10" style={{ color: "#ff5b67" }} />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-300/85">Block Rate</span>
                <span className="font-semibold" style={{ color: "#00e7b7" }}>
                  {Math.round((topAsn.blocked_count / topAsn.attack_count) * 100)}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-800/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(topAsn.blocked_count / topAsn.attack_count) * 100}%`,
                  }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full"
                  style={{
                    background: "linear-gradient(90deg, #00e7b7, #3ee8c4)",
                    boxShadow: "0 0 10px #00e7b760",
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 relative z-10 text-slate-300/85">
            <MapIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>No ASN threats detected</p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function HeadlessBrowserCard({ data }: any) {
  const stats = data?.statistics;
  const total = stats?.total_headless || 0;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
      <GlassCard className="p-6 relative overflow-hidden h-full">
        <div className="absolute bottom-0 right-0 opacity-5">
          <CpuChipIcon className="w-40 h-40" />
        </div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <BugAntIcon
            className="w-6 h-6"
            style={{ color: "#b483ff", filter: "drop-shadow(0 0 8px #b483ff80)" }}
          />
          <h3 className="text-lg font-semibold text-[#E8F0FF]">Headless Browsers</h3>
        </div>

        {total > 0 ? (
          <div className="relative z-10">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: "#b483ff20",
                  border: "1px solid #b483ff40",
                }}
              >
                <p className="text-3xl font-semibold" style={{ color: "#b483ff" }}>
                  {total}
                </p>
                <p className="text-xs mt-1 text-slate-300/85">Detected</p>
              </div>

              <div
                className="p-4 rounded-xl text-center"
                style={{
                  background: "#ff5b6720",
                  border: "1px solid #ff5b6740",
                }}
              >
                <p className="text-3xl font-semibold" style={{ color: "#ff5b67" }}>
                  {stats?.blocked_count || 0}
                </p>
                <p className="text-xs mt-1 text-slate-300/85">Blocked</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { name: "Playwright", value: stats?.playwright_count || 0, color: "#b483ff" },
                { name: "Puppeteer", value: stats?.puppeteer_count || 0, color: "#2F81F7" },
                { name: "Selenium", value: stats?.selenium_count || 0, color: "#3ee8c4" },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300/85">{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#E8F0FF]">{item.value}</span>
                    <div
                      className="w-20 h-2 rounded-full overflow-hidden"
                      style={{ background: item.color + "20" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: total > 0 ? (item.value / total) * 100 + "%" : "0%",
                        }}
                        transition={{ duration: 1, delay: idx * 0.1 }}
                        className="h-full"
                        style={{ background: item.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 relative z-10 text-slate-300/85">
            <CpuChipIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>No headless browsers detected</p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function CrawlerVerificationCard({ data }: any) {
  const stats = data?.statistics;
  const verified = stats?.verified_count || 0;
  const fake = stats?.impostor_count || 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-6 h-full">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheckIcon
            className="w-6 h-6"
            style={{ color: "#00cfff", filter: "drop-shadow(0 0 8px #00cfff80)" }}
          />
          <h3 className="text-lg font-semibold text-[#E8F0FF]">Crawler Verification</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-4 rounded-xl text-center"
            style={{
              background: "#00e7b720",
              border: "1px solid #00e7b740",
              boxShadow: "0 0 20px #00e7b720",
            }}
          >
            <CheckCircleIcon className="w-8 h-8 mx-auto mb-2" style={{ color: "#00e7b7" }} />
            <p className="text-3xl font-semibold" style={{ color: "#00e7b7" }}>
              {verified}
            </p>
            <p className="text-xs mt-1 text-slate-300/85">Verified Crawlers</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            className="p-4 rounded-xl text-center"
            style={{
              background: "#ff5b6720",
              border: "1px solid #ff5b6740",
              boxShadow: "0 0 20px #ff5b6720",
            }}
          >
            <NoSymbolIcon className="w-8 h-8 mx-auto mb-2" style={{ color: "#ff5b67" }} />
            <p className="text-3xl font-semibold" style={{ color: "#ff5b67" }}>
              {fake}
            </p>
            <p className="text-xs mt-1 text-slate-300/85">Fake Crawlers</p>
          </motion.div>
        </div>

        {stats && (
          <div className="mt-4 pt-4 space-y-2 border-t border-cyan-400/10">
            <div className="flex justify-between text-sm">
              <span className="text-slate-300/85">Googlebot</span>
              <span className="font-semibold text-[#E8F0FF]">{stats.googlebot_count || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300/85">Bingbot</span>
              <span className="font-semibold text-[#E8F0FF]">{stats.bingbot_count || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300/85">DuckDuckBot</span>
              <span className="font-semibold text-[#E8F0FF]">{stats.duckduckbot_count || 0}</span>
            </div>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}

function VelocityAnalysisCard({ data, trends }: any) {
  const chartData = trends.slice(-12).map((t: any) => ({
    hour: new Date(t.hour).getHours() + "h",
    requests: t.totalRequests || 0,
    bots: t.botRequests || 0,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlassCard className="p-6 h-full">
        <div className="flex items-center gap-3 mb-4">
          <BoltIcon
            className="w-6 h-6"
            style={{ color: "#ffdd6b", filter: "drop-shadow(0 0 8px #ffdd6b80)" }}
          />
          <h3 className="text-lg font-semibold text-[#E8F0FF]">Velocity Analysis</h3>
        </div>

        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffdd6b" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ffdd6b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,255,255,0.1)" />
                <XAxis dataKey="hour" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  contentStyle={{
                    background: "#0b1628",
                    border: "1px solid rgba(0,255,255,0.2)",
                    borderRadius: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="bots"
                  stroke="#ffdd6b"
                  fill="url(#velocityGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>

            {data?.topRequesters?.length > 0 && (
              <div className="mt-4 pt-4 space-y-2 border-t border-cyan-400/10">
                <p className="text-xs font-semibold mb-2 text-slate-300/85">Top Requesters</p>
                {data.topRequesters.slice(0, 3).map((req: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="font-mono text-[#E8F0FF]">{req.source_ip}</span>
                    <span className="font-semibold" style={{ color: "#ffdd6b" }}>
                      {req.total_requests} req
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-slate-300/85">
            <ChartBarIcon className="w-16 h-16 mx-auto mb-3 opacity-30" />
            <p>No velocity data available</p>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
