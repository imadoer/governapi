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
import { Select, Tag, Spin, Progress, Tabs, Empty, Button, message, Badge, Tooltip, Table, DatePicker, Space } from "antd";
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

const { Option } = Select;
const { RangePicker } = DatePicker;

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

export function ThreatIntelligencePage({ companyId }: { companyId: string }) {
  const [timeframe, setTimeframe] = useState("24h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [blockingIPs, setBlockingIPs] = useState<Set<string>>(new Set());
  const [blockedIPs, setBlockedIPs] = useState<Set<string>>(new Set());
  
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<any>(null);

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

        message.success({
          content: action === "block" 
            ? `✅ ${ip} blocked successfully` 
            : `✅ ${ip} unblocked - traffic allowed`,
          duration: 3,
        });

        mutate();
        mutateAudit();
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
      message.success('Threats exported as JSON');
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
      message.success('Threats exported as CSV');
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

  const auditColumns = [
    {
      title: 'IP Address',
      dataIndex: 'ip_address',
      key: 'ip_address',
      render: (ip: string) => <code className="text-cyan-400 font-mono text-sm">{ip}</code>
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (action: string) => (
        <Tag color={action === 'block' ? 'red' : 'green'}>
          {action.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (user: string) => <span className="text-slate-300">{user || 'System'}</span>
    },
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp: string) => (
        <span className="text-slate-400 text-sm">
          {new Date(timestamp).toLocaleString()}
        </span>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="text-center py-16">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Failed to load threat data</h3>
        <p className="text-slate-400 mb-4">Please try again later</p>
        <Button onClick={() => mutate()} icon={<ArrowPathIcon className="w-4 h-4" />}>
          Retry
        </Button>
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
        
        /* Dark Select Styling */
        .dark-select .ant-select-selector {
          background-color: #2d3748 !important;
          color: #e2e8f0 !important;
          border-color: #334155 !important;
        }
        .dark-select .ant-select-arrow {
          color: #94a3b8 !important;
        }
        .dark-select:hover .ant-select-selector {
          background-color: #2d3748 !important;
          border-color: #475569 !important;
        }
        .ant-select-dropdown {
          background-color: #2d3748 !important;
        }
        .ant-select-item {
          color: #e2e8f0 !important;
        }
        .ant-select-item-option-selected {
          background-color: #2d3748 !important;
        }
        .ant-select-item-option-active {
          background-color: #334155 !important;
        }
        
        /* Ant Design Tabs & Table Styling */
        .ant-tabs-nav {
          background-color: transparent !important;
        }
        .ant-tabs-tab {
          color: #94a3b8 !important;
        }
        .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #06b6d4 !important;
        }
        .ant-tabs-ink-bar {
          background: #06b6d4 !important;
        }
        
        .audit-table .ant-table {
          background-color: transparent !important;
        }
        .audit-table .ant-table-thead > tr > th {
          background-color: #2d3748 !important;
          color: #e2e8f0 !important;
          border-bottom: 1px solid #475569 !important;
        }
        .audit-table .ant-table-tbody > tr > td {
          background-color: #2d3748 !important;
          border-bottom: 1px solid #334155 !important;
          color: #cbd5e1 !important;
        }
        .audit-table .ant-table-tbody > tr:hover > td {
          background-color: #2d3748 !important;
        }
      `}</style>

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
          {/* Export Buttons - Dark Styled */}
          <Button
            type="default"
            className="!bg-[#2d3748] !text-gray-200 !border-gray-600 hover:!bg-[#2d3748] hover:!border-gray-500 transition-all"
            icon={<ArrowDownTrayIcon className="w-4 h-4" />}
            onClick={() => handleExport('csv')}
          >
            Export CSV
          </Button>
          <Button
            type="default"
            className="!bg-[#2d3748] !text-gray-200 !border-gray-600 hover:!bg-[#2d3748] hover:!border-gray-500 transition-all"
            icon={<DocumentTextIcon className="w-4 h-4" />}
            onClick={() => handleExport('json')}
          >
            Export JSON
          </Button>

          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            Auto-refresh
          </label>

          {/* Timeframe Select - Dark Styled */}
          <Select
            value={timeframe}
            onChange={setTimeframe}
            className="dark-select"
            style={{ width: 120 }}
            dropdownStyle={{ backgroundColor: '#0f172a' }}
          >
            <Option value="1h">Last Hour</Option>
            <Option value="24h">Last 24h</Option>
            <Option value="7d">Last 7d</Option>
            <Option value="30d">Last 30d</Option>
          </Select>

          {/* Refresh Button - Cyan Accent */}
          <Button
            onClick={() => {
              mutate();
              mutateStats();
              mutateAudit();
            }}
            className="!bg-[#00C2FF] !text-white hover:!bg-[#00A8E8] !border-[#00C2FF] hover:!border-[#00A8E8] transition-all"
            icon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Filter Bar - Dark Styled */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 border border-slate-700 rounded-xl p-4"
      >
        <div className="flex items-center gap-4">
          <FunnelIcon className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-semibold text-slate-300">Filters:</span>
          
          <Select
            value={severityFilter}
            onChange={setSeverityFilter}
            className="dark-select"
            style={{ width: 150 }}
            placeholder="Severity"
            dropdownStyle={{ backgroundColor: '#0f172a' }}
          >
            <Option value="all">All Severities</Option>
            <Option value="critical">Critical</Option>
            <Option value="high">High</Option>
            <Option value="medium">Medium</Option>
            <Option value="low">Low</Option>
          </Select>

          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="dark-select"
            style={{ width: 150 }}
            placeholder="Status"
            dropdownStyle={{ backgroundColor: '#0f172a' }}
          >
            <Option value="all">All Status</Option>
            <Option value="blocked">Blocked</Option>
            <Option value="active">Active</Option>
          </Select>

          <Button 
            size="small"
            className="!bg-[#2d3748] !text-gray-200 !border-gray-600 hover:!bg-[#2d3748] transition-all"
            onClick={() => {
              setSeverityFilter("all");
              setStatusFilter("all");
              setDateRange(null);
            }}
          >
            Clear Filters
          </Button>

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
          className={`bg-gradient-to-br ${getSeverityGradient("critical")} border rounded-2xl p-6 slide-in`}
        >
          <div className="flex items-center justify-between mb-4">
            <FireIcon className="w-10 h-10 text-red-500" />
            <div className="text-right">
              <p className="text-sm text-red-300 font-semibold">Critical Threats</p>
              <p className="text-4xl font-black text-red-500">{summary.criticalThreats}</p>
            </div>
          </div>
          <Progress percent={100} strokeColor="#dc2626" showInfo={false} strokeWidth={6} />
          <p className="text-xs text-red-300 mt-2">⚠️ Requires immediate attention</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`bg-gradient-to-br ${getSeverityGradient("low")} border rounded-2xl p-6 slide-in`}
        >
          <div className="flex items-center justify-between mb-4">
            <ShieldExclamationIcon className="w-10 h-10 text-green-500" />
            <div className="text-right">
              <p className="text-sm text-green-300 font-semibold">Blocked</p>
              <p className="text-4xl font-black text-green-500">{summary.blockedThreats}</p>
            </div>
          </div>
          <Progress percent={Math.round((summary.blockedThreats / summary.totalThreats) * 100)} strokeColor="#16a34a" showInfo={false} strokeWidth={6} />
          <p className="text-xs text-green-300 mt-2">✅ Threats blocked automatically</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${getSeverityGradient("high")} border rounded-2xl p-6 slide-in`}
        >
          <div className="flex items-center justify-between mb-4">
            <GlobeAltIcon className="w-10 h-10 text-orange-500" />
            <div className="text-right">
              <p className="text-sm text-orange-300 font-semibold">Threat Sources</p>
              <p className="text-4xl font-black text-orange-500">{summary.uniqueSources}</p>
            </div>
          </div>
          <p className="text-xs text-orange-300">🌍 Unique attacker IPs</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-900/5 border border-purple-500/30 rounded-2xl p-6 slide-in"
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
          <Progress
            percent={summary.averageRiskScore}
            strokeColor="#a855f7"
            showInfo={false}
            strokeWidth={6}
          />
        </motion.div>
      </div>

      {/* Charts - keeping existing layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-[#0f172a]/60 border border-slate-700 rounded-2xl p-6"
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
            <Empty description="No threats detected" />
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-[#0f172a]/60 border border-slate-700 rounded-2xl p-6"
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
            <Empty description="No threat data" />
          )}
        </motion.div>

        {threatIntelligence.attackVectors && threatIntelligence.attackVectors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-[#0f172a]/60 border border-slate-700 rounded-2xl p-6"
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
        className="bg-[#0f172a]/60 border border-slate-700 rounded-2xl p-6"
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
          <Empty description="No trend data" />
        )}
      </motion.div>

      {/* Tabs - keeping existing functionality */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-[#0f172a]/60 border border-slate-700 rounded-2xl p-6"
      >
        <Tabs
          defaultActiveKey="live-threats"
          items={[
            {
              key: "live-threats",
              label: "🔴 Live Threats",
              children: (
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
                            style={{ backgroundColor: "rgba(55, 65, 81, 0.9)" }} className={`border border-slate-600 rounded-xl p-4 ${
                              isLoading ? 'status-changing' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Tag color={getSeverityColor(threat.severity)}>
                                    {threat.severity}
                                  </Tag>
                                  <span className="text-white font-bold">{threat.threat_type}</span>
                                  <Tag color="blue">Risk: {Math.round(threat.risk_score)}</Tag>
                                  {isBlocked && (
                                    <Badge status="error" text="BLOCKED" />
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
                                <Button
                                  type={isBlocked ? "default" : "primary"}
                                  danger={!isBlocked}
                                  loading={isLoading}
                                  icon={isBlocked ? <ShieldCheckIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                  onClick={() => handleToggleBlock(threat.source_ip, isBlocked)}
                                >
                                  {isBlocked ? "Unblock" : "Block"}
                                </Button>
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
              ),
            },
            {
              key: "threat-sources",
              label: "🌐 Threat Sources",
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
                          style={{ backgroundColor: "rgba(55, 65, 81, 0.9)" }} className={`border border-slate-600 rounded-xl p-4 ${
                            isLoading ? 'status-changing' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <code className="text-lg font-mono text-red-400">{source.source_ip}</code>
                                <Tag color="red">{source.threat_count} threats</Tag>
                                {isBlocked && (
                                  <Badge status="error" text="BLOCKED" />
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
                                  <Tag key={i} className="text-xs">
                                    {type}
                                  </Tag>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                type={isBlocked ? "default" : "primary"}
                                danger={!isBlocked}
                                loading={isLoading}
                                icon={isBlocked ? <ShieldCheckIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                onClick={() => handleToggleBlock(source.source_ip, isBlocked)}
                              >
                                {isBlocked ? "Unblock" : "Block Source"}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <Empty description="No threat sources identified" className="py-16" />
                  )}
                </div>
              ),
            },
            {
              key: "patterns",
              label: "🧬 Threat Patterns",
              children: (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {threatIntelligence.patterns.length > 0 ? (
                    threatIntelligence.patterns.map((pattern, index) => (
                      <motion.div
                        key={pattern.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ backgroundColor: "rgba(55, 65, 81, 0.8)" }} className="border border-slate-600 rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-white font-semibold">{pattern.name}</h4>
                          <Tag color={pattern.isActive ? "green" : "red"}>
                            {pattern.isActive ? "Active" : "Inactive"}
                          </Tag>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-slate-400">
                          <Tag color={getSeverityColor(pattern.severity)}>{pattern.severity}</Tag>
                          <span className="capitalize">{pattern.type}</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-2">
                      <Empty description="No threat patterns detected" className="py-16" />
                    </div>
                  )}
                </div>
              ),
            },
            {
              key: "audit-log",
              label: "📋 Audit Log",
              children: (
                <div className="slide-in">
                  <Table
                    dataSource={auditData?.logs || []}
                    columns={auditColumns}
                    pagination={{ pageSize: 10 }}
                    loading={!auditData}
                    rowKey="id"
                    className="audit-table"
                  />
                </div>
              ),
            },
          ]}
        />
      </motion.div>
    </div>
  );
}

