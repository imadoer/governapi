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
  EyeIcon,
  XCircleIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { Select, Tag, Spin, Progress, Tabs, Empty, Badge, Switch, Tooltip, message, Button } from "antd";
import {
  LineChart,
  Line,
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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
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

export default function ThreatIntelligencePage() {
  const [timeframe, setTimeframe] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [blockingIPs, setBlockingIPs] = useState<Set<string>>(new Set());
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());

  const tenantId = "1";

  const { data, error, isLoading, mutate } = useSWR<ThreatIntelligenceData>(
    [`/api/customer/threat-intelligence?timeframe=${timeframe}`, tenantId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: autoRefresh ? 30000 : 0 }
  );

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
        // Update local state immediately
        setBlockedIPs(prev => {
          const newSet = new Set(prev);
          if (action === "block") {
            newSet.add(ip);
          } else {
            newSet.delete(ip);
          }
          return newSet;
        });

        // Show success message
        message.success({
          content: action === "block" 
            ? `✅ ${ip} blocked successfully` 
            : `✅ ${ip} unblocked successfully`,
          duration: 3,
        });

        // Refresh data from server
        mutate();
      } else {
        message.error(result.error || `Failed to ${action} IP`);
      }
    } catch (error) {
      message.error("Network error - please try again");
    } finally {
      setBlockingIPs(prev => {
        const newSet = new Set(prev);
        newSet.delete(ip);
        return newSet;
      });
    }
  };

  const isIPBlocked = (ip: string) => {
    return blockedIPs.has(ip);
  };

  const isIPBlocking = (ip: string) => {
    return blockingIPs.has(ip);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
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

  const getSeverityBadge = (severity: string) => {
    const colors = {
      CRITICAL: "red",
      HIGH: "orange",
      MEDIUM: "gold",
      LOW: "green",
    };
    return colors[severity.toUpperCase()] || "default";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="text-center">
          <Spin size="large" />
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
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold"
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <style jsx global>{`
        @keyframes neonPulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(6,182,212,0.3), 0 0 40px rgba(6,182,212,0.1);
          }
          50% {
            box-shadow: 0 0 30px rgba(6,182,212,0.5), 0 0 60px rgba(6,182,212,0.2);
          }
        }

        @keyframes statusChange {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .status-changed {
          animation: statusChange 0.6s ease-in-out;
        }

        .neon-glow {
          animation: neonPulse 3s ease-in-out infinite;
        }

        .threat-card {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(148, 163, 184, 0.1);
          transition: all 0.3s ease;
        }

        .threat-card:hover {
          border-color: rgba(6, 182, 212, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }

        .gradient-text {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 50%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

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
              <h1 className="text-5xl font-black gradient-text">
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
              <Badge
                status={autoRefresh ? "processing" : "default"}
                text={autoRefresh ? "Live" : "Paused"}
              />
              <Badge
                count={`${blockRate}% Block Rate`}
                style={{ backgroundColor: blockRate > 80 ? '#16a34a' : '#ea580c' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-700">
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                size="small"
              />
              <span className="text-sm text-slate-300">Auto-refresh</span>
            </div>

            <Select
              value={timeframe}
              onChange={setTimeframe}
              className="w-40"
              size="large"
              options={[
                { value: "1h", label: "🕐 Last Hour" },
                { value: "24h", label: "📅 Last 24h" },
                { value: "7d", label: "📊 Last 7d" },
                { value: "30d", label: "📈 Last 30d" },
              ]}
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => mutate()}
              className="p-3 bg-cyan-500 hover:bg-cyan-600 rounded-xl transition-colors neon-glow"
            >
              <ArrowPathIcon className="w-6 h-6 text-white" />
            </motion.button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-slate-800/30 border border-slate-700 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-white">{summary.totalThreats}</div>
            <div className="text-xs text-slate-400">Total Threats</div>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{summary.blockedThreats}</div>
            <div className="text-xs text-green-300">Blocked</div>
          </div>
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{summary.criticalThreats}</div>
            <div className="text-xs text-red-300">Critical</div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-orange-400">{summary.uniqueSources}</div>
            <div className="text-xs text-orange-300">Sources</div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">{Math.round(summary.averageRiskScore)}</div>
            <div className="text-xs text-purple-300">Avg Risk</div>
          </div>
        </div>
      </motion.div>

      {/* Charts - keeping your existing charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Threat Distribution Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="threat-card rounded-2xl p-6"
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
                  label={({ name, value, percent }: any) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
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
            <Empty description="No threats detected" />
          )}
        </motion.div>

        {/* Top Threat Types Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="threat-card rounded-2xl p-6"
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
            <Empty description="No threat data" />
          )}
        </motion.div>

        {/* Attack Vectors Radar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="threat-card rounded-2xl p-6"
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
            <Empty description="No attack vectors" />
          )}
        </motion.div>
      </div>

      {/* Enhanced Tabs Section with Block/Unblock */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="threat-card rounded-2xl p-6"
      >
        <Tabs
          defaultActiveKey="live-threats"
          size="large"
          items={[
            {
              key: "live-threats",
              label: (
                <span className="flex items-center gap-2">
                  <FireIcon className="w-4 h-4" />
                  Live Threats
                  <Badge count={threatIntelligence.recentBlocked.length} showZero />
                </span>
              ),
              children: (
                <div className="space-y-3">
                  <AnimatePresence>
                    {threatIntelligence.recentBlocked.length > 0 ? (
                      threatIntelligence.recentBlocked.map((threat, index) => {
                        const isBlocked = isIPBlocked(threat.source_ip);
                        const isLoading = isIPBlocking(threat.source_ip);
                        
                        return (
                          <motion.div
                            key={threat.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.03 }}
                            className={`p-5 bg-slate-800/40 border-l-4 rounded-r-2xl hover:bg-slate-700/40 transition-all ${
                              isLoading ? 'status-changed' : ''
                            }`}
                            style={{ borderLeftColor: getSeverityColor(threat.severity) }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge color={getSeverityBadge(threat.severity)}>
                                    {threat.severity}
                                  </Badge>
                                  <span className="text-white font-bold text-lg">{threat.threat_type}</span>
                                  <Tag color="blue">Risk: {Math.round(threat.risk_score)}</Tag>
                                  {isBlocked && (
                                    <Tag color="red" icon={<XCircleIcon className="w-3 h-3" />}>
                                      BLOCKED
                                    </Tag>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-slate-400">
                                  <Tooltip title="Source IP">
                                    <span className="flex items-center gap-1">
                                      <MapPinIcon className="w-4 h-4" />
                                      <code className="text-cyan-400 font-mono">{threat.source_ip}</code>
                                    </span>
                                  </Tooltip>
                                  <span>→</span>
                                  <Tooltip title="Target">
                                    <code className="text-purple-400">{threat.target_endpoint}</code>
                                  </Tooltip>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <ClockIcon className="w-4 h-4" />
                                    {new Date(threat.blocked_at).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  type={isBlocked ? "default" : "primary"}
                                  danger={!isBlocked}
                                  loading={isLoading}
                                  icon={isBlocked ? <ShieldCheckIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                  onClick={() => handleToggleBlock(threat.source_ip, isBlocked)}
                                  size="large"
                                >
                                  {isBlocked ? "Unblock" : "Block"}
                                </Button>
                              </div>
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
              ),
            },
            {
              key: "threat-sources",
              label: (
                <span className="flex items-center gap-2">
                  <GlobeAltIcon className="w-4 h-4" />
                  Threat Sources
                  <Badge count={threatIntelligence.threatSources.length} showZero />
                </span>
              ),
              children: (
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
                          className={`p-5 bg-slate-800/40 border border-slate-700 rounded-2xl hover:border-red-500/50 transition-all ${
                            isLoading ? 'status-changed' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <code className="text-xl font-mono text-red-400">{source.source_ip}</code>
                                <Badge count={`${source.threat_count} threats`} style={{ backgroundColor: '#dc2626' }} />
                                {source.country && <Tag icon={<MapPinIcon className="w-3 h-3" />}>{source.country}</Tag>}
                                {isBlocked && (
                                  <Tag color="red" icon={<XCircleIcon className="w-3 h-3" />}>
                                    BLOCKED
                                  </Tag>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                                <span>Blocked: <strong className="text-green-400">{source.blocked_count}</strong></span>
                                <span>•</span>
                                <span>Avg Risk: <strong className="text-orange-400">{Math.round(source.avg_risk_score)}</strong></span>
                                <span>•</span>
                                <span>Last: {new Date(source.last_activity).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {source.threat_types.slice(0, 4).map((type, i) => (
                                  <Tag key={i} color="red">{type}</Tag>
                                ))}
                                {source.threat_types.length > 4 && (
                                  <Tag>+{source.threat_types.length - 4} more</Tag>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                type={isBlocked ? "default" : "primary"}
                                danger={!isBlocked}
                                size="large"
                                loading={isLoading}
                                icon={isBlocked ? <ShieldCheckIcon className="w-5 h-5" /> : <XCircleIcon className="w-5 h-5" />}
                                onClick={() => handleToggleBlock(source.source_ip, isBlocked)}
                              >
                                {isBlocked ? "Unblock Source" : "Block Source"}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <Empty description="No repeat threat sources identified" />
                  )}
                </div>
              ),
            },
            {
              key: "patterns",
              label: (
                <span className="flex items-center gap-2">
                  <BoltIcon className="w-4 h-4" />
                  Threat Patterns
                  <Badge count={threatIntelligence.patterns.length} showZero />
                </span>
              ),
              children: (
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
                          <Badge status={pattern.isActive ? "processing" : "default"} text={pattern.isActive ? "Active" : "Inactive"} />
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge color={getSeverityBadge(pattern.severity)}>{pattern.severity}</Badge>
                          <Tag color="blue">{pattern.type}</Tag>
                        </div>
                        <p className="text-xs text-slate-500 mt-3">
                          Created: {new Date(pattern.createdAt).toLocaleDateString()}
                        </p>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-3">
                      <Empty description="No threat patterns detected" />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </motion.div>
    </div>
  );
}
