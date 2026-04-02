"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, Spin, Table, Button, Tag, Modal, Form, Input, Select, Switch, Space, Drawer } from "antd";
import type { TabsProps } from "antd";

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

// Interfaces
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

  const tabItems: TabsProps['items'] = [
    {
      key: 'dashboard',
      label: (
        <span className="flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4" />
          Dashboard
        </span>
      ),
      children: (
        <DashboardTab 
          stats={stats} 
          scoreDistribution={scoreDistribution} 
          hourlyTrends={hourlyTrends} 
          loading={loading}
          avgScore={avgScore}
          botDetectionRate={botDetectionRate}
        />
      ),
    },
    {
      key: 'live-threats',
      label: (
        <span className="flex items-center gap-2">
          <FireIcon className="w-4 h-4" />
          Live Threats
        </span>
      ),
      children: (
        <LiveThreatsTab 
          recentDetections={recentDetections} 
          topBotSources={topBotSources} 
          blockedIps={blockedIps}
          onBlock={handleBlockIp} 
          onUnblock={handleUnblockIp} 
          loading={loading} 
        />
      ),
    },
    {
      key: 'rules',
      label: (
        <span className="flex items-center gap-2">
          <BoltIcon className="w-4 h-4" />
          Rules & Actions
        </span>
      ),
      children: <RulesTab companyId={companyId} />,
    },
    {
      key: 'analytics',
      label: (
        <span className="flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4" />
          Analytics
        </span>
      ),
      children: (
        <AnalyticsTab 
          asnIntelligence={asnIntelligence} 
          headlessDetection={headlessDetection} 
          velocityAnalysis={velocityAnalysis} 
          crawlerVerification={crawlerVerification} 
          hourlyTrends={hourlyTrends} 
          loading={loading} 
        />
      ),
    },
    {
      key: 'reports',
      label: (
        <span className="flex items-center gap-2">
          <DocumentTextIcon className="w-4 h-4" />
          Reports
        </span>
      ),
      children: <ReportsTab companyId={companyId} stats={stats} />,
    },
  ];

  if (loading && !stats) {
    return (
      <div className="security-center-viewport">
        <div className="flex items-center justify-center min-h-screen">
          <Spin size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="security-center-viewport">
      <style jsx global>{`
        .security-center-viewport {
          min-height: 100vh;
          margin: -2rem;
          padding: 2rem;
          background: radial-gradient(120% 120% at 60% 30%, #0B1228 0%, #10172C 60%, #0A0F1E 100%);
          position: relative;
          overflow-x: hidden;
        }
        
        .security-center-viewport::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: linear-gradient(180deg, rgba(22,119,255,0.04) 0%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        .bot-protection-tabs .ant-tabs-nav {
          background: rgba(20, 25, 40, 0.65);
          backdrop-filter: blur(20px);
          padding: 0 1.5rem;
          border-radius: 1rem 1rem 0 0;
          border: 1px solid rgba(255,255,255,0.04);
        }

        .bot-protection-tabs .ant-tabs-tab {
          color: #94a3b8;
          font-weight: 500;
        }

        .bot-protection-tabs .ant-tabs-tab-active {
          color: #06b6d4 !important;
        }

        .bot-protection-tabs .ant-tabs-ink-bar {
          background: #06b6d4;
        }

        /* Table Styling */
        .ant-table {
          background: transparent !important;
        }
        .ant-table-thead > tr > th {
          background: rgba(11, 22, 40, 0.8) !important;
          border-bottom: 1px solid rgba(6, 182, 212, 0.2) !important;
          color: #94a3b8 !important;
        }
        .ant-table-tbody > tr > td {
          background: rgba(11, 22, 40, 0.4) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
        }
        .ant-table-tbody > tr:hover > td {
          background: rgba(6, 182, 212, 0.1) !important;
        }
        .ant-table-tbody > tr.ant-table-row-selected > td {
          background: rgba(6, 182, 212, 0.15) !important;
        }
        .ant-table-placeholder {
          background: rgba(11, 22, 40, 0.4) !important;
        }
        .ant-table-cell-row-hover {
          background: rgba(6, 182, 212, 0.1) !important;
        }
        .ant-empty-description {
          color: #94a3b8 !important;
        }
        .bot-protection-tabs .ant-tabs-content {
          padding: 2rem 0;
        }
        /* Modal Dark Theme */
        .ant-modal-content {
          background: #0b1628 !important;
          border: 1px solid rgba(6, 182, 212, 0.2) !important;
          border-radius: 16px !important;
        }
        .ant-modal-header {
          background: transparent !important;
          border-bottom: 1px solid rgba(6, 182, 212, 0.1) !important;
        }
        .ant-modal-title {
          color: #E8F0FF !important;
        }
        .ant-modal-close-x {
          color: #94a3b8 !important;
        }
        .ant-modal-body {
          background: transparent !important;
        }
        .ant-modal-footer {
          border-top: 1px solid rgba(6, 182, 212, 0.1) !important;
        }
        /* Form Dark Theme */
        .ant-form-item-label > label {
          color: #E8F0FF !important;
        }
        .ant-input, .ant-input-textarea textarea, .ant-select-selector {
          background: rgba(11, 22, 40, 0.8) !important;
          border: 1px solid rgba(6, 182, 212, 0.2) !important;
          color: #E8F0FF !important;
        }
        .ant-input::placeholder, .ant-input-textarea textarea::placeholder {
          color: #64748b !important;
        }
        .ant-select-arrow {
          color: #94a3b8 !important;
        }
        .ant-select-dropdown {
          background: #0b1628 !important;
          border: 1px solid rgba(6, 182, 212, 0.2) !important;
        }
        .ant-select-item {
          color: #E8F0FF !important;
        }
        .ant-select-item-option-active, .ant-select-item-option-selected {
          background: rgba(6, 182, 212, 0.2) !important;
        }
        /* Template Cards Dark Theme */
        .ant-card {
          background: rgba(11, 22, 40, 0.9) !important;
          border: 1px solid rgba(6, 182, 212, 0.2) !important;
        }
        .ant-card:hover {
          border-color: rgba(6, 182, 212, 0.5) !important;
        }
      `}</style>

      <div className="relative z-10">
        {/* HEADER */}
        <div
          className="relative w-full px-6 py-6 mb-8"
          style={{
            background:
              "transparent",
          }}
        >
          

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
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
            className="bot-protection-tabs"
          />
        </div>
      </div>
    </div>
  );
}

// TAB 1: DASHBOARD
function DashboardTab({ stats, scoreDistribution, hourlyTrends, loading, avgScore, botDetectionRate }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* KPI GRID - 2x2 */}
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

// TAB 2: LIVE THREATS
function LiveThreatsTab({ recentDetections, topBotSources, blockedIps, onBlock, onUnblock, loading }: any) {
  const [selectedThreat, setSelectedThreat] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Auto-refresh indicator
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

  const columns = [
    {
      title: 'Time',
      dataIndex: 'detectedAt',
      key: 'detectedAt',
      width: 120,
      render: (text: string) => (
        <span className="text-slate-300">
          {new Date(text).toLocaleTimeString()}
        </span>
      ),
    },
    {
      title: 'Source IP',
      dataIndex: 'sourceIp',
      key: 'sourceIp',
      width: 150,
      render: (ip: string) => <span className="font-mono text-cyan-400 font-semibold">{ip}</span>,
    },
    {
      title: 'Threat Type',
      dataIndex: 'detectionReason',
      key: 'detectionReason',
      render: (reason: string) => <span className="text-slate-200">{reason}</span>,
    },
    {
      title: 'Confidence',
      dataIndex: 'confidenceScore',
      key: 'confidenceScore',
      width: 120,
      sorter: (a: any, b: any) => b.confidenceScore - a.confidenceScore,
      render: (score: number) => (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getSeverityColor(score) }} />
          <Tag
            style={{
              backgroundColor: `${getSeverityColor(score)}20`,
              color: getSeverityColor(score),
              border: "none",
              fontWeight: 600,
            }}
          >
            {score}%
          </Tag>
        </div>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_: any, record: any) => {
        const isBlocked = blockedIps.has(record.sourceIp);
        return (
          <Tag color={isBlocked ? "red" : "orange"}>
            {isBlocked ? "BLOCKED" : "DETECTED"}
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => {
        const isBlocked = blockedIps.has(record.sourceIp);
        return (
          <Space>
            {!isBlocked ? (
              <Button
                size="small"
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  onBlock(record.sourceIp);
                }}
              >
                Block
              </Button>
            ) : (
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnblock(record.sourceIp);
                }}
              >
                Unblock
              </Button>
            )}
            <Button
              size="small"
              type="primary"
              onClick={(e) => {
                e.stopPropagation();
                handleRowClick(record);
              }}
            >
              Investigate
            </Button>
          </Space>
        );
      },
    },
  ];

  const rowSelection = {
    selectedRowKeys: selectedRows.map((r) => r.id),
    onChange: (_: any, selectedRowsData: any[]) => {
      setSelectedRows(selectedRowsData);
    },
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
            <Tag color="red">{recentDetections.length} threats</Tag>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button
              size="small"
              type={autoRefresh ? "primary" : "default"}
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Button>
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
              <Space>
                <Button danger onClick={handleBulkBlock}>
                  Block Selected
                </Button>
                <Button onClick={handleBulkUnblock}>Unblock Selected</Button>
                <Button onClick={() => setSelectedRows([])}>Clear</Button>
              </Space>
            </div>
          </motion.div>
        )}

        <Table
          columns={columns}
          dataSource={recentDetections}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} threats`,
          }}
          rowSelection={rowSelection}
          onRow={(record) => ({
            onClick: () => handleRowClick(record),
            style: { cursor: 'pointer' },
            className: "hover:bg-cyan-400/5 transition-colors",
          })}
          scroll={{ x: 1000 }}
        />
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
      <Drawer
        title="Threat Investigation"
        placement="right"
        width={720}
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
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
                <Tag
                  style={{
                    backgroundColor: `${getSeverityColor(selectedThreat.confidenceScore)}20`,
                    color: getSeverityColor(selectedThreat.confidenceScore),
                    border: "none",
                    fontSize: 14,
                    padding: "4px 12px",
                    fontWeight: 600,
                  }}
                >
                  {selectedThreat.confidenceScore >= 80 ? "CRITICAL" : selectedThreat.confidenceScore >= 60 ? "HIGH" : "MEDIUM"}
                </Tag>
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
                  <Tag color={blockedIps.has(selectedThreat.sourceIp) ? "red" : "orange"}>
                    {blockedIps.has(selectedThreat.sourceIp) ? "BLOCKED" : "DETECTED"}
                  </Tag>
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
              <Space size="middle" style={{ width: "100%" }}>
                {!blockedIps.has(selectedThreat.sourceIp) ? (
                  <Button danger size="large" block onClick={() => onBlock(selectedThreat.sourceIp)}>
                    Block This IP
                  </Button>
                ) : (
                  <Button size="large" block onClick={() => onUnblock(selectedThreat.sourceIp)}>
                    Unblock This IP
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// TAB 3: RULES
function RulesTab({ companyId }: { companyId: string }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [templatesVisible, setTemplatesVisible] = useState(false);
  const [form] = Form.useForm();

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

  const handleCreateRule = async (values: any) => {
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
        form.resetFields();
        fetchRules();
      }
    } catch (error) {
      console.error("Failed to create/update rule:", error);
    }
  };

  const handleToggleRule = async (ruleId: number, enabled: boolean) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;

      await fetch("/api/customer/bot-rules", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          action: "block", ...rule, id: ruleId, enabled }),
      });
      fetchRules();
    } catch (error) {
      console.error("Failed to toggle rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId: number) => {
    Modal.confirm({
      title: "Delete Rule",
      content: "Are you sure you want to delete this rule?",
      okText: "Delete",
      okType: "danger",
      onOk: async () => {
        try {
          await fetch(`/api/customer/bot-rules?id=${ruleId}`, {
            method: "POST",
            headers: { "x-tenant-id": companyId },
          });
          fetchRules();
        } catch (error) {
          console.error("Failed to delete rule:", error);
        }
      },
    });
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
    form.setFieldsValue({
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
      case "BLOCK": return "red";
      case "CHALLENGE": return "orange";
      case "MONITOR": return "blue";
      case "ALLOW": return "green";
      default: return "default";
    }
  };

  const columns = [
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      sorter: (a: any, b: any) => b.priority - a.priority,
      render: (priority: number) => (
        <Tag color="cyan" style={{ fontWeight: 600, fontSize: 14 }}>
          {priority}
        </Tag>
      ),
    },
    {
      title: "Rule Name",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: any) => (
        <div>
          <div className="font-semibold text-white mb-1">{name}</div>
          {record.description && (
            <div className="text-xs text-slate-400">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      width: 120,
      render: (action: string) => (
        <Tag color={getActionColor(action)} style={{ fontWeight: 600 }}>
          {action}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "enabled",
      key: "enabled",
      width: 100,
      render: (enabled: boolean, record: any) => (
        <Switch
          checked={enabled}
          onChange={(checked) => handleToggleRule(record.id, checked)}
          checkedChildren="ON"
          unCheckedChildren="OFF"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 180,
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" onClick={() => handleTestRule(record)}>
            Test
          </Button>
          <Button size="small" onClick={() => {
            setEditingRule(record);
            form.setFieldsValue(record);
            setModalVisible(true);
          }}>
            Edit
          </Button>
          <Button size="small" danger onClick={() => handleDeleteRule(record.id)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-semibold text-[#E8F0FF] mb-2">Bot Detection Rules</h3>
          <p className="text-sm text-slate-400">Configure automated rules to detect and block bot traffic</p>
        </div>
        <Space>
          <Button onClick={() => setTemplatesVisible(true)}>
            Rule Templates
          </Button>
          <Button
            type="primary"
            onClick={() => {
              setEditingRule(null);
              form.resetFields();
              setModalVisible(true);
            }}
            size="large"
          >
            Create Rule
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Total Rules</div>
          <div className="text-3xl font-bold text-white">{rules.length}</div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Active Rules</div>
          <div className="text-3xl font-bold text-green-400">
            {rules.filter(r => r.enabled).length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Blocking Rules</div>
          <div className="text-3xl font-bold text-red-400">
            {rules.filter(r => r.action === "BLOCK" && r.enabled).length}
          </div>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="text-sm text-slate-400 mb-1">Challenge Rules</div>
          <div className="text-3xl font-bold text-orange-400">
            {rules.filter(r => r.action === "CHALLENGE" && r.enabled).length}
          </div>
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <Table
          columns={columns}
          dataSource={rules}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </GlassCard>

      <Modal
        title={editingRule ? "Edit Rule" : "Create Bot Detection Rule"}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingRule(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateRule}>
          <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}>
            <Input placeholder="e.g., Block Datacenter IPs" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Describe what this rule does..." />
          </Form.Item>
          <Form.Item name="action" label="Action" rules={[{ required: true }]} initialValue="BLOCK">
            <Select>
              <Select.Option value="BLOCK">Block</Select.Option>
              <Select.Option value="CHALLENGE">Challenge</Select.Option>
              <Select.Option value="MONITOR">Monitor</Select.Option>
              <Select.Option value="ALLOW">Allow</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="Priority" initialValue={50}>
            <Input type="number" placeholder="0-100" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Rule Templates"
        open={templatesVisible}
        onCancel={() => setTemplatesVisible(false)}
        footer={null}
        width={700}
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
              <Space>
                <Tag color={getActionColor(template.action)}>{template.action}</Tag>
                <Tag>Priority: {template.priority}</Tag>
              </Space>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        title="Rule Test Results"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTestModalVisible(false)}>
            Close
          </Button>,
        ]}
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
      </Modal>
    </div>
  );
}

// TAB 4: ANALYTICS
function AnalyticsTab({ asnIntelligence, headlessDetection, velocityAnalysis, crawlerVerification, hourlyTrends, loading }: any) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" />
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

// TAB 5: REPORTS
function ReportsTab({ companyId, stats }: any) {
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportPDF = async () => {
    setExportLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate simple CSV as fallback for now
      const csvData = [
        ['Metric', 'Value'],
        ['Total Requests', stats?.totalRequests || 0],
        ['Bot Requests', stats?.botRequests || 0],
        ['Blocked Requests', stats?.blockedRequests || 0],
        ['Detection Rate', `${stats?.botDetectionRate || 0}%`],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bot-Protection-Report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setExportLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const csvData = [
        ['Metric', 'Value'],
        ['Total Requests', stats?.totalRequests || 0],
        ['Bot Requests', stats?.botRequests || 0],
        ['Blocked Requests', stats?.blockedRequests || 0],
        ['Detection Rate', `${stats?.botDetectionRate || 0}%`],
        ['Unique IPs', stats?.uniqueIps || 0],
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bot-Protection-Data-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('CSV export error:', error);
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
            <Button
              type="primary"
              danger
              size="large"
              block
              loading={exportLoading}
              onClick={handleExportPDF}
            >
              Generate PDF
            </Button>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="text-center">
            <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <h4 className="text-lg font-semibold text-white mb-2">Export CSV Data</h4>
            <p className="text-sm text-slate-400 mb-4">
              Raw data for analysis in Excel
            </p>
            <Button
              type="primary"
              size="large"
              block
              loading={exportLoading}
              onClick={handleExportCSV}
              style={{ background: "#22c55e", borderColor: "#22c55e" }}
            >
              Generate CSV
            </Button>
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
    score >= 80 ? "#ff5b67" :
    score >= 60 ? "#ffb35b" :
    score >= 40 ? "#ffdd6b" :
    "#00e7b7";

  const data = [{ name: "Score", value: score, fill: gaugeColor }];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
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
              <RadialBar
                background
                dataKey="value"
                cornerRadius={15}
                fill={gaugeColor}
              />
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
          <h3 className="text-lg font-semibold text-[#E8F0FF]">
            Threat Score Distribution
          </h3>
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
              <div className="text-sm font-semibold mb-1 text-[#E8F0FF]">
                {item.level}
              </div>
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
          <h3 className="text-lg font-semibold text-[#E8F0FF]">
            24-Hour Activity Timeline
          </h3>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <GlassCard className="p-6 relative overflow-hidden h-full">
        <div className="absolute right-0 bottom-0 opacity-5">
          <GlobeAltIcon className="w-48 h-48" />
        </div>

        <div className="flex items-center gap-3 mb-4 relative z-10">
          <GlobeAltIcon
            className="w-6 h-6"
            style={{ color: "#00e1b0", filter: "drop-shadow(0 0 8px #00e1b080)" }}
          />
          <h3 className="text-lg font-semibold text-[#E8F0FF]">
            ASN Intelligence
          </h3>
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
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
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
                    <span className="text-sm font-semibold text-[#E8F0FF]">
                      {item.value}
                    </span>
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
          <h3 className="text-lg font-semibold text-[#E8F0FF]">
            Crawler Verification
          </h3>
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
            <CheckCircleIcon
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "#00e7b7" }}
            />
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
            <NoSymbolIcon
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "#ff5b67" }}
            />
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
              <span className="font-semibold text-[#E8F0FF]">
                {stats.googlebot_count || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300/85">Bingbot</span>
              <span className="font-semibold text-[#E8F0FF]">
                {stats.bingbot_count || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-300/85">DuckDuckBot</span>
              <span className="font-semibold text-[#E8F0FF]">
                {stats.duckduckbot_count || 0}
              </span>
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
