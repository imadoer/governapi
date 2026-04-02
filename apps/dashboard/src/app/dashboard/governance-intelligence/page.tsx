"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  ChartBarIcon,
  DocumentCheckIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import { Spin } from "antd";
import Link from "next/link";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
interface IntelligenceData {
  scores: {
    security_score: number;
    governance_score: number;
    compliance_score: number;
    trust_index: number;
  };
  trends?: Array<{
    date: string;
    securityScore: number;
    governanceScore: number;
    complianceScore: number;
    trustIndex: number;
  }>;
  integrations_summary: {
    total: number;
    active: number;
    last_sync: string | null;
  };
  metrics: {
    total_vulnerabilities: number;
    dependency_alerts: number;
    stale_tickets: number;
    security_mentions: number;
    total_records_synced: number;
  };
  integrations: Array<{
    id: string;
    type: string;
    name: string;
    active: boolean;
    metrics: {
      vulnerabilities: number;
      dependencyAlerts: number;
      staleTickets: number;
      securityMentions: number;
    };
    last_sync: string | null;
    sync_status: string;
    error: string | null;
  }>;
}
const COLORS = {
  security: "#3b82f6",
  governance: "#8b5cf6",
  compliance: "#10b981",
  trust: "#06b6d4",
};
export default function GovernanceIntelligencePage() {
  const [intelligence, setIntelligence] = useState<IntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const companyId = "1"; // TODO: Get from session
  useEffect(() => {
    fetchIntelligence();
    const interval = setInterval(fetchIntelligence, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);
  const fetchIntelligence = async () => {
    try {
      const response = await fetch("/api/customer/intelligence", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();
      if (data.success) {
        setIntelligence(data);
      }
    } catch (error) {
      console.error("Failed to fetch intelligence:", error);
    } finally {
      setLoading(false);
    }
  };
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 50) return "text-yellow-400";
    return "text-red-400";
  };
  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500/20 to-green-600/5 border-green-500/30";
    if (score >= 50) return "from-yellow-500/20 to-yellow-600/5 border-yellow-500/30";
    return "from-red-500/20 to-red-600/5 border-red-500/30";
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }
  if (!intelligence) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Failed to load intelligence data
      </div>
    );
  }
  // Prepare chart data
  const securitySignalsData = [
    { name: "Vulnerabilities", value: intelligence.metrics.total_vulnerabilities, color: "#ef4444" },
    { name: "Dependencies", value: intelligence.metrics.dependency_alerts, color: "#f59e0b" },
    { name: "Stale Tickets", value: intelligence.metrics.stale_tickets, color: "#eab308" },
    { name: "Security Mentions", value: intelligence.metrics.security_mentions, color: "#3b82f6" },
  ];
  const trendData = intelligence.trends && intelligence.trends.length > 0
    ? intelligence.trends.map(t => ({
        date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Security: t.securityScore,
        Governance: t.governanceScore,
        Compliance: t.complianceScore,
      }))
    : [];
  return (
    <div className="space-y-6 p-6">
      {/* Back Button */}
      <Link 
        href="/dashboard" 
        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Back to External Integrations</span>
      </Link>
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Governance Intelligence Dashboard
        </h1>
        <p className="text-slate-400">
          Unified Security, Governance & Compliance Intelligence
        </p>
      </div>
      {/* Trust Index - Hero Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br ${getScoreGradient(intelligence.scores.trust_index)} border rounded-2xl p-8`}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <GlobeAltIcon className="w-8 h-8 text-cyan-400" />
              <h2 className="text-xl font-semibold text-gray-300">Trust Index</h2>
            </div>
            <div className={`text-6xl font-bold ${getScoreColor(intelligence.scores.trust_index)}`}>
              {intelligence.scores.trust_index}
              <span className="text-2xl text-gray-400">/100</span>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Overall security posture across all integrations
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400 mb-1">Active Integrations</div>
            <div className="text-3xl font-bold text-white">{intelligence.integrations_summary.active}</div>
            <div className="text-xs text-gray-500 mt-1">
              {intelligence.metrics.total_records_synced} records synced
            </div>
          </div>
        </div>
      </motion.div>
      {/* Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Security Score</h3>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(intelligence.scores.security_score)}`}>
            {intelligence.scores.security_score}
            <span className="text-lg text-gray-400">/100</span>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            {intelligence.metrics.total_vulnerabilities} vulnerabilities tracked
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <ChartBarIcon className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Governance Score</h3>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(intelligence.scores.governance_score)}`}>
            {intelligence.scores.governance_score}
            <span className="text-lg text-gray-400">/100</span>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            {intelligence.metrics.stale_tickets} stale tickets
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <DocumentCheckIcon className="w-6 h-6 text-green-400" />
            <h3 className="text-lg font-semibold text-white">Compliance Score</h3>
          </div>
          <div className={`text-4xl font-bold ${getScoreColor(intelligence.scores.compliance_score)}`}>
            {intelligence.scores.compliance_score}
            <span className="text-lg text-gray-400">/100</span>
          </div>
          <div className="mt-3 text-sm text-gray-400">
            {intelligence.integrations_summary.active} active monitors
          </div>
        </motion.div>
      </div>
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Signals Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Security Signals by Source</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={securitySignalsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                labelStyle={{ color: "#fff" }}
              />
              <Bar dataKey="value" fill="#3b82f6">
                {securitySignalsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Score Trends (7 Days)</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Line type="monotone" dataKey="Security" stroke="#3b82f6" strokeWidth={2} />
                <Line type="monotone" dataKey="Governance" stroke="#8b5cf6" strokeWidth={2} />
                <Line type="monotone" dataKey="Compliance" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-gray-500">
              No trend data available yet. Sync integrations to collect data.
            </div>
          )}
        </motion.div>
      </div>
      {/* Integration Health Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-4">Integration Health</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Integration</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Status</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Metrics</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Last Sync</th>
              </tr>
            </thead>
            <tbody>
              {intelligence.integrations.map((integration) => (
                <tr key={integration.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">
                        {integration.type === "github" && "🐙"}
                        {integration.type === "jira" && "🎫"}
                        {integration.type === "slack" && "💬"}
                        {integration.type === "webhook" && "🔗"}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{integration.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{integration.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {integration.active ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircleIcon className="w-5 h-5" />
                        <span>Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500">
                        <ExclamationTriangleIcon className="w-5 h-5" />
                        <span>Inactive</span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-3 text-sm">
                      {integration.metrics.vulnerabilities > 0 && (
                        <span className="text-red-400">{integration.metrics.vulnerabilities} vulns</span>
                      )}
                      {integration.metrics.dependencyAlerts > 0 && (
                        <span className="text-orange-400">{integration.metrics.dependencyAlerts} alerts</span>
                      )}
                      {integration.metrics.staleTickets > 0 && (
                        <span className="text-yellow-400">{integration.metrics.staleTickets} stale</span>
                      )}
                      {integration.metrics.securityMentions > 0 && (
                        <span className="text-blue-400">{integration.metrics.securityMentions} mentions</span>
                      )}
                      {!integration.metrics.vulnerabilities && 
                       !integration.metrics.dependencyAlerts && 
                       !integration.metrics.staleTickets && 
                       !integration.metrics.securityMentions && (
                        <span className="text-gray-500">No data</span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    {integration.last_sync ? (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <ClockIcon className="w-4 h-4" />
                        {new Date(integration.last_sync).toLocaleString()}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">Never synced</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}