"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheckIcon,
  FireIcon,
  BugAntIcon,
  ChartBarIcon,
  BoltIcon,
  GlobeAltIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { ForecastWidget } from "../../../components/shared/ForecastWidget";
import { IncidentBanner } from "../../../components/shared/IncidentBanner";

interface OverviewProps {
  apiInventory: any;
  complianceScores: any;
  policyViolations: any;
  costAnalytics: any;
  recentActivity: any;
  company?: any;
}

export function OverviewTab({
  apiInventory,
  complianceScores,
  policyViolations,
  costAnalytics,
  recentActivity,
  company,
}: OverviewProps) {
  const [securityMetrics, setSecurityMetrics] = useState<any>(null);
  const [forecastData, setForecastData] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([]);
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOverviewData();
  }, [company]);

  const fetchOverviewData = async () => {
    try {
      setRefreshing(true);
      const tenantId = company?.id || "1";

      const metricsRes = await fetch("/api/customer/security-metrics", {
        headers: { "x-tenant-id": tenantId },
      });
      const metricsData = await metricsRes.json();
      if (metricsData.success) setSecurityMetrics(metricsData.metrics);

      const forecastRes = await fetch("/api/forecast/security", {
        headers: { "x-tenant-id": tenantId },
      });
      const forecastResData = await forecastRes.json();
      if (forecastResData.success) setForecastData(forecastResData.forecast);

      const healthRes = await fetch("/api/system/health", {
        headers: { "x-tenant-id": tenantId },
      });
      const healthData = await healthRes.json();
      if (healthData.success) setSystemHealth(healthData.health);

      const alertsRes = await fetch("/api/dashboard/critical-alerts", {
        headers: { "x-tenant-id": tenantId },
      });
      const alertsData = await alertsRes.json();
      if (alertsData.success) setCriticalAlerts(alertsData.alerts || []);

      const incidentsRes = await fetch("/api/incidents?active=true", {
        headers: { "x-tenant-id": tenantId },
      });
      const incidentsData = await incidentsRes.json();
      if (incidentsData.success && incidentsData.incidents.length > 0) {
        setActiveIncident(incidentsData.incidents[0]);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 80) return "text-cyan-400";
    if (score >= 70) return "text-amber-400";
    return "text-red-400";
  };

  const timelineColors: Record<string, string> = {
    security: "bg-red-400",
    discovery: "bg-blue-400",
    policy: "bg-amber-400",
    compliance: "bg-emerald-400",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ChartBarIcon className="w-7 h-7 text-cyan-400" />
            Mission Control
          </h2>
          <p className="text-sm text-slate-400 mt-1">Executive overview of your security and compliance posture</p>
        </div>
        <button
          onClick={fetchOverviewData}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/10 transition-all disabled:opacity-50"
        >
          <ArrowPathIcon className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Incident Banner */}
      {activeIncident && (
        <IncidentBanner
          incident={activeIncident}
          onResolve={() => setActiveIncident(null)}
          onViewDetails={() => window.location.href = "/dashboard?tab=threat-intelligence"}
        />
      )}

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <span className="text-sm font-semibold text-red-400">Critical Alerts Requiring Attention</span>
          </div>
          <div className="space-y-2">
            {criticalAlerts.slice(0, 3).map((alert, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400">URGENT</span>
                <span className="text-sm text-slate-300">{alert.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShieldCheckIcon, label: "Security Score", value: securityMetrics?.securityScore || 0, suffix: "/100", trend: securityMetrics?.securityScoreTrend },
          { icon: FireIcon, label: "Threats Blocked Today", value: securityMetrics?.threatsBlockedToday || 0, color: "text-red-400", link: "/dashboard?tab=threat-intelligence" },
          { icon: BugAntIcon, label: "Open Vulnerabilities", value: securityMetrics?.openVulnerabilities || 0, color: "text-amber-400", badge: securityMetrics?.criticalVulns },
          { icon: ShieldCheckIcon, label: "Compliance Score", value: securityMetrics?.complianceScore || 0, suffix: "%", link: "/dashboard?tab=compliance-hub" },
        ].map((metric, i) => {
          const Icon = metric.icon;
          const color = metric.color || getScoreColor(metric.value);
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-5 text-center"
            >
              <Icon className={`w-8 h-8 mx-auto mb-3 ${color}`} />
              <div className={`text-3xl font-bold ${color}`}>
                {metric.value}{metric.suffix || ""}
              </div>
              <div className="text-xs text-slate-400 mt-1">{metric.label}</div>
              {metric.trend !== undefined && (
                <div className={`flex items-center justify-center gap-1 mt-2 text-xs ${metric.trend > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {metric.trend > 0 ? <ArrowTrendingUpIcon className="w-3 h-3" /> : <ArrowTrendingDownIcon className="w-3 h-3" />}
                  {Math.abs(metric.trend)}%
                </div>
              )}
              {metric.badge !== undefined && metric.badge > 0 && (
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-red-500/20 text-red-400">
                  {metric.badge} Critical
                </span>
              )}
              {metric.link && (
                <a href={metric.link} className="block mt-2 text-xs text-cyan-400 hover:text-cyan-300">View Details →</a>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Forecasting */}
      {forecastData && (
        <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <BoltIcon className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">GovernIQ Predictive Forecasts</h3>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AI-Powered
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ForecastWidget
              title="Security Score (7 days)"
              currentValue={forecastData.securityScore.current}
              predictedValue={forecastData.securityScore.predicted}
              confidence={forecastData.securityScore.confidence}
              trend={forecastData.securityScore.trend}
            />
            <ForecastWidget
              title="Vulnerabilities (7 days)"
              currentValue={forecastData.vulnerabilities.current}
              predictedValue={forecastData.vulnerabilities.predicted}
              confidence={forecastData.vulnerabilities.confidence}
              trend={forecastData.vulnerabilities.trend}
            />
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-300 mb-2">Cost Forecast (This Month)</p>
              <div className="text-xl font-bold text-white">${costAnalytics?.totalMonthly || 0}</div>
              <p className="text-xs text-slate-500 mt-1">
                Projected: ${((costAnalytics?.totalMonthly || 0) * 1.12).toFixed(0)}
              </p>
              <span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-400">
                12% increase projected
              </span>
            </div>
          </div>
        </div>
      )}

      {/* System Health */}
      {systemHealth && (
        <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Health Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Security Scanner", ok: systemHealth.scanner },
              { label: "Threat Intelligence", ok: systemHealth.threatIntel },
              { label: "Compliance Engine", ok: systemHealth.compliance },
              { label: "Bot Protection", ok: systemHealth.botProtection },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <span className={`inline-block w-3 h-3 rounded-full mb-2 ${s.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                <p className="text-sm text-slate-300">{s.label}</p>
                <span className={`inline-block mt-1 px-2.5 py-0.5 text-[10px] font-bold rounded-full ${s.ok ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {s.ok ? "OPERATIONAL" : "DOWN"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { label: "Start Security Scan", icon: FireIcon, href: "/dashboard?tab=security-center", primary: true },
            { label: "View Vulnerabilities", icon: BugAntIcon, href: "/dashboard?tab=vulnerability-scanner" },
            { label: "View Live Threats", icon: GlobeAltIcon, href: "/dashboard?tab=threat-intelligence" },
            { label: "Check Compliance", icon: ShieldCheckIcon, href: "/dashboard?tab=compliance-hub" },
            { label: "Manage APIs", icon: ChartBarIcon, href: "/dashboard?tab=api-management" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <a
                key={action.label}
                href={action.href}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  action.primary
                    ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white hover:shadow-lg"
                    : "bg-white/5 border border-white/10 text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </a>
            );
          })}
        </div>
      </div>

      {/* Two column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Inventory */}
        <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">API Inventory</h3>
            <a href="/dashboard?tab=api-management" className="text-xs text-cyan-400 hover:text-cyan-300">View All</a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-2">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06b6d4" strokeWidth="3"
                    strokeDasharray={`${Math.round((apiInventory.classified / apiInventory.total) * 100)} ${100 - Math.round((apiInventory.classified / apiInventory.total) * 100)}`}
                    strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-bold text-white">{Math.round((apiInventory.classified / apiInventory.total) * 100)}%</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">Classification Status</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Critical APIs", value: apiInventory.critical },
                { label: "Internal APIs", value: apiInventory.internal },
                { label: "External APIs", value: apiInventory.external },
                { label: "Unclassified", value: apiInventory.unclassified, warn: true },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm">
                  <span className="text-slate-400">{item.label}</span>
                  <span className={`font-semibold ${item.warn ? "text-amber-400" : "text-white"}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Compliance Status */}
        <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">Compliance Status</h3>
            <a href="/dashboard?tab=compliance-hub" className="text-xs text-cyan-400 hover:text-cyan-300">Configure</a>
          </div>
          <div className="space-y-4">
            {complianceScores.map((framework: any, index: number) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-semibold text-white">{framework.framework}</span>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-xs ${framework.trend === "up" ? "text-emerald-400" : framework.trend === "down" ? "text-red-400" : "text-slate-400"}`}>
                      {framework.trend === "up" ? <ArrowTrendingUpIcon className="w-3 h-3" /> : framework.trend === "down" ? <ArrowTrendingDownIcon className="w-3 h-3" /> : null}
                      {Math.abs(framework.change)}%
                    </span>
                    <span className="text-sm font-bold text-white">{framework.score}%</span>
                  </div>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${framework.score >= 80 ? "bg-emerald-400" : "bg-amber-400"}`}
                    style={{ width: `${framework.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Policy Violations */}
      <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Active Policy Violations</h3>
          <a href="/dashboard?tab=custom-rules" className="text-xs text-cyan-400 hover:text-cyan-300">View All</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["ID", "API", "Policy", "Severity", "Age", "Action"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {policyViolations?.map((v: any) => (
                <tr key={v.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-400 font-mono">{v.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{v.api}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{v.policy}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                      v.severity === "critical" ? "bg-red-500/15 text-red-400" :
                      v.severity === "high" ? "bg-orange-500/15 text-orange-400" :
                      "bg-slate-500/15 text-slate-400"
                    }`}>
                      {v.severity.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-400">{v.age}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-3 text-xs">
                      <button className="text-cyan-400 hover:text-cyan-300">Review</button>
                      <button className="text-slate-400 hover:text-white">Exempt</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cost + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Analytics */}
        <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">API Cost Analytics</h3>
            <span className="text-xs text-slate-500">This Month</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-2xl font-bold text-white">${costAnalytics.totalMonthly.toLocaleString()}</div>
              <p className="text-xs text-slate-400">Total API Costs</p>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">${costAnalytics.savings.toLocaleString()}</div>
              <p className="text-xs text-slate-400">Cost Savings</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-4 space-y-2">
            {[
              { label: "Legitimate Traffic", value: costAnalytics.legitimate },
              { label: "Suspicious Traffic", value: costAnalytics.suspicious, color: "text-amber-400" },
              { label: "Blocked Threats", value: costAnalytics.blocked, color: "text-red-400" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-slate-400">{item.label}</span>
                <span className={item.color || "text-white"}>${item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="space-y-0">
            {recentActivity?.map((activity: any, index: number) => (
              <div key={index} className="flex gap-3 pb-4 last:pb-0">
                <div className="flex flex-col items-center">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${timelineColors[activity.type] || "bg-slate-400"}`} />
                  {index < recentActivity.length - 1 && <div className="w-px flex-1 bg-white/10 mt-1" />}
                </div>
                <div className="pb-2">
                  <p className="text-xs text-slate-500">{activity.time}</p>
                  <p className="text-sm text-slate-300">{activity.event}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
