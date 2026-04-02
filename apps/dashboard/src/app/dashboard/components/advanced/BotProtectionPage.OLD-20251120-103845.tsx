"use client";

import { useState, useEffect } from "react";
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
} from "@heroicons/react/24/outline";
import { Card, Progress, Tag, Spin, Tooltip, Modal } from "antd";
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

// Enterprise Color Palette
const COLORS = {
  primaryBlue: "#2F81F7",
  deepNavy: "#0A1A2F",
  cyberTeal: "#00B3B0",
  threatRed: "#FF4F4F",
  warningOrange: "#FF9F43",
  securityPurple: "#7C3AED",
  backgroundDark: "#0A0F1A",
  panelBackground: "#101825",
  textPrimary: "#E8ECF4",
  textSecondary: "#9BA8C1",
  success: "#10B981",
  chartColors: ["#2F81F7", "#00B3B0", "#7C3AED", "#FF9F43", "#FF4F4F"],
};

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

export function BotProtectionPage({ companyId }: { companyId: string }) {
  const [stats, setStats] = useState<BotStatistics | null>(null);
  const [recentDetections, setRecentDetections] = useState<BotDetection[]>([]);
  const [topBotSources, setTopBotSources] = useState<any[]>([]);
  const [hourlyTrends, setHourlyTrends] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  
  // Enterprise data states
  const [asnIntelligence, setAsnIntelligence] = useState<AsnIntelligence | null>(null);
  const [headlessDetection, setHeadlessDetection] = useState<HeadlessDetection | null>(null);
  const [velocityAnalysis, setVelocityAnalysis] = useState<VelocityAnalysis | null>(null);
  const [crawlerVerification, setCrawlerVerification] = useState<CrawlerVerification | null>(null);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution | null>(null);
  
  // Modal state for drill-down
  const [selectedDetection, setSelectedDetection] = useState<BotDetection | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchBotData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/customer/bot-detection", {
        headers: {
          "x-tenant-id": companyId,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.botDetection.statistics);
        setRecentDetections(data.botDetection.recentDetections || []);
        setTopBotSources(data.botDetection.topBotSources || []);
        setHourlyTrends(data.botDetection.hourlyTrends || []);
        
        // Enterprise data
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

  useEffect(() => {
    if (companyId) {
      fetchBotData();
      const interval = setInterval(fetchBotData, 30000);
      return () => clearInterval(interval);
    }
  }, [companyId]);

  const handleBlockIp = async (ip: string) => {
    try {
      const response = await fetch("/api/customer/block-ip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          ipAddress: ip,
          reason: "Manual block from Bot Protection",
        }),
      });

      if (response.ok) {
        setBlockedIps(prev => new Set(prev).add(ip));
        fetchBotData();
      }
    } catch (error) {
      console.error("Failed to block IP:", error);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    try {
      const response = await fetch(`/api/customer/block-ip?ip=${ip}`, {
        method: "DELETE",
        headers: {
          "x-tenant-id": companyId,
        },
      });

      if (response.ok) {
        setBlockedIps(prev => {
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

  const openDetectionModal = (detection: BotDetection) => {
    setSelectedDetection(detection);
    setModalVisible(true);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: COLORS.backgroundDark }}>
        <Spin size="large" />
      </div>
    );
  }

  const avgScore = scoreDistribution?.avg_score || 0;
  const botDetectionRate = stats?.botDetectionRate || 0;
  const blockRate = stats?.blockRate || 0;

  return (
    <div className="min-h-screen p-6" style={{ background: COLORS.backgroundDark }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: COLORS.textPrimary }}>
            🛡️ Bot Protection Command Center
          </h1>
          <p style={{ color: COLORS.textSecondary }}>
            Enterprise-Grade Threat Detection & Response
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={fetchBotData}
          className="p-4 rounded-xl transition-all shadow-lg"
          style={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.primaryBlue}` }}
        >
          <ArrowPathIcon className="w-6 h-6" style={{ color: COLORS.primaryBlue }} />
        </motion.button>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard
          title="Total Bot Requests"
          value={stats?.botRequests || 0}
          icon={<BugAntIcon className="w-8 h-8" style={{ color: COLORS.warningOrange }} />}
          trend="+12%"
          color={COLORS.warningOrange}
        />
        <StatsCard
          title="Blocked Threats"
          value={stats?.blockedRequests || 0}
          icon={<ShieldExclamationIcon className="w-8 h-8" style={{ color: COLORS.threatRed }} />}
          trend="+8%"
          color={COLORS.threatRed}
        />
        <StatsCard
          title="Unique IPs"
          value={stats?.uniqueIps || 0}
          icon={<GlobeAltIcon className="w-8 h-8" style={{ color: COLORS.cyberTeal }} />}
          trend="+5%"
          color={COLORS.cyberTeal}
        />
        <StatsCard
          title="Detection Rate"
          value={`${botDetectionRate}%`}
          icon={<ChartBarIcon className="w-8 h-8" style={{ color: COLORS.success }} />}
          trend="+3%"
          color={COLORS.success}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Unified Bot Score Gauge */}
        <UnifiedScoreGauge score={avgScore} />

        {/* ASN Intelligence */}
        <AsnIntelligencePanel data={asnIntelligence} />

        {/* Headless Detection */}
        <HeadlessDetectionPanel data={headlessDetection} />
      </div>

      {/* Velocity & Crawler Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <VelocityPanel data={velocityAnalysis} trends={hourlyTrends} />
        <CrawlerVerificationPanel data={crawlerVerification} />
      </div>

      {/* Score Distribution Heatmap */}
      <ScoreDistributionHeatmap distribution={scoreDistribution} />

      {/* Recent Bot Events Table */}
      <BotEventsTable
        detections={recentDetections}
        onBlock={handleBlockIp}
        onUnblock={handleUnblockIp}
        blockedIps={blockedIps}
        onRowClick={openDetectionModal}
      />

      {/* Detection Drill-Down Modal */}
      <DetectionModal
        visible={modalVisible}
        detection={selectedDetection}
        onClose={() => setModalVisible(false)}
        onBlock={handleBlockIp}
        onUnblock={handleUnblockIp}
        isBlocked={selectedDetection ? blockedIps.has(selectedDetection.sourceIp) : false}
      />
    </div>
  );
}

// Subcomponents continue in next part...

// ========== SUBCOMPONENTS ==========

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend: string;
  color: string;
}

function StatsCard({ title, value, icon, trend, color }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl shadow-lg"
      style={{ background: COLORS.panelBackground, border: `1px solid ${color}20` }}
    >
      <div className="flex items-center justify-between mb-3 px-4 pt-2">
        <div className="p-3 rounded-lg" style={{ background: `${color}20` }}>
          {icon}
        </div>
        <span className="text-sm font-semibold" style={{ color: COLORS.success }}>
          {trend}
        </span>
      </div>
      <h3 className="text-3xl font-bold mb-1" style={{ color: COLORS.textPrimary }}>
        {value}
      </h3>
      <p className="text-sm" style={{ color: COLORS.textSecondary }}>
        {title}
      </p>
    </motion.div>
  );
}

function UnifiedScoreGauge({ score }: { score: number }) {
  const data = [
    {
      name: "Score",
      value: score,
      fill: score >= 80 ? COLORS.threatRed : score >= 60 ? COLORS.warningOrange : score >= 40 ? COLORS.warningOrange : COLORS.success,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-xl shadow-lg"
      style={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.primaryBlue}30` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheckIcon className="w-6 h-6" style={{ color: COLORS.primaryBlue }} />
        <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          Unified Bot Score
        </h3>
      </div>
      
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="90%"
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <RadialBar
              background
              dataKey="value"
              cornerRadius={10}
            />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-4xl font-bold"
              fill={COLORS.textPrimary}
            >
              {Math.round(score)}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex justify-between mt-4 text-sm">
        <span style={{ color: COLORS.textSecondary }}>Risk Level</span>
        <span className="font-semibold" style={{
          color: score >= 80 ? COLORS.threatRed : score >= 60 ? COLORS.warningOrange : COLORS.success
        }}>
          {score >= 80 ? "CRITICAL" : score >= 60 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW"}
        </span>
      </div>
    </motion.div>
  );
}

function AsnIntelligencePanel({ data }: { data: AsnIntelligence | null }) {
  const topAsn = data?.topDatacenterAsns?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-xl shadow-lg"
      style={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.cyberTeal}30` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <GlobeAltIcon className="w-6 h-6" style={{ color: COLORS.cyberTeal }} />
        <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          ASN Intelligence
        </h3>
      </div>

      {topAsn ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm mb-1" style={{ color: COLORS.textSecondary }}>
              Top Threat ASN
            </p>
            <p className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
              {topAsn.asn_org || "Unknown"}
            </p>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              {topAsn.asn_number}
            </p>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: `${COLORS.threatRed}20` }}>
            <div>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>Attack Count</p>
              <p className="text-2xl font-bold" style={{ color: COLORS.threatRed }}>
                {topAsn.attack_count}
              </p>
            </div>
            <FireIcon className="w-8 h-8" style={{ color: COLORS.threatRed }} />
          </div>

          <div>
            <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Block Rate</p>
            <Progress
              percent={Math.round((topAsn.blocked_count / topAsn.attack_count) * 100)}
              strokeColor={COLORS.success}
              trailColor={`${COLORS.textSecondary}30`}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: COLORS.textSecondary }}>
          <MapIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No ASN threats detected</p>
        </div>
      )}
    </motion.div>
  );
}

function HeadlessDetectionPanel({ data }: { data: HeadlessDetection | null }) {
  const stats = data?.statistics;
  const total = stats?.total_headless || 0;

  const detectionData = [
    { name: "Playwright", value: stats?.playwright_count || 0, color: COLORS.securityPurple },
    { name: "Puppeteer", value: stats?.puppeteer_count || 0, color: COLORS.primaryBlue },
    { name: "Selenium", value: stats?.selenium_count || 0, color: COLORS.cyberTeal },
    { name: "PhantomJS", value: stats?.phantomjs_count || 0, color: COLORS.warningOrange },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-6 rounded-xl shadow-lg"
      style={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.securityPurple}30` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <BugAntIcon className="w-6 h-6" style={{ color: COLORS.securityPurple }} />
        <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          Headless Browsers
        </h3>
      </div>

      {total > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 rounded-lg text-center" style={{ background: `${COLORS.securityPurple}20` }}>
              <p className="text-2xl font-bold" style={{ color: COLORS.securityPurple }}>
                {total}
              </p>
              <p className="text-xs" style={{ color: COLORS.textSecondary }}>Total Detected</p>
            </div>
            <div className="p-4 rounded-lg text-center" style={{ background: `${COLORS.threatRed}20` }}>
              <p className="text-2xl font-bold" style={{ color: COLORS.threatRed }}>
                {stats?.blocked_count || 0}
              </p>
              <p className="text-xs" style={{ color: COLORS.textSecondary }}>Blocked</p>
            </div>
          </div>

          <div className="space-y-2">
            {detectionData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm" style={{ color: COLORS.textSecondary }}>{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                    {item.value}
                  </span>
                  <div className="w-16 h-2 rounded-full" style={{ background: `${item.color}30` }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                        background: item.color
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-8" style={{ color: COLORS.textSecondary }}>
          <CpuChipIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No headless browsers detected</p>
        </div>
      )}
    </motion.div>
  );
}

function VelocityPanel({ data, trends }: { data: VelocityAnalysis | null; trends: any[] }) {
  const chartData = trends.map(t => ({
    hour: new Date(t.hour).getHours() + ":00",
    requests: t.totalRequests,
    bots: t.botRequests,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl shadow-lg"
      style={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.warningOrange}30` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <BoltIcon className="w-6 h-6" style={{ color: COLORS.warningOrange }} />
        <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          Velocity Analysis
        </h3>
      </div>

      {chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.primaryBlue} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.primaryBlue} stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorBots" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.threatRed} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.threatRed} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={`${COLORS.textSecondary}30`} />
            <XAxis dataKey="hour" stroke={COLORS.textSecondary} />
            <YAxis stroke={COLORS.textSecondary} />
            <RechartsTooltip
              contentStyle={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.textSecondary}30` }}
            />
            <Area type="monotone" dataKey="requests" stroke={COLORS.primaryBlue} fillOpacity={1} fill="url(#colorRequests)" />
            <Area type="monotone" dataKey="bots" stroke={COLORS.threatRed} fillOpacity={1} fill="url(#colorBots)" />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="text-center py-8" style={{ color: COLORS.textSecondary }}>
          <ChartBarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No velocity data available</p>
        </div>
      )}

      {data?.topRequesters && data.topRequesters.length > 0 && (
        <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${COLORS.textSecondary}30` }}>
          <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Top Requesters</p>
          <div className="space-y-2">
            {data.topRequesters.slice(0, 3).map((req: any, idx: number) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="font-mono" style={{ color: COLORS.textPrimary }}>{req.source_ip}</span>
                <span style={{ color: COLORS.warningOrange }}>{req.total_requests} req/s</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

function CrawlerVerificationPanel({ data }: { data: CrawlerVerification | null }) {
  const stats = data?.statistics;
  const verified = stats?.verified_count || 0;
  const fake = stats?.impostor_count || 0;
  const total = verified + fake;

  const pieData = [
    { name: "Verified", value: verified, color: COLORS.success },
    { name: "Fake", value: fake, color: COLORS.threatRed },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl shadow-lg"
      style={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.success}30` }}
    >
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheckIcon className="w-6 h-6" style={{ color: COLORS.success }} />
        <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          Crawler Verification
        </h3>
      </div>

      {total > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col justify-center space-y-3">
            <div className="p-3 rounded-lg" style={{ background: `${COLORS.success}20` }}>
              <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Verified</p>
              <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{verified}</p>
            </div>
            <div className="p-3 rounded-lg" style={{ background: `${COLORS.threatRed}20` }}>
              <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Imposters</p>
              <p className="text-2xl font-bold" style={{ color: COLORS.threatRed }}>{fake}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8" style={{ color: COLORS.textSecondary }}>
          <ShieldCheckIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No crawler activity</p>
        </div>
      )}

      {stats && (
        <div className="mt-4 pt-4 space-y-2" style={{ borderTop: `1px solid ${COLORS.textSecondary}30` }}>
          <div className="flex justify-between text-sm">
            <span style={{ color: COLORS.textSecondary }}>Googlebot</span>
            <span style={{ color: COLORS.textPrimary }}>{stats.googlebot_count || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span style={{ color: COLORS.textSecondary }}>Bingbot</span>
            <span style={{ color: COLORS.textPrimary }}>{stats.bingbot_count || 0}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}


function ScoreDistributionHeatmap({ distribution }: { distribution: ScoreDistribution | null }) {
  if (!distribution) return null;

  const heatmapData = [
    { level: "Critical", count: distribution.critical_count, range: "80-100", color: COLORS.threatRed },
    { level: "High", count: distribution.high_count, range: "60-79", color: COLORS.warningOrange },
    { level: "Medium", count: distribution.medium_count, range: "40-59", color: COLORS.warningOrange },
    { level: "Low", count: distribution.low_count, range: "20-39", color: COLORS.primaryBlue },
    { level: "Safe", count: distribution.safe_count, range: "0-19", color: COLORS.success },
  ];

  const maxCount = Math.max(...heatmapData.map(d => d.count));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl shadow-lg mb-8"
      style={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.primaryBlue}30` }}
    >
      <div className="flex items-center gap-3 mb-6">
        <ChartBarIcon className="w-6 h-6" style={{ color: COLORS.primaryBlue }} />
        <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          Threat Score Distribution
        </h3>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {heatmapData.map((item, idx) => (
          <div
            key={idx}
            className="p-4 rounded-lg text-center transition-transform hover:scale-105 cursor-pointer"
            style={{
              background: `${item.color}${item.count > 0 ? '30' : '10'}`,
              border: `2px solid ${item.color}${item.count > 0 ? '60' : '30'}`,
            }}
          >
            <div className="text-3xl font-bold mb-2" style={{ color: item.color }}>
              {item.count}
            </div>
            <div className="text-sm font-semibold mb-1" style={{ color: COLORS.textPrimary }}>
              {item.level}
            </div>
            <div className="text-xs" style={{ color: COLORS.textSecondary }}>
              {item.range}
            </div>
            {item.count > 0 && (
              <div className="mt-3">
                <div className="h-1 rounded-full" style={{ background: `${item.color}30` }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(item.count / maxCount) * 100}%`,
                      background: item.color
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between items-center pt-4" style={{ borderTop: `1px solid ${COLORS.textSecondary}30` }}>
        <div>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>Average Threat Score</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.primaryBlue }}>
            {Math.round(distribution.avg_score)}
          </p>
        </div>
        <div>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>Peak Score (24h)</p>
          <p className="text-2xl font-bold" style={{ color: COLORS.threatRed }}>
            {Math.round(distribution.max_score)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface BotEventsTableProps {
  detections: BotDetection[];
  onBlock: (ip: string) => void;
  onUnblock: (ip: string) => void;
  blockedIps: Set<string>;
  onRowClick: (detection: BotDetection) => void;
}

function BotEventsTable({ detections, onBlock, onUnblock, blockedIps, onRowClick }: BotEventsTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl shadow-lg overflow-hidden"
      style={{ background: COLORS.panelBackground, border: `1px solid ${COLORS.textSecondary}30` }}
    >
      <div className="p-6 flex items-center gap-3" style={{ borderBottom: `1px solid ${COLORS.textSecondary}30` }}>
        <ExclamationTriangleIcon className="w-6 h-6" style={{ color: COLORS.warningOrange }} />
        <h3 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
          Recent Bot Events
        </h3>
        <Tag color={COLORS.primaryBlue} style={{ marginLeft: "auto" }}>
          {detections.length} Events
        </Tag>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: `${COLORS.deepNavy}80`, borderBottom: `1px solid ${COLORS.textSecondary}30` }}>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                Source IP
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                Path
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                Confidence
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                Reason
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                Time
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: COLORS.textSecondary }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {detections.map((detection, idx) => (
                <motion.tr
                  key={detection.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="cursor-pointer transition-colors"
                  style={{ borderBottom: `1px solid ${COLORS.textSecondary}20` }}
                  whileHover={{ backgroundColor: `${COLORS.primaryBlue}10` }}
                  onClick={() => onRowClick(detection)}
                >
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm" style={{ color: COLORS.textPrimary }}>
                      {detection.sourceIp}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-sm" style={{ color: COLORS.cyberTeal }}>
                      {detection.requestPath}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-12">
                        <Progress
                          percent={detection.confidenceScore}
                          size="small"
                          strokeColor={
                            detection.confidenceScore >= 80 ? COLORS.threatRed :
                            detection.confidenceScore >= 60 ? COLORS.warningOrange :
                            COLORS.success
                          }
                          showInfo={false}
                        />
                      </div>
                      <span className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>
                        {detection.confidenceScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                      {detection.detectionReason}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {detection.isBlocked ? (
                      <Tag color={COLORS.threatRed}>BLOCKED</Tag>
                    ) : (
                      <Tag color={COLORS.warningOrange}>DETECTED</Tag>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm" style={{ color: COLORS.textSecondary }}>
                      {new Date(detection.detectedAt).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {blockedIps.has(detection.sourceIp) || detection.isBlocked ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnblock(detection.sourceIp);
                        }}
                        className="px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                        style={{ background: `${COLORS.success}20`, color: COLORS.success }}
                      >
                        Unblock
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlock(detection.sourceIp);
                        }}
                        className="px-3 py-1 rounded-lg text-sm font-semibold transition-colors"
                        style={{ background: `${COLORS.threatRed}20`, color: COLORS.threatRed }}
                      >
                        Block
                      </motion.button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {detections.length === 0 && (
        <div className="text-center py-16">
          <CheckCircleIcon className="w-16 h-16 mx-auto mb-4" style={{ color: COLORS.success }} />
          <p className="text-xl font-semibold mb-2" style={{ color: COLORS.textPrimary }}>
            No Bot Activity
          </p>
          <p style={{ color: COLORS.textSecondary }}>
            Your APIs are secure
          </p>
        </div>
      )}
    </motion.div>
  );
}

interface DetectionModalProps {
  visible: boolean;
  detection: BotDetection | null;
  onClose: () => void;
  onBlock: (ip: string) => void;
  onUnblock: (ip: string) => void;
  isBlocked: boolean;
}

function DetectionModal({ visible, detection, onClose, onBlock, onUnblock, isBlocked }: DetectionModalProps) {
  if (!detection) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
      style={{ top: 20 }}
      styles={{
        body: { background: COLORS.panelBackground, color: COLORS.textPrimary },
        header: { background: COLORS.panelBackground, borderBottom: `1px solid ${COLORS.textSecondary}30` },
        content: { background: COLORS.panelBackground }
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg" style={{ background: `${COLORS.threatRed}20` }}>
              <ShieldExclamationIcon className="w-8 h-8" style={{ color: COLORS.threatRed }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                Threat Detection Details
              </h2>
              <p style={{ color: COLORS.textSecondary }}>
                Full analysis of detected bot activity
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="p-4 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Source IP</p>
            <p className="text-xl font-mono font-bold" style={{ color: COLORS.textPrimary }}>
              {detection.sourceIp}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Confidence Score</p>
            <div className="flex items-center gap-3">
              <Progress
                type="circle"
                percent={detection.confidenceScore}
                size={60}
                strokeColor={
                  detection.confidenceScore >= 80 ? COLORS.threatRed :
                  detection.confidenceScore >= 60 ? COLORS.warningOrange :
                  COLORS.success
                }
              />
              <span className="text-2xl font-bold" style={{ color: COLORS.textPrimary }}>
                {detection.confidenceScore}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Request Path</p>
            <code className="text-lg" style={{ color: COLORS.cyberTeal }}>
              {detection.requestPath}
            </code>
          </div>

          <div className="p-4 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>User Agent</p>
            <p className="text-sm font-mono" style={{ color: COLORS.textPrimary }}>
              {detection.userAgent || "Unknown"}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Detection Reason</p>
            <p className="text-sm" style={{ color: COLORS.textPrimary }}>
              {detection.detectionReason}
            </p>
          </div>

          <div className="p-4 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-sm mb-2" style={{ color: COLORS.textSecondary }}>Detected At</p>
            <p className="text-sm" style={{ color: COLORS.textPrimary }}>
              {new Date(detection.detectedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          {isBlocked ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onUnblock(detection.sourceIp);
                onClose();
              }}
              className="flex-1 py-3 rounded-lg font-semibold transition-colors"
              style={{ background: COLORS.success, color: "white" }}
            >
              Unblock IP Address
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onBlock(detection.sourceIp);
                onClose();
              }}
              className="flex-1 py-3 rounded-lg font-semibold transition-colors"
              style={{ background: COLORS.threatRed, color: "white" }}
            >
              Block IP Address
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-semibold transition-colors"
            style={{ background: `${COLORS.textSecondary}30`, color: COLORS.textPrimary }}
          >
            Close
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}


function PremiumCrawlerPanel({ data }: { data: CrawlerVerification | null }) {
  const stats = data?.statistics;
  const verified = stats?.verified_count || 0;
  const fake = stats?.impostor_count || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl relative overflow-hidden"
      style={{
        background: COLORS.panelBackground,
        border: `1px solid ${COLORS.success}35`,
        boxShadow: `0 0 14px ${COLORS.success}25`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ShieldCheckIcon className="w-5 h-5" style={{ color: COLORS.success }} />
        <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
          Crawler Verification
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <motion.div
          whileHover={{ scale: 1.03 }}
          className="p-3 rounded-lg text-center"
          style={{ background: `${COLORS.success}15`, border: `1px solid ${COLORS.success}30` }}
        >
          <CheckCircleIcon className="w-6 h-6 mx-auto mb-1" style={{ color: COLORS.success }} />
          <p className="text-2xl font-bold" style={{ color: COLORS.success }}>{verified}</p>
          <p className="text-xs" style={{ color: COLORS.textSecondary }}>Verified</p>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          className="p-3 rounded-lg text-center"
          style={{ background: `${COLORS.threatRed}15`, border: `1px solid ${COLORS.threatRed}30` }}
        >
          <NoSymbolIcon className="w-6 h-6 mx-auto mb-1" style={{ color: COLORS.threatRed }} />
          <p className="text-2xl font-bold" style={{ color: COLORS.threatRed }}>{fake}</p>
          <p className="text-xs" style={{ color: COLORS.textSecondary }}>Fake</p>
        </motion.div>
      </div>

      {stats && (
        <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: `1px solid ${COLORS.textSecondary}20` }}>
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: COLORS.textSecondary }}>Googlebot</span>
            <span className="font-semibold" style={{ color: COLORS.textPrimary }}>{stats.googlebot_count || 0}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span style={{ color: COLORS.textSecondary }}>Bingbot</span>
            <span className="font-semibold" style={{ color: COLORS.textPrimary }}>{stats.bingbot_count || 0}</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function PremiumScoreHeatmap({ distribution }: { distribution: ScoreDistribution | null }) {
  if (!distribution) return null;

  const heatmapData = [
    { level: "Critical", count: distribution.critical_count, range: "80-100", color: COLORS.threatRed },
    { level: "High", count: distribution.high_count, range: "60-79", color: COLORS.warningOrange },
    { level: "Medium", count: distribution.medium_count, range: "40-59", color: COLORS.warningOrange },
    { level: "Low", count: distribution.low_count, range: "20-39", color: COLORS.primaryBlue },
    { level: "Safe", count: distribution.safe_count, range: "0-19", color: COLORS.success },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl mb-4"
      style={{
        background: COLORS.panelBackground,
        border: `1px solid ${COLORS.primaryBlue}35`,
        boxShadow: `0 0 14px ${COLORS.primaryBlue}25`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <ChartBarIcon className="w-5 h-5" style={{ color: COLORS.primaryBlue }} />
        <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
          Threat Score Distribution
        </h3>
      </div>

      <div className="grid grid-cols-5 gap-2">
        {heatmapData.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            whileHover={{ scale: 1.05, y: -4 }}
            className="p-3 rounded-lg text-center cursor-pointer"
            style={{
              background: `${item.color}${item.count > 0 ? '20' : '10'}`,
              border: `1px solid ${item.color}${item.count > 0 ? '40' : '20'}`,
              boxShadow: item.count > 0 ? `0 0 10px ${item.color}30` : 'none',
            }}
          >
            <div className="text-2xl font-bold mb-1" style={{ color: item.color }}>
              {item.count}
            </div>
            <div className="text-xs font-semibold mb-0.5" style={{ color: COLORS.textPrimary }}>
              {item.level}
            </div>
            <div className="text-xs" style={{ color: COLORS.textSecondary }}>
              {item.range}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

interface PremiumEventsTableProps {
  detections: BotDetection[];
  onBlock: (ip: string) => void;
  onUnblock: (ip: string) => void;
  blockedIps: Set<string>;
  onRowClick: (detection: BotDetection) => void;
}

function PremiumEventsTable({ detections, onBlock, onUnblock, blockedIps, onRowClick }: PremiumEventsTableProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{
        background: COLORS.panelBackground,
        border: `1px solid ${COLORS.textSecondary}30`,
        boxShadow: `0 0 14px ${COLORS.primaryBlue}20`,
      }}
    >
      <div className="p-4 flex items-center gap-3" style={{ borderBottom: `1px solid ${COLORS.textSecondary}20` }}>
        <ExclamationTriangleIcon className="w-5 h-5" style={{ color: COLORS.warningOrange }} />
        <h3 className="text-lg font-bold" style={{ color: COLORS.textPrimary }}>
          Live Bot Events
        </h3>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="ml-auto"
        >
          <Tag color={COLORS.primaryBlue} className="font-semibold">
            {detections.length} Events
          </Tag>
        </motion.div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ background: `${COLORS.deepNavy}60` }}>
              <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: COLORS.textSecondary }}>Status</th>
              <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: COLORS.textSecondary }}>IP Address</th>
              <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: COLORS.textSecondary }}>Path</th>
              <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: COLORS.textSecondary }}>Score</th>
              <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: COLORS.textSecondary }}>Reason</th>
              <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: COLORS.textSecondary }}>Time</th>
              <th className="px-4 py-2 text-left text-xs font-semibold" style={{ color: COLORS.textSecondary }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {detections.slice(0, 10).map((detection, idx) => (
                <motion.tr
                  key={detection.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.03 }}
                  className="cursor-pointer group"
                  style={{ borderBottom: `1px solid ${COLORS.textSecondary}15` }}
                  whileHover={{ backgroundColor: `${COLORS.primaryBlue}08` }}
                  onClick={() => onRowClick(detection)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-2 h-2 rounded-full"
                        style={{ background: detection.isBlocked ? COLORS.threatRed : COLORS.warningOrange }}
                      />
                      <span className="text-xs font-semibold" style={{
                        color: detection.isBlocked ? COLORS.threatRed : COLORS.warningOrange
                      }}>
                        {detection.isBlocked ? "BLOCKED" : "DETECTED"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs" style={{ color: COLORS.textPrimary }}>
                      {detection.sourceIp}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs" style={{ color: COLORS.cyberTeal }}>
                      {detection.requestPath}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: `${COLORS.textSecondary}20` }}>
                        <div
                          className="h-full"
                          style={{
                            width: `${detection.confidenceScore}%`,
                            background: detection.confidenceScore >= 80 ? COLORS.threatRed :
                              detection.confidenceScore >= 60 ? COLORS.warningOrange : COLORS.success,
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: COLORS.textPrimary }}>
                        {detection.confidenceScore}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                      {detection.detectionReason}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs" style={{ color: COLORS.textSecondary }}>
                      {new Date(detection.detectedAt).toLocaleTimeString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {blockedIps.has(detection.sourceIp) || detection.isBlocked ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onUnblock(detection.sourceIp);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: `${COLORS.success}20`, color: COLORS.success }}
                      >
                        Unblock
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onBlock(detection.sourceIp);
                        }}
                        className="px-3 py-1 rounded-lg text-xs font-semibold"
                        style={{ background: `${COLORS.threatRed}20`, color: COLORS.threatRed }}
                      >
                        Block
                      </motion.button>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {detections.length === 0 && (
        <div className="text-center py-12">
          <CheckCircleIcon className="w-12 h-12 mx-auto mb-3" style={{ color: COLORS.success }} />
          <p className="text-lg font-semibold mb-1" style={{ color: COLORS.textPrimary }}>
            All Clear
          </p>
          <p className="text-sm" style={{ color: COLORS.textSecondary }}>
            No bot activity detected
          </p>
        </div>
      )}
    </motion.div>
  );
}

interface PremiumDetectionModalProps {
  visible: boolean;
  detection: BotDetection | null;
  onClose: () => void;
  onBlock: (ip: string) => void;
  onUnblock: (ip: string) => void;
  isBlocked: boolean;
}

function PremiumDetectionModal({ visible, detection, onClose, onBlock, onUnblock, isBlocked }: PremiumDetectionModalProps) {
  if (!detection) return null;

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
      style={{ top: 20 }}
      styles={{
        body: { background: COLORS.panelBackground },
        header: { background: COLORS.panelBackground },
        content: {
          background: COLORS.panelBackground,
          border: `1px solid ${COLORS.primaryBlue}35`,
          boxShadow: `0 0 30px ${COLORS.primaryBlue}30`,
        }
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
            className="p-3 rounded-lg"
            style={{ background: `${COLORS.threatRed}20` }}
          >
            <ShieldExclamationIcon className="w-8 h-8" style={{ color: COLORS.threatRed }} />
          </motion.div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: COLORS.textPrimary }}>
              Threat Analysis
            </h2>
            <p className="text-sm" style={{ color: COLORS.textSecondary }}>
              Detailed detection breakdown
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Source IP</p>
            <p className="text-base font-mono font-bold" style={{ color: COLORS.textPrimary }}>
              {detection.sourceIp}
            </p>
          </div>

          <div className="p-3 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Confidence</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: `${COLORS.textSecondary}30` }}>
                <div
                  className="h-full"
                  style={{
                    width: `${detection.confidenceScore}%`,
                    background: detection.confidenceScore >= 80 ? COLORS.threatRed : COLORS.warningOrange,
                  }}
                />
              </div>
              <span className="text-base font-bold" style={{ color: COLORS.textPrimary }}>
                {detection.confidenceScore}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="p-3 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Request Path</p>
            <code className="text-sm" style={{ color: COLORS.cyberTeal }}>
              {detection.requestPath}
            </code>
          </div>

          <div className="p-3 rounded-lg" style={{ background: `${COLORS.deepNavy}80` }}>
            <p className="text-xs mb-1" style={{ color: COLORS.textSecondary }}>Detection Reason</p>
            <p className="text-sm" style={{ color: COLORS.textPrimary }}>
              {detection.detectionReason}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          {isBlocked ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onUnblock(detection.sourceIp);
                onClose();
              }}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ background: COLORS.success, color: "white" }}
            >
              Unblock IP
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onBlock(detection.sourceIp);
                onClose();
              }}
              className="flex-1 py-3 rounded-lg font-semibold"
              style={{ background: COLORS.threatRed, color: "white" }}
            >
              Block IP
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 py-3 rounded-lg font-semibold"
            style={{ background: `${COLORS.textSecondary}30`, color: COLORS.textPrimary }}
          >
            Close
          </motion.button>
        </div>
      </div>
    </Modal>
  );
}

