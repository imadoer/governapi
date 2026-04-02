"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BoltIcon,
  ArrowPathIcon,
  ClockIcon,
  RocketLaunchIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Spin, Progress, Tag, Tabs } from "antd";
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

interface PerformanceSummary {
  totalRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  medianResponseTime: number;
  p95ResponseTime: number;
  slowRequests: number;
  successRate: number;
  slowRequestRate: number;
}

interface EndpointPerformance {
  endpoint: string;
  requestCount: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  slowRequests: number;
}

interface ErrorAnalysis {
  clientErrors: number;
  serverErrors: number;
  rateLimitErrors: number;
  serviceUnavailable: number;
}

export function PerformanceMonitorPage({ companyId }: { companyId: string }) {
  const [summary, setSummary] = useState<PerformanceSummary | null>(null);
  const [hourlyTrends, setHourlyTrends] = useState<any[]>([]);
  const [endpointPerformance, setEndpointPerformance] = useState<
    EndpointPerformance[]
  >([]);
  const [errorAnalysis, setErrorAnalysis] = useState<ErrorAnalysis | null>(
    null,
  );
  const [slowestEndpoints, setSlowestEndpoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/performance", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();

      if (data.success) {
        setSummary(data.performance.summary);
        setHourlyTrends(data.performance.hourlyTrends || []);
        setEndpointPerformance(data.performance.endpointPerformance || []);
        setErrorAnalysis(data.performance.errorAnalysis);
        setSlowestEndpoints(data.performance.slowestEndpoints || []);
      }
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchPerformanceData();
      const interval = setInterval(fetchPerformanceData, 30000);
      return () => clearInterval(interval);
    }
  }, [companyId]);

  const getResponseTimeColor = (time: number) => {
    if (time < 200) return "#10b981";
    if (time < 500) return "#3b82f6";
    if (time < 1000) return "#f59e0b";
    return "#ef4444";
  };

  const getPerformanceStatus = (avgTime: number) => {
    if (avgTime < 200) return { label: "Excellent", color: "green" };
    if (avgTime < 500) return { label: "Good", color: "blue" };
    if (avgTime < 1000) return { label: "Fair", color: "orange" };
    return { label: "Slow", color: "red" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  const avgResponseTime = summary?.averageResponseTime || 0;
  const performanceStatus = getPerformanceStatus(avgResponseTime);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Performance Monitor
          </h1>
          <p className="text-slate-400">
            Real-time API performance metrics and monitoring
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchPerformanceData}
          className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
        >
          <ArrowPathIcon className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/30 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <BoltIcon className="w-10 h-10 text-cyan-500" />
            <Tag color={performanceStatus.color}>{performanceStatus.label}</Tag>
          </div>
          <p className="text-sm text-slate-400 mb-1">Avg Response Time</p>
          <p className="text-3xl font-bold text-white mb-2">
            {avgResponseTime}ms
          </p>
          <Progress
            percent={Math.min(100, (avgResponseTime / 1000) * 100)}
            strokeColor={getResponseTimeColor(avgResponseTime)}
            showInfo={false}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <RocketLaunchIcon className="w-10 h-10 text-green-500" />
            <div className="text-right">
              <p className="text-sm text-slate-400">P95 Response</p>
              <p className="text-2xl font-bold text-white">
                {summary?.p95ResponseTime || 0}ms
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-400">
            <span>Median: {summary?.medianResponseTime || 0}ms</span>
            <span>Max: {summary?.maxResponseTime || 0}ms</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
            <div className="text-right">
              <p className="text-sm text-slate-400">Success Rate</p>
              <p className="text-3xl font-bold text-green-500">
                {summary?.successRate || 0}%
              </p>
            </div>
          </div>
          <Progress
            percent={summary?.successRate || 0}
            strokeColor="#10b981"
            showInfo={false}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <ClockIcon className="w-10 h-10 text-orange-500" />
            <div className="text-right">
              <p className="text-sm text-slate-400">Slow Requests</p>
              <p className="text-3xl font-bold text-orange-500">
                {summary?.slowRequests || 0}
              </p>
            </div>
          </div>
          <div className="text-sm text-slate-400">
            {summary?.slowRequestRate || 0}% of total requests
          </div>
        </motion.div>
      </div>

      {/* Response Time Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
      >
        <h3 className="text-xl font-bold text-white mb-4">
          24-Hour Response Time Trend
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={hourlyTrends}>
            <defs>
              <linearGradient id="responseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="hour"
              stroke="#94a3b8"
              tickFormatter={(value) =>
                new Date(value).toLocaleTimeString([], { hour: "2-digit" })
              }
            />
            <YAxis
              stroke="#94a3b8"
              label={{
                value: "Response Time (ms)",
                angle: -90,
                position: "insideLeft",
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #475569",
              }}
              labelStyle={{ color: "#e2e8f0" }}
              labelFormatter={(value) => new Date(value).toLocaleString()}
            />
            <Area
              type="monotone"
              dataKey="averageResponseTime"
              stroke="#06b6d4"
              fill="url(#responseGradient)"
              name="Avg Response Time (ms)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="endpoints"
        items={[
          {
            key: "endpoints",
            label: "📊 Endpoint Performance",
            children: (
              <div className="space-y-3">
                {endpointPerformance.map((endpoint, index) => (
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
                          <code className="text-cyan-400 font-mono">
                            {endpoint.endpoint}
                          </code>
                          <Tag
                            color={
                              getPerformanceStatus(endpoint.averageResponseTime)
                                .color
                            }
                          >
                            {endpoint.averageResponseTime}ms
                          </Tag>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <span>
                            Requests:{" "}
                            <span className="text-white font-semibold">
                              {endpoint.requestCount}
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            P95:{" "}
                            <span className="text-purple-400">
                              {endpoint.p95ResponseTime}ms
                            </span>
                          </span>
                          <span>•</span>
                          <span>
                            Slow:{" "}
                            <span className="text-orange-400">
                              {endpoint.slowRequests}
                            </span>
                          </span>
                        </div>
                      </div>
                      <Progress
                        type="circle"
                        percent={Math.min(
                          100,
                          100 - (endpoint.averageResponseTime / 1000) * 100,
                        )}
                        strokeColor={getResponseTimeColor(
                          endpoint.averageResponseTime,
                        )}
                        width={60}
                      />
                    </div>
                  </motion.div>
                ))}

                {endpointPerformance.length === 0 && (
                  <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                    <ChartBarIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <p className="text-xl text-white font-semibold mb-2">
                      No Performance Data
                    </p>
                    <p className="text-slate-400">
                      Start making API requests to see performance metrics
                    </p>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "slowest",
            label: "🐌 Slowest Endpoints",
            children: (
              <div className="space-y-3">
                {slowestEndpoints.map((endpoint, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 border-l-4 border-red-500 rounded-r-xl p-5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <code className="text-red-400 font-mono text-lg">
                          {endpoint.endpoint}
                        </code>
                        <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
                          <span>
                            Avg:{" "}
                            <span className="text-red-400 font-bold">
                              {endpoint.averageResponseTime}ms
                            </span>
                          </span>
                          <span>•</span>
                          <span>Requests: {endpoint.requestCount}</span>
                        </div>
                      </div>
                      <Tag color="red">SLOW</Tag>
                    </div>
                  </motion.div>
                ))}

                {slowestEndpoints.length === 0 && (
                  <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <p className="text-xl text-white font-semibold mb-2">
                      All Endpoints Performing Well
                    </p>
                    <p className="text-slate-400">No slow endpoints detected</p>
                  </div>
                )}
              </div>
            ),
          },
          {
            key: "errors",
            label: "⚠️ Error Analysis",
            children: (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-yellow-500/20 rounded-xl">
                      <ExclamationTriangleIcon className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">
                        Client Errors (4xx)
                      </p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {errorAnalysis?.clientErrors || 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Bad requests, unauthorized, not found, etc.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-xl">
                      <ExclamationTriangleIcon className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">
                        Server Errors (5xx)
                      </p>
                      <p className="text-2xl font-bold text-red-500">
                        {errorAnalysis?.serverErrors || 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Internal server errors, service unavailable
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-orange-500/20 rounded-xl">
                      <ClockIcon className="w-6 h-6 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">
                        Rate Limit Errors
                      </p>
                      <p className="text-2xl font-bold text-orange-500">
                        {errorAnalysis?.rateLimitErrors || 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    429 Too Many Requests
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-purple-500/20 rounded-xl">
                      <ExclamationTriangleIcon className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-400">
                        Service Unavailable
                      </p>
                      <p className="text-2xl font-bold text-purple-500">
                        {errorAnalysis?.serviceUnavailable || 0}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    503 Service Unavailable
                  </p>
                </motion.div>
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}
