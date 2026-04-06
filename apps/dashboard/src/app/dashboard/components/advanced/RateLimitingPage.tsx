"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import {
  PlusIcon,
  ArrowPathIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
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
} from "recharts";

interface RateLimitStats {
  totalRequests: number;
  rateLimitedRequests: number;
  uniqueIps: number;
  blockedIps: number;
  peakRPS: number;
  averageRPS: number;
  blockRate: number;
}

interface RateLimitRule {
  id: string;
  name: string;
  endpointPattern: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RateLimitViolation {
  sourceIp: string;
  endpoint: string;
  requestsAttempted: number;
  limitExceeded: string;
  blockedAt: string;
  userAgent: string;
  violationType: string;
}

interface TopViolator {
  sourceIp: string;
  violationCount: number;
  lastViolation: string;
  totalRequestsAttempted: number;
}

export function RateLimitingPage({ companyId }: { companyId: string }) {
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [violations, setViolations] = useState<RateLimitViolation[]>([]);
  const [topViolators, setTopViolators] = useState<TopViolator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("violations");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [ruleName, setRuleName] = useState("");
  const [endpointPattern, setEndpointPattern] = useState("");
  const [requestsPerMinute, setRequestsPerMinute] = useState(60);
  const [requestsPerHour, setRequestsPerHour] = useState(1000);
  const [burstLimit, setBurstLimit] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRateLimits = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/rate-limits", {
        headers: {
          "x-tenant-id": companyId,
          ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}),
        },
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        setStats(data.rateLimits.statistics);
        setRules(data.rateLimits.rules || []);
        setViolations(data.rateLimits.recentViolations || []);
        setTopViolators(data.rateLimits.topViolators || []);
      }
    } catch (error) {
      console.error("Failed to fetch rate limits:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchRateLimits();
      const interval = setInterval(fetchRateLimits, 30000);
      return () => clearInterval(interval);
    }
  }, [companyId]);

  const handleCreateRule = async () => {
    if (!ruleName || !endpointPattern || !requestsPerMinute) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/rate-limits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
          ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          ruleName,
          endpointPattern,
          requestsPerMinute,
          requestsPerHour,
          burstLimit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Rate limit rule created successfully!", "success");
        resetForm();
        setIsModalOpen(false);
        fetchRateLimits();
      } else {
        showToast(data.error || "Failed to create rule", "error");
      }
    } catch (error) {
      showToast("Failed to create rule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRuleName("");
    setEndpointPattern("");
    setRequestsPerMinute(60);
    setRequestsPerHour(1000);
    setBurstLimit(10);
  };

  if (loading) {
    return <PageSkeleton />;
  }

  const tabs = [
    { key: "violations", label: "Recent Violations" },
    { key: "violators", label: "Top Violators" },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-lg backdrop-blur-xl border border-white/10 ${
              toast.type === "success" ? "bg-emerald-500/90" : "bg-red-500/90"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Rate Limiting</h1>
          <p className="text-slate-400">
            Configure and monitor API rate limits
          </p>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Add Rate Limit
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchRateLimits}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: stats?.totalRequests || 0, sub: `Avg: ${stats?.averageRPS || 0} req/s` },
          { label: "Rate Limited", value: stats?.rateLimitedRequests || 0, sub: `Block rate: ${stats?.blockRate || 0}%` },
          { label: "Peak RPS", value: stats?.peakRPS || 0, sub: "Requests per second" },
          { label: "Blocked IPs", value: stats?.blockedIps || 0, sub: `Of ${stats?.uniqueIps || 0} unique` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5">
            <div className="text-[12px] text-gray-500 mb-2">{s.label}</div>
            <div className="text-2xl font-semibold text-white tracking-tight">{s.value}</div>
            {s.sub && <div className="text-[11px] text-gray-600 mt-1">{s.sub}</div>}
          </motion.div>
        ))}
      </div>

      {/* Rate Limit Rules */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">
          Rate Limit Rules ({rules.length})
        </h2>
        <AnimatePresence>
          {rules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {rule.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.isActive ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                      {rule.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>

                  <div className="mb-3">
                    <code className="text-sm text-cyan-400 bg-slate-900/50 px-3 py-1 rounded">
                      {rule.endpointPattern}
                    </code>
                  </div>

                  <div className="flex items-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4" />
                      <span>{rule.requestsPerMinute} req/min</span>
                    </div>
                    {rule.requestsPerHour && (
                      <>
                        <span>•</span>
                        <span>{rule.requestsPerHour} req/hour</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Burst: {rule.burstLimit}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {rules.length === 0 && (
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-white/10">
            <BoltIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-white font-semibold mb-2">
              No Rate Limit Rules
            </p>
            <p className="text-slate-400 mb-4">
              Create your first rate limiting rule
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold"
            >
              Add Rate Limit
            </motion.button>
          </div>
        )}
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

        {activeTab === "violations" && (
          <div className="space-y-3">
            {violations.map((violation, index) => (
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
                      <code className="text-red-400 font-mono">
                        {violation.sourceIp}
                      </code>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        {violation.violationType}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>
                        Endpoint:{" "}
                        <code className="text-purple-400">
                          {violation.endpoint}
                        </code>
                      </span>
                      <span>•</span>
                      <span>
                        Attempted:{" "}
                        <span className="text-red-400">
                          {violation.requestsAttempted}
                        </span>
                      </span>
                      <span>•</span>
                      <span>Limit: {violation.limitExceeded}</span>
                      <span>•</span>
                      <span>
                        {new Date(violation.blockedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {violations.length === 0 && (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl text-white font-semibold mb-2">
                  No Recent Violations
                </p>
                <p className="text-slate-400">
                  All requests are within rate limits
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "violators" && (
          <div className="space-y-3">
            {topViolators.map((violator, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 border-l-4 border-red-500 rounded-r-xl p-5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-lg font-mono text-red-400">
                        {violator.sourceIp}
                      </code>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        {violator.violationCount} violations
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>
                        Total Attempts:{" "}
                        <span className="text-red-400 font-bold">
                          {violator.totalRequestsAttempted}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Last:{" "}
                        {new Date(violator.lastViolation).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-semibold"
                  >
                    Block IP
                  </motion.button>
                </div>
              </motion.div>
            ))}

            {topViolators.length === 0 && (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <p className="text-xl text-white font-semibold mb-2">
                  No Violators
                </p>
                <p className="text-slate-400">
                  No IPs have exceeded rate limits recently
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Rate Limit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[600px] bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Create Rate Limit Rule</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., API Endpoint Rate Limit"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Endpoint Pattern *
                  </label>
                  <input
                    type="text"
                    placeholder="/api/* or /api/users"
                    value={endpointPattern}
                    onChange={(e) => setEndpointPattern(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Use * as wildcard (e.g., /api/* matches all API endpoints)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Requests per Minute *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={requestsPerMinute}
                      onChange={(e) => setRequestsPerMinute(Number(e.target.value) || 60)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Requests per Hour
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={1000000}
                      value={requestsPerHour}
                      onChange={(e) => setRequestsPerHour(Number(e.target.value) || 1000)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Burst Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={burstLimit}
                    onChange={(e) => setBurstLimit(Number(e.target.value) || 10)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Maximum number of requests allowed in a short burst
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  Create Rate Limit
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
