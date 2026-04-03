"use client";
import React, { useState } from "react";
import useSWR from "swr";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ComposedChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Area, Legend } from "recharts";
import {
  ArrowPathIcon,
  PlayCircleIcon,
  ArrowDownTrayIcon,
  ShieldCheckIcon,
  FireIcon,
  BugAntIcon,
  ShieldExclamationIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import {
  fadeSlideDown,
  fadeLift,
  scaleInPulse,
  cardLift,
  hoverGlow,
  pulseLoop,
  staggerContainer,
  depthReveal,
  springIn,
  closingDepth
} from "../../../../motion/variants";

interface SecurityMetrics {
  securityScore: number;
  securityScoreTrend: number;
  activeThreats: number;
  openVulnerabilities: number;
  scansRunning: number;
  complianceScore: number;
  botDetectionRate: number;
  criticalVulns: number;
  vulnScore?: number;
  threatScore?: number;
  scanHygieneScore?: number;
}

const fetcher = (url: string, tenantId: string) =>
  fetch(url, { headers: { "x-tenant-id": tenantId } }).then((res) => res.json());

export function SecurityCenterPage({ company, onNavigate }) {
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formScanType, setFormScanType] = useState("comprehensive");
  const [formError, setFormError] = useState("");
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const tenantId = company?.id || "1";

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const { data: metricsData, mutate: refreshMetrics, isLoading: metricsLoading } = useSWR(
    [`/api/customer/security-metrics`, tenantId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: autoRefresh ? 30000 : 0 }
  );

  const { data: scansData, isLoading: scansLoading } = useSWR(
    [`/api/customer/security-scans?limit=10`, tenantId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: autoRefresh ? 10000 : 0 }
  );

  const { data: vulnsData, isLoading: vulnsLoading } = useSWR(
    [`/api/customer/vulnerabilities?limit=5&status=open`, tenantId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: autoRefresh ? 15000 : 0 }
  );

  const { data: threatsData, isLoading: threatsLoading } = useSWR(
        [`/api/customer/threat-blocking`, tenantId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: autoRefresh ? 10000 : 0 }
  );
  // Fetch 30-day security trends
  const { data: trendsData, isLoading: trendsLoading } = useSWR(
    [`/api/customer/security-metrics/trends`, tenantId],
    ([url, id]: [string, string]) => fetcher(url, id),
    { refreshInterval: autoRefresh ? 60000 : 0 }
  );

  const scans = scansData?.success ? scansData.securityScans : [];
  const metrics: SecurityMetrics | null = metricsData?.success ? metricsData.metrics : null;
  const trends = trendsData?.success ? trendsData.trends : [];
  const vulns = vulnsData?.success ? vulnsData.vulnerabilities : [];
  const threats = threatsData?.success ? threatsData.threatBlocking : null;

  const handleRefresh = () => {
    refreshMetrics();
    showToast("Dashboard refreshed");
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUrl.trim()) {
      setFormError("Please enter target URL");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/security-scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": tenantId,
        },
        body: JSON.stringify({ url: formUrl, scanType: formScanType }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Security scan initiated");
        setScanModalVisible(false);
        setFormUrl("");
        setFormScanType("comprehensive");
      } else {
        showToast(data.error || "Failed to start scan", "error");
      }
    } catch (error) {
      showToast("Failed to start scan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      showToast("Generating PDF report...", "info");

      // Fetch report data
      const response = await fetch('/api/customer/security-report/pdf', {
        headers: { 'x-tenant-id': tenantId }
      });
      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to fetch report data');
      }

      // Dynamic import jsPDF to avoid SSR issues
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const reportData = data.reportData;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(6, 182, 212);
      doc.text('GovernAPI Security Report', 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 14, 28);

      // Executive Summary
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('Executive Summary', 14, 40);

      doc.setFontSize(10);
      const summaryY = 48;
      doc.text(`Overall Security Score: ${reportData.metrics.securityScore}/100`, 14, summaryY);
      doc.text(`• Vulnerability Score: ${reportData.metrics.vulnScore}/100`, 20, summaryY + 7);
      doc.text(`• Threat Activity Score: ${reportData.metrics.threatScore}/100`, 20, summaryY + 14);
      doc.text(`• Compliance Score: ${reportData.metrics.complianceScore}/100`, 20, summaryY + 21);
      doc.text(`• Scan Hygiene Score: ${reportData.metrics.scanHygieneScore}/100`, 20, summaryY + 28);

      // Vulnerabilities Table
      doc.setFontSize(14);
      doc.text('Vulnerability Breakdown', 14, summaryY + 42);

      (autoTable as any)(doc, {
        startY: summaryY + 48,
        head: [['Severity', 'Count']],
        body: [
          ['Critical', reportData.vulnerabilities.critical],
          ['High', reportData.vulnerabilities.high],
          ['Medium', reportData.vulnerabilities.medium],
          ['Low', reportData.vulnerabilities.low],
          ['Total Open', reportData.vulnerabilities.total],
        ],
        theme: 'grid',
        headStyles: { fillColor: [6, 182, 212] },
      });

      // Threat Activity
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(14);
      doc.text('Threat Activity (Last 7 Days)', 14, finalY);

      doc.setFontSize(10);
      doc.text(`Active Threats: ${reportData.threats.active}`, 14, finalY + 8);
      doc.text(`Threats Blocked Today: ${reportData.threats.blockedToday}`, 14, finalY + 15);

      if (reportData.threats.recentTypes.length > 0) {
        (autoTable as any)(doc, {
          startY: finalY + 22,
          head: [['Threat Type', 'Count']],
          body: reportData.threats.recentTypes.map((t: any) => [t.type, t.count]),
          theme: 'grid',
          headStyles: { fillColor: [239, 68, 68] },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Recent Scans
      if (reportData.scans.recent.length > 0) {
        doc.setFontSize(14);
        doc.text('Recent Security Scans', 14, finalY);

        (autoTable as any)(doc, {
          startY: finalY + 6,
          head: [['Scan Type', 'Status', 'Date']],
          body: reportData.scans.recent.map((s: any) => [
            s.type,
            s.status,
            new Date(s.date).toLocaleDateString()
          ]),
          theme: 'grid',
          headStyles: { fillColor: [6, 182, 212] },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(
          `GovernAPI Security Report - Page ${i} of ${pageCount}`,
          doc.internal.pageSize.getWidth() / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`GovernAPI-Security-Report-${new Date().toISOString().split('T')[0]}.pdf`);

      showToast("PDF report downloaded!");
    } catch (error) {
      console.error('PDF export error:', error);
      showToast("Failed to generate PDF report", "error");
    }
  };

  const scoreColor = (score: number) => {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#f97316";
    return "#ef4444";
  };

  return (
    <div className="security-center-viewport">
      <style jsx global>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes hueRotate {
            from { filter: hue-rotate(0deg); }
            to { filter: hue-rotate(20deg); }
          }

          @keyframes pulseGlow {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 0.6; }
          }

          @keyframes heartbeat {
            0%, 100% { box-shadow: 0 0 8px rgba(6,182,212,0.3); }
            50% { box-shadow: 0 0 16px rgba(6,182,212,0.6); }
          }

          .security-center-viewport {
            animation: hueRotate 60s linear infinite;
          }

          .threat-pulse::before {
            animation: pulseGlow 2.5s ease-in-out infinite;
          }

          .heartbeat-switch {
            animation: heartbeat 10s ease-in-out infinite;
          }
        }

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

        .security-center-viewport::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 40%;
          background: linear-gradient(0deg, rgba(0,0,0,0.3) 0%, transparent 100%);
          pointer-events: none;
          z-index: 0;
        }

        .glass-card {
    overflow: hidden;
     border: 1px solid rgba(255,255,255,0.03);
     box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
          background: rgba(20, 25, 40, 0.65);
          backdrop-filter: blur(20px) saturate(150%);
          border: 1px solid rgba(255,255,255,0.04);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 18px rgba(0,0,0,0.35);
          border-radius: 1rem;
          position: relative;
          transition: all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        }

        .glass-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0));
          border-radius: 16px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .glass-card:hover::before {
          opacity: 1;
        }

        .glass-card:hover {
          filter: brightness(1.05);
          border-color: rgba(22,119,255,0.15);
        }

        .threat-pulse {
          position: relative;
        }

        .threat-pulse::before {
          content: '';
          position: absolute;
          inset: -25px;
          border-radius: inherit;
          background: radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%);
          pointer-events: none;
          z-index: -1;
        }

        .live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #06b6d4;
          box-shadow: 0 0 12px rgba(6,182,212,0.7);
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @media (prefers-reduced-motion: no-preference) {
          .live-indicator {
            animation: pulse 1.4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        }

        .section-title {
          position: relative;
          cursor: pointer;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #06b6d4, transparent);
          transition: width 0.3s ease;
        }

        .section-title:hover::after {
          width: 100%;
        }

        .scan-button {
          box-shadow: 0 0 20px rgba(6,182,212,0.3);
          transition: all 0.4s ease;
        }

        .scan-button:hover {
          box-shadow: 0 0 35px rgba(6,182,212,0.6);
          transform: translateY(-2px);
        }

        .icon-float:hover {
          transform: translateY(-2px);
          transition: transform 0.2s ease;
        }
      `}</style>

      {/* Toast notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-2xl border border-white/10 backdrop-blur-xl"
            style={{
              background: toastMessage.type === "error" ? "rgba(239,68,68,0.9)" : toastMessage.type === "info" ? "rgba(59,130,246,0.9)" : "rgba(16,185,129,0.9)",
              color: "#fff",
            }}
          >
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={shouldReduceMotion ? undefined : fadeSlideDown}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <ShieldCheckIcon className="w-10 h-10 text-cyan-400 icon-float" />
              Security Center
            </h1>
            <p className="text-slate-400">Real-time security operations and threat intelligence</p>
          </div>
          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={springIn}
          >
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoRefresh ? 'bg-cyan-500' : 'bg-slate-600'} ${autoRefresh ? 'heartbeat-switch' : ''}`}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${autoRefresh ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.05, y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={handleRefresh}
              className="glass-card px-4 py-2 text-white flex items-center gap-2"
            >
              <ArrowPathIcon className={`w-5 h-5 ${metricsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </motion.button>
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.05, y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={handleExportPDF}
              className="glass-card px-4 py-2 text-white flex items-center gap-2 hover:bg-slate-700"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export PDF
            </motion.button>
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.05, y: -2 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
              onClick={() => setScanModalVisible(true)}
              className="scan-button px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2"
            >
              <PlayCircleIcon className="w-5 h-5" />
              Start Scan
            </motion.button>
          </motion.div>
        </motion.div>

        {metrics && (
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={shouldReduceMotion ? undefined : fadeLift}
            className="glass-card p-4 mb-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Security Score</div>
                  <div className="text-2xl font-bold text-cyan-400">{metrics.securityScore}/100</div>
                </div>
                <div className="h-8 w-px bg-slate-600"></div>
                <div>
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Active Threats</div>
                  <div className="text-2xl font-bold text-white">{metrics.activeThreats}</div>
                </div>
                <div className="h-8 w-px bg-slate-600"></div>
                <div>
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Vulnerabilities</div>
                  <div className="text-2xl font-bold text-orange-400">{metrics.openVulnerabilities}</div>
                </div>
                <div className="h-8 w-px bg-slate-600"></div>
                <div>
                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Compliance</div>
                  <div className="text-2xl font-bold text-green-400">{metrics.complianceScore}%</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={shouldReduceMotion ? undefined : scaleInPulse}
            whileHover={shouldReduceMotion ? undefined : hoverGlow}
            className="glass-card p-8"
          >
            <div className="text-center">
              {metricsLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-pulse bg-slate-700/50 rounded-full w-[180px] h-[180px]" />
                </div>
              ) : (
                <>
                  <div
                    className="relative inline-flex items-center justify-center"
                    style={{ width: 200, height: 200, cursor: 'help' }}
                    title={`Security Score Breakdown -- Vulnerabilities: ${metrics?.vulnScore ?? 0} | Threat Activity: ${metrics?.threatScore ?? 0} | Compliance: ${metrics?.complianceScore ?? 0} | Scan Hygiene: ${metrics?.scanHygieneScore ?? 0} | Final Weighted Score: ${metrics?.securityScore ?? 0}`}
                  >
                    {/* SVG circular progress */}
                    <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth="10"
                      />
                      <circle
                        cx="100"
                        cy="100"
                        r="85"
                        fill="none"
                        stroke="url(#scoreGradient)"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={`${(metrics?.securityScore || 0) * 5.34} ${534 - (metrics?.securityScore || 0) * 5.34}`}
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold text-white">{metrics?.securityScore || 0}</div>
                      <div className="text-sm text-slate-400 mt-2">Security Score</div>
                    </div>
                  </div>
                  {metrics?.securityScoreTrend !== undefined && (
                    <motion.div
                      className="mt-4 text-sm"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.2 }}
                    >
                      <span className={metrics.securityScoreTrend >= 0 ? "text-green-400" : "text-red-400"}>
                        {metrics.securityScoreTrend >= 0 ? "\u2191" : "\u2193"} {Math.abs(metrics.securityScoreTrend)}%
                      </span>
                      <span className="text-slate-500"> vs last week</span>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          </motion.div>
          {/* 30-Day Security Trend Chart */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={shouldReduceMotion ? undefined : fadeLift}
            className="glass-card p-6 lg:col-span-2"
          >
            <h3 className="text-lg font-semibold text-white mb-4">30-Day Security Trend</h3>
            {trendsLoading ? (
              <div className="space-y-3">
                <div className="animate-pulse bg-slate-700/50 rounded-xl h-6 w-3/4" />
                <div className="animate-pulse bg-slate-700/50 rounded-xl h-6 w-1/2" />
                <div className="animate-pulse bg-slate-700/50 rounded-xl h-6 w-5/6" />
                <div className="animate-pulse bg-slate-700/50 rounded-xl h-6 w-2/3" />
              </div>
            ) : trendsData?.success && trendsData.trends?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={trendsData.trends}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    stroke="#475569"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    stroke="#475569"
                    label={{ value: 'Security Score', angle: -90, position: 'insideLeft', fill: '#94a3b8' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    stroke="#475569"
                    label={{ value: 'Active Threats', angle: 90, position: 'insideRight', fill: '#94a3b8' }}
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ color: '#94a3b8' }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="securityScore"
                    fill="rgba(59, 130, 246, 0.2)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Security Score"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="activeThreats"
                    stroke="#f87171"
                    strokeWidth={2}
                    dot={{ fill: '#f87171' }}
                    name="Active Threats"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-slate-400">
                <ChartBarIcon className="w-10 h-10 mx-auto mb-2" />
                <p>No trend data available</p>
              </div>
            )}
          </motion.div>


      </div>

          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            <motion.div custom={0} initial="hidden" animate="visible" variants={shouldReduceMotion ? undefined : cardLift} whileHover={shouldReduceMotion ? undefined : hoverGlow} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-400 font-medium">Active Threats</div>
                <motion.div className="p-2 rounded-lg icon-float" style={{ background: "rgba(239,68,68,0.1)" }}>
                  <FireIcon className="w-5 h-5 text-red-400" />
                </motion.div>
              </div>
              <div className="text-3xl font-bold text-white">{metrics?.activeThreats || 0}</div>
              {metrics?.activeThreats > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="live-indicator" />
                  <span className="text-xs text-cyan-400">Live monitoring</span>
                </div>
              )}
            </motion.div>

            <motion.div custom={1} initial="hidden" animate="visible" variants={shouldReduceMotion ? undefined : cardLift} whileHover={shouldReduceMotion ? undefined : hoverGlow} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-400 font-medium">Critical Vulns</div>
                <motion.div className="p-2 rounded-lg icon-float" style={{ background: "rgba(251,146,60,0.1)" }}>
                  <BugAntIcon className="w-5 h-5 text-orange-400" />
                </motion.div>
              </div>
              <div className="text-3xl font-bold text-white">{metrics?.criticalVulns || 0}</div>
              <div className="text-xs text-slate-500 mt-2">Require immediate action</div>
            </motion.div>

            <motion.div custom={2} initial="hidden" animate="visible" variants={shouldReduceMotion ? undefined : cardLift} whileHover={shouldReduceMotion ? undefined : hoverGlow} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-400 font-medium">Scans Running</div>
                <motion.div className="p-2 rounded-lg icon-float" style={{ background: "rgba(6,182,212,0.1)" }}>
                  <ChartBarIcon className="w-5 h-5 text-cyan-300" />
                </motion.div>
              </div>
              <div className="text-3xl font-bold text-white">{metrics?.scansRunning || 0}</div>
              <div className="text-xs text-slate-500 mt-2">Active scans</div>
            </motion.div>

            <motion.div custom={3} initial="hidden" animate="visible" variants={shouldReduceMotion ? undefined : cardLift} whileHover={shouldReduceMotion ? undefined : hoverGlow} className="glass-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm text-slate-400 font-medium">Compliance</div>
                <motion.div className="p-2 rounded-lg icon-float" style={{ background: "rgba(168,85,247,0.1)" }}>
                  <ShieldExclamationIcon className="w-5 h-5 text-purple-400" />
                </motion.div>
              </div>
              <div className="text-3xl font-bold text-white">
                {metrics?.complianceScore || 0}<span className="text-lg text-slate-400">%</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">Overall score</div>
            </motion.div>
          </div>
        </div>
      <motion.div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10" initial="hidden" animate="visible" variants={shouldReduceMotion ? undefined : staggerContainer}>
        <motion.div variants={shouldReduceMotion ? undefined : depthReveal} whileHover={shouldReduceMotion ? undefined : hoverGlow} className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 section-title">
              <BugAntIcon className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">Critical Vulnerabilities</h3>
              {metrics?.criticalVulns > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full bg-orange-500 text-white">
                  {metrics.criticalVulns}
                </span>
              )}
            </div>
            <button onClick={() => onNavigate?.("vulnerability-scanner")} className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">View All &rarr;</button>
          </div>
          {vulnsLoading ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-slate-700/50 rounded-xl h-16 w-full" />
              <div className="animate-pulse bg-slate-700/50 rounded-xl h-16 w-full" />
              <div className="animate-pulse bg-slate-700/50 rounded-xl h-16 w-full" />
            </div>
          ) : vulns.length > 0 ? (
            <div className="space-y-3">
              {vulns.slice(0, 5).map((vuln: any, idx: number) => (
                <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 + (idx * 0.05), duration: 0.3, ease: "easeOut" }} whileHover={shouldReduceMotion ? undefined : { x: 5 }} className="glass-card p-4 cursor-pointer" style={{ border: "1px solid rgba(251,146,60,0.1)" }}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                        <span className="text-xs text-orange-400 font-semibold">{vuln.severity?.toUpperCase()}</span>
                      </div>
                      <div className="text-white font-medium mb-1 text-sm">{vuln.title}</div>
                      <div className="text-xs text-slate-400">{vuln.vulnerability_type}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.2, duration: 0.4 }}>
              <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-white font-medium">No critical vulnerabilities</p>
              <p className="text-sm text-slate-400 mt-1">Your systems are secure</p>
            </motion.div>
          )}
        </motion.div>

        <motion.div variants={shouldReduceMotion ? undefined : depthReveal} animate={shouldReduceMotion ? undefined : (metrics?.activeThreats > 0 ? "animate" : undefined)} {...(shouldReduceMotion ? {} : (metrics?.activeThreats > 0 ? pulseLoop : {}))} whileHover={shouldReduceMotion ? undefined : hoverGlow} className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 section-title">
              <FireIcon className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Live Threat Monitor</h3>
              <div className="live-indicator ml-1" />
            </div>
            <button onClick={() => onNavigate?.("threat-intelligence")} className="text-cyan-400 hover:text-cyan-300 text-sm transition-colors">Details &rarr;</button>
          </div>
          {threatsLoading ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-slate-700/50 rounded-xl h-24 w-full" />
              <div className="animate-pulse bg-slate-700/50 rounded-xl h-24 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <motion.div className="glass-card p-6 text-center threat-pulse" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }} whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}>
                {/* Custom circular indicator for blocked threats */}
                <div className="relative inline-flex items-center justify-center" style={{ width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" strokeDasharray="264 264" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-red-400">{threats?.recentBlocked?.length || 0}</div>
                    <div className="text-xs text-slate-400 mt-1">BLOCKED</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-3">Today</div>
              </motion.div>
              <motion.div className="glass-card p-6 text-center" style={{ background: "rgba(251,146,60,0.05)", border: "1px solid rgba(251,146,60,0.2)" }} whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}>
                {/* Custom circular indicator for active threats */}
                <div className="relative inline-flex items-center justify-center" style={{ width: 100, height: 100 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100" className="transform -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#f97316" strokeWidth="8" strokeLinecap="round" strokeDasharray="264 264" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-3xl font-bold text-orange-400">{metrics?.activeThreats || 0}</div>
                    <div className="text-xs text-slate-400 mt-1">ACTIVE</div>
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-3">Right now</div>
              </motion.div>
            </div>
          )}
        </motion.div>

        <motion.div variants={shouldReduceMotion ? undefined : closingDepth} whileHover={shouldReduceMotion ? undefined : hoverGlow} className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 section-title">
              <ChartBarIcon className="w-5 h-5 text-cyan-300" />
              <h3 className="text-lg font-semibold text-white">Recent Security Scans</h3>
            </div>
            <motion.button whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }} onClick={() => setScanModalVisible(true)} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors">New Scan</motion.button>
          </div>
          {scansLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse bg-slate-700/50 rounded-xl h-24 w-full" />
              ))}
            </div>
          ) : scans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {scans.slice(0, 6).map((scan: any, idx: number) => (
                <motion.div key={idx} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5 + (idx * 0.04), duration: 0.3, ease: "easeOut" }} whileHover={shouldReduceMotion ? undefined : { scale: 1.05, y: -5 }} className="glass-card p-4 cursor-pointer" style={{ border: "1px solid rgba(6,182,212,0.1)" }}>
                  <div className="text-xs text-cyan-400 font-mono mb-2 truncate">{scan.target}</div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-cyan-500/15 text-cyan-400">{scan.scan_type}</span>
                    <span className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full ${scan.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-orange-500/15 text-orange-400"}`}>{scan.status}</span>
                  </div>
                  {scan.security_score && (
                    <div className="w-full h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${scan.security_score}%`,
                          background: scan.security_score >= 80 ? "#10b981" : "#f97316",
                        }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div className="text-center py-12" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.5, duration: 0.4 }}>
              <ClockIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-white font-medium mb-3">No recent scans</p>
              <motion.button whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }} onClick={() => setScanModalVisible(true)} className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">Start First Scan</motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Scan Modal */}
      <AnimatePresence>
        {scanModalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setScanModalVisible(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md mx-4 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <h2 className="text-lg font-semibold text-white mb-5">Start New Security Scan</h2>
              <form onSubmit={handleStartScan} className="space-y-5">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Target URL</label>
                  <input
                    type="text"
                    value={formUrl}
                    onChange={(e) => { setFormUrl(e.target.value); setFormError(""); }}
                    placeholder="https://api.example.com"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                  {formError && <p className="text-red-400 text-xs mt-1">{formError}</p>}
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Scan Type</label>
                  <select
                    value={formScanType}
                    onChange={(e) => setFormScanType(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
                  >
                    <option value="quick" className="bg-slate-800">Quick (5-10 min)</option>
                    <option value="comprehensive" className="bg-slate-800">Comprehensive (15-30 min)</option>
                    <option value="deep" className="bg-slate-800">Deep (30-60 min)</option>
                    <option value="owasp_top10" className="bg-slate-800">OWASP Top 10 (20-40 min)</option>
                  </select>
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setScanModalVisible(false)}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                    Start Scan
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
