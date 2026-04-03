"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowPathIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface LiveStats {
  total_requests: number;
  threats_blocked: number;
  avg_response_time: number;
  error_rate: number;
  uptime: number;
}

interface CostsData {
  total: number;
  byApi: Record<string, number>;
  savings: number;
  threats_blocked: number;
  scans_performed: number;
  apis_monitored: number;
}

interface ComplianceAnalytics {
  frameworks_assessed: number;
  avg_compliance_score: number;
  total_findings: number;
  critical_findings: number;
  resolved_findings: number;
}

export function AnalyticsInsightsPage({ companyId }: { companyId: string }) {
  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  const [costsData, setCostsData] = useState<CostsData | null>(null);
  const [complianceData, setComplianceData] =
    useState<ComplianceAnalytics | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState("24h");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [liveRes, costsRes, complianceRes] = await Promise.all([
        fetch("/api/analytics/live", {
          headers: { "x-tenant-id": companyId },
        }),
        fetch("/api/analytics/costs", {
          headers: { "x-tenant-id": companyId },
        }),
        fetch("/api/analytics/compliance", {
          headers: { "x-tenant-id": companyId },
        }),
      ]);

      const [liveData, costsData, complianceData] = await Promise.all([
        liveRes.json(),
        costsRes.json(),
        complianceRes.json(),
      ]);

      if (liveData.success) {
        setLiveStats(liveData.stats);
        setRecentActivity(liveData.recent_activity || []);
      }

      if (costsData.success) {
        setCostsData(costsData.costs);
      }

      if (complianceData.success) {
        setComplianceData(complianceData.overview);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchAnalytics();
      const interval = setInterval(fetchAnalytics, 30000);
      return () => clearInterval(interval);
    }
  }, [companyId, timeframe]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  const costSavings = costsData?.savings || 0;
  const totalCosts = costsData?.total || 0;

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "activity", label: "Recent Activity" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Analytics & Insights
          </h1>
          <p className="text-slate-400">
            Comprehensive analytics and business intelligence
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-32 px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="1h" className="bg-slate-800">Last Hour</option>
            <option value="24h" className="bg-slate-800">Last 24h</option>
            <option value="7d" className="bg-slate-800">Last 7d</option>
            <option value="30d" className="bg-slate-800">Last 30d</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAnalytics}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <BoltIcon className="w-10 h-10 text-cyan-500" />
          </div>
          <p className="text-sm text-slate-400 mb-1">Total Requests</p>
          <p className="text-3xl font-bold text-white">
            {liveStats?.total_requests || 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ShieldCheckIcon className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-sm text-slate-400 mb-1">Threats Blocked</p>
          <p className="text-3xl font-bold text-green-500">
            {liveStats?.threats_blocked || 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ClockIcon className="w-10 h-10 text-blue-500" />
          </div>
          <p className="text-sm text-slate-400 mb-1">Avg Response</p>
          <p className="text-3xl font-bold text-white">
            {liveStats?.avg_response_time || 0}ms
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>
          <p className="text-sm text-slate-400 mb-1">Uptime</p>
          <p className="text-3xl font-bold text-green-500">
            {liveStats?.uptime || 0}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ExclamationTriangleIcon className="w-10 h-10 text-purple-500" />
          </div>
          <p className="text-sm text-slate-400 mb-1">Error Rate</p>
          <p className="text-3xl font-bold text-purple-500">
            {liveStats?.error_rate || 0}%
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 border border-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Cost Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Cost Analysis
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CurrencyDollarIcon className="w-8 h-8 text-cyan-500" />
                      <div>
                        <p className="text-sm text-slate-400">
                          Total Costs
                        </p>
                        <p className="text-2xl font-bold text-white">
                          ${totalCosts.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-sm text-slate-400">
                          Cost Savings
                        </p>
                        <p className="text-2xl font-bold text-green-500">
                          ${costSavings.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-slate-400">APIs Monitored</p>
                      <p className="text-xl font-bold text-white mt-1">
                        {costsData?.apis_monitored || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-slate-400">Scans Performed</p>
                      <p className="text-xl font-bold text-white mt-1">
                        {costsData?.scans_performed || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Compliance Overview */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-xl font-bold text-white mb-4">
                  Compliance Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                    <div>
                      <p className="text-sm text-slate-400">
                        Avg Compliance Score
                      </p>
                      <p className="text-3xl font-bold text-cyan-500">
                        {Math.round(
                          complianceData?.avg_compliance_score || 0,
                        )}
                        %
                      </p>
                    </div>
                    <ShieldCheckIcon className="w-12 h-12 text-cyan-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-slate-400">Frameworks</p>
                      <p className="text-xl font-bold text-white mt-1">
                        {complianceData?.frameworks_assessed || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-900/50 rounded-lg">
                      <p className="text-slate-400">Total Findings</p>
                      <p className="text-xl font-bold text-white mt-1">
                        {complianceData?.total_findings || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <p className="text-slate-400">Critical</p>
                      <p className="text-xl font-bold text-red-500 mt-1">
                        {complianceData?.critical_findings || 0}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-slate-400">Resolved</p>
                      <p className="text-xl font-bold text-green-500 mt-1">
                        {complianceData?.resolved_findings || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === "activity" && (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-cyan-400 font-mono">
                        {activity.url}
                      </code>
                      {activity.blocked && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          BLOCKED
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>
                        Response:{" "}
                        <span className="text-white">
                          {activity.response_time}ms
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {recentActivity.length === 0 && (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                <ChartBarIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-xl text-white font-semibold mb-2">
                  No Recent Activity
                </p>
                <p className="text-slate-400">
                  Activity will appear here as your APIs are used
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
