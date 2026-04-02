"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  ArrowPathIcon,
  BoltIcon,
  ShieldExclamationIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrashIcon,
  PencilIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Modal, Input, message, Spin, Tag, Tabs, InputNumber } from "antd";
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

  // Form state
  const [ruleName, setRuleName] = useState("");
  const [endpointPattern, setEndpointPattern] = useState("");
  const [requestsPerMinute, setRequestsPerMinute] = useState(60);
  const [requestsPerHour, setRequestsPerHour] = useState(1000);
  const [burstLimit, setBurstLimit] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const fetchRateLimits = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/rate-limits", {
        headers: { "x-tenant-id": companyId },
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
      message.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/rate-limits", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
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
        message.success("Rate limit rule created successfully!");
        resetForm();
        setIsModalOpen(false);
        fetchRateLimits();
      } else {
        message.error(data.error || "Failed to create rule");
      }
    } catch (error) {
      message.error("Failed to create rule");
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
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <BoltIcon className="w-10 h-10 text-cyan-500" />
            <div className="text-right">
              <p className="text-sm text-slate-400">Total Requests</p>
              <p className="text-3xl font-bold text-white">
                {stats?.totalRequests || 0}
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Average: {stats?.averageRPS || 0} req/s
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ShieldExclamationIcon className="w-10 h-10 text-red-500" />
            <div className="text-right">
              <p className="text-sm text-red-300">Rate Limited</p>
              <p className="text-3xl font-bold text-red-500">
                {stats?.rateLimitedRequests || 0}
              </p>
            </div>
          </div>
          <div className="text-sm text-red-300">
            Block Rate: {stats?.blockRate || 0}%
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ChartBarIcon className="w-10 h-10 text-orange-500" />
            <div className="text-right">
              <p className="text-sm text-slate-400">Peak RPS</p>
              <p className="text-3xl font-bold text-orange-500">
                {stats?.peakRPS || 0}
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-400">Requests per second</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ExclamationTriangleIcon className="w-10 h-10 text-purple-500" />
            <div className="text-right">
              <p className="text-sm text-slate-400">Blocked IPs</p>
              <p className="text-3xl font-bold text-purple-500">
                {stats?.blockedIps || 0}
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            Out of {stats?.uniqueIps || 0} unique
          </div>
        </motion.div>
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
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">
                      {rule.name}
                    </h3>
                    <Tag color={rule.isActive ? "green" : "red"}>
                      {rule.isActive ? "Active" : "Disabled"}
                    </Tag>
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
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700">
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
      <Tabs
        defaultActiveKey="violations"
        items={[
          {
            key: "violations",
            label: "⚠️ Recent Violations",
            children: (
              <div className="space-y-3">
                {violations.map((violation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-red-400 font-mono">
                            {violation.sourceIp}
                          </code>
                          <Tag color="red">{violation.violationType}</Tag>
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
            ),
          },
          {
            key: "violators",
            label: "🚨 Top Violators",
            children: (
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
                          <Tag color="red">
                            {violator.violationCount} violations
                          </Tag>
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
            ),
          },
        ]}
      />

      {/* Create Rate Limit Modal */}
      <Modal
        title="Create Rate Limit Rule"
        open={isModalOpen}
        onOk={handleCreateRule}
        onCancel={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        confirmLoading={submitting}
        okText="Create Rate Limit"
        width={600}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rule Name *
            </label>
            <Input
              placeholder="e.g., API Endpoint Rate Limit"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Endpoint Pattern *
            </label>
            <Input
              placeholder="/api/* or /api/users"
              value={endpointPattern}
              onChange={(e) => setEndpointPattern(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              Use * as wildcard (e.g., /api/* matches all API endpoints)
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Requests per Minute *
              </label>
              <InputNumber
                min={1}
                max={10000}
                value={requestsPerMinute}
                onChange={(value) => setRequestsPerMinute(value || 60)}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Requests per Hour
              </label>
              <InputNumber
                min={1}
                max={1000000}
                value={requestsPerHour}
                onChange={(value) => setRequestsPerHour(value || 1000)}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Burst Limit
            </label>
            <InputNumber
              min={1}
              max={100}
              value={burstLimit}
              onChange={(value) => setBurstLimit(value || 10)}
              className="w-full"
            />
            <p className="text-xs text-slate-500 mt-1">
              Maximum number of requests allowed in a short burst
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
