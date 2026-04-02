"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  FireIcon,
  BoltIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { Select, Badge, Spin, Progress } from "antd";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface Vulnerability {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  created_at: string;
}

interface VulnerabilitySummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  resolved: number;
  averageCvss: number;
}

export function VulnerabilitiesPage({ companyId }: { companyId: string }) {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [summary, setSummary] = useState<VulnerabilitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const fetchVulnerabilities = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/vulnerabilities", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();

      if (data.success) {
        setVulnerabilities(data.vulnerabilities || []);
        setSummary(data.summary || null);
      }
    } catch (error) {
      console.error("Failed to fetch vulnerabilities:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchVulnerabilities();
  }, [companyId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "#dc2626";
      case "HIGH":
        return "#ea580c";
      case "MEDIUM":
        return "#ca8a04";
      case "LOW":
        return "#16a34a";
      default:
        return "#6b7280";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return <FireIcon className="w-5 h-5" />;
      case "HIGH":
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case "MEDIUM":
        return <BoltIcon className="w-5 h-5" />;
      case "LOW":
        return <InformationCircleIcon className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const filteredVulns = vulnerabilities.filter(
    (vuln) => severityFilter === "all" || vuln.severity === severityFilter,
  );

  // Radar chart data for security posture
  const radarData = [
    { category: "Critical", value: summary?.critical || 0, fullMark: 10 },
    { category: "High", value: summary?.high || 0, fullMark: 20 },
    { category: "Medium", value: summary?.medium || 0, fullMark: 30 },
    { category: "Low", value: summary?.low || 0, fullMark: 40 },
  ];

  // Calculate risk score (0-100)
  const riskScore = summary
    ? Math.min(
        100,
        summary.critical * 25 +
          summary.high * 10 +
          summary.medium * 5 +
          summary.low * 1,
      )
    : 0;

  const getRiskLevel = (score: number) => {
    if (score >= 75)
      return { level: "CRITICAL", color: "#dc2626", text: "Critical Risk" };
    if (score >= 50)
      return { level: "HIGH", color: "#ea580c", text: "High Risk" };
    if (score >= 25)
      return { level: "MEDIUM", color: "#ca8a04", text: "Moderate Risk" };
    return { level: "LOW", color: "#16a34a", text: "Low Risk" };
  };

  const risk = getRiskLevel(riskScore);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Score Hero */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative overflow-hidden bg-gradient-to-br from-red-900/20 via-slate-800/50 to-slate-800/50 border border-red-500/30 rounded-3xl p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Security Risk Assessment
            </h2>
            <p className="text-slate-300">
              {summary?.total || 0} total vulnerabilities detected across your
              infrastructure
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="px-4 py-2 rounded-lg font-bold text-white"
                style={{ backgroundColor: risk.color }}
              >
                {risk.text}
              </div>
              <span className="text-slate-400">
                Risk Score: {riskScore}/100
              </span>
            </div>
          </div>

          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="12"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke={risk.color}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 70}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 70 * (1 - riskScore / 100),
                }}
                transition={{ duration: 2, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-white">{riskScore}</div>
                <div className="text-xs text-slate-400">Risk</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Severity Cards - Horizontal Layout */}
      <div className="grid grid-cols-4 gap-4">
        {[
          {
            severity: "CRITICAL",
            count: summary?.critical || 0,
            icon: FireIcon,
            gradient: "from-red-500/20 to-red-600/10",
          },
          {
            severity: "HIGH",
            count: summary?.high || 0,
            icon: ExclamationTriangleIcon,
            gradient: "from-orange-500/20 to-orange-600/10",
          },
          {
            severity: "MEDIUM",
            count: summary?.medium || 0,
            icon: BoltIcon,
            gradient: "from-yellow-500/20 to-yellow-600/10",
          },
          {
            severity: "LOW",
            count: summary?.low || 0,
            icon: CheckCircleIcon,
            gradient: "from-green-500/20 to-green-600/10",
          },
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.severity}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -5 }}
              onClick={() => setSeverityFilter(item.severity)}
              className={`bg-gradient-to-br ${item.gradient} border border-${item.severity === "CRITICAL" ? "red" : item.severity === "HIGH" ? "orange" : item.severity === "MEDIUM" ? "yellow" : "green"}-500/30 rounded-2xl p-6 cursor-pointer transition-all ${
                severityFilter === item.severity ? "ring-2 ring-cyan-500" : ""
              }`}
            >
              <Icon
                className={`w-8 h-8 mb-3 text-${item.severity === "CRITICAL" ? "red" : item.severity === "HIGH" ? "orange" : item.severity === "MEDIUM" ? "yellow" : "green"}-500`}
              />
              <div className="text-3xl font-bold text-white mb-1">
                {item.count}
              </div>
              <div className="text-sm text-slate-300 capitalize">
                {item.severity.toLowerCase()}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Security Posture Radar Chart */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">
            Security Posture Analysis
          </h3>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchVulnerabilities}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center gap-2 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Refresh
          </motion.button>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#475569" />
            <PolarAngleAxis dataKey="category" stroke="#94a3b8" />
            <PolarRadiusAxis stroke="#94a3b8" />
            <Radar
              name="Vulnerabilities"
              dataKey="value"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Vulnerabilities Timeline */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">
            Vulnerability Timeline
          </h3>
          <Select
            value={severityFilter}
            onChange={setSeverityFilter}
            className="w-48"
            options={[
              { value: "all", label: "🔍 All Severities" },
              { value: "CRITICAL", label: "🔥 Critical Only" },
              { value: "HIGH", label: "⚠️ High Only" },
              { value: "MEDIUM", label: "⚡ Medium Only" },
              { value: "LOW", label: "ℹ️ Low Only" },
            ]}
          />
        </div>

        <AnimatePresence mode="popLayout">
          {filteredVulns.map((vuln, index) => (
            <motion.div
              key={vuln.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.03 }}
              className="relative bg-slate-800/50 border-l-4 border-slate-700 rounded-r-xl p-5 hover:bg-slate-700/50 transition-all group"
              style={{ borderLeftColor: getSeverityColor(vuln.severity) }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="p-3 rounded-xl"
                  style={{
                    backgroundColor: `${getSeverityColor(vuln.severity)}20`,
                  }}
                >
                  <div style={{ color: getSeverityColor(vuln.severity) }}>
                    {getSeverityIcon(vuln.severity)}
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <Badge
                      color={
                        vuln.severity === "CRITICAL"
                          ? "red"
                          : vuln.severity === "HIGH"
                            ? "orange"
                            : vuln.severity === "MEDIUM"
                              ? "gold"
                              : "green"
                      }
                      text={vuln.severity}
                    />
                    <span className="text-slate-400 text-sm">
                      ID: {vuln.id}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400">
                    Discovered: {new Date(vuln.created_at).toLocaleString()}
                  </p>
                </div>

                <div
                  className="text-2xl font-bold opacity-50 group-hover:opacity-100 transition-opacity"
                  style={{ color: getSeverityColor(vuln.severity) }}
                >
                  !
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredVulns.length === 0 && (
          <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-700">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-xl text-white font-semibold mb-2">
              {severityFilter === "all"
                ? "No Vulnerabilities Detected! 🎉"
                : `No ${severityFilter} Vulnerabilities`}
            </p>
            <p className="text-slate-400">
              Your infrastructure is secure at this severity level
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
