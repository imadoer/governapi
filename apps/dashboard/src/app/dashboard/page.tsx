// Cache bust 
"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ShieldCheckIcon,
  BoltIcon,
  BugAntIcon,
  ChartBarIcon,
  FireIcon,
  GlobeAltIcon,
  CubeIcon,
  ClockIcon,
  Bars3Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

// Overview components (always visible on dashboard)
import { HeaderBar } from "./components/advanced/HeaderBar";
import { SecurityScore } from "./components/advanced/SecurityScore";
import { MetricCard } from "./components/advanced/MetricCard";
import { ThreatTimeline } from "./components/advanced/ThreatTimeline";
import { ScoreBreakdown } from "./components/advanced/ScoreBreakdown";
import { PageSkeleton } from "./components/advanced/PageSkeleton";

// Lazy-load feature pages — only loaded when navigated to
const SecurityCenterPage = dynamic(() => import("./components/advanced/SecurityCenterPage").then(m => ({ default: m.SecurityCenterPage })), { loading: () => <PageSkeleton /> });
const VulnerabilitiesPage = dynamic(() => import("./components/advanced/VulnerabilitiesPage").then(m => ({ default: m.VulnerabilitiesPage })), { loading: () => <PageSkeleton /> });
const ExternalIntegrationsPage = dynamic(() => import("./components/advanced/ExternalIntegrationsPage").then(m => ({ default: m.ExternalIntegrationsPage })), { loading: () => <PageSkeleton /> });
const ApiManagementPage = dynamic(() => import("./components/advanced/ApiManagementPage").then(m => ({ default: m.ApiManagementPage })), { loading: () => <PageSkeleton /> });
const ThreatSurfacePage = dynamic(() => import("./components/advanced/ThreatSurfacePage"), { loading: () => <PageSkeleton /> });
const ApiDiscoveryPage = dynamic(() => import("./components/advanced/ApiDiscoveryPage"), { loading: () => <PageSkeleton /> });
const CustomRulesPage = dynamic(() => import("./components/advanced/CustomRulesPage").then(m => ({ default: m.CustomRulesPage })), { loading: () => <PageSkeleton /> });
const PerformanceMonitorPage = dynamic(() => import("./components/advanced/PerformanceMonitorPage").then(m => ({ default: m.PerformanceMonitorPage })), { loading: () => <PageSkeleton /> });
const ComplianceHubPage = dynamic(() => import("./components/advanced/ComplianceHubPage").then(m => ({ default: m.ComplianceHubPage })), { loading: () => <PageSkeleton /> });
const WebhookCenterPage = dynamic(() => import("./components/advanced/WebhookCenterPage").then(m => ({ default: m.WebhookCenterPage })), { loading: () => <PageSkeleton /> });
const RateLimitingPage = dynamic(() => import("./components/advanced/RateLimitingPage").then(m => ({ default: m.RateLimitingPage })), { loading: () => <PageSkeleton /> });
const AnalyticsInsightsPage = dynamic(() => import("./components/advanced/AnalyticsInsightsPage").then(m => ({ default: m.AnalyticsInsightsPage })), { loading: () => <PageSkeleton /> });
const DataManagementPage = dynamic(() => import("./components/advanced/DataManagementPage").then(m => ({ default: m.DataManagementPage })), { loading: () => <PageSkeleton /> });
const BillingSubscriptionPage = dynamic(() => import("./components/advanced/BillingSubscriptionPage").then(m => ({ default: m.BillingSubscriptionPage })), { loading: () => <PageSkeleton /> });
const EnterpriseSettingsPage = dynamic(() => import("./components/advanced/EnterpriseSettingsPage").then(m => ({ default: m.EnterpriseSettingsPage })), { loading: () => <PageSkeleton /> });

const SIDEBAR_ITEMS = [
  {
    category: "Dashboard",
    items: [{ id: "overview", label: "Overview", icon: ChartBarIcon }],
  },
  {
    category: "Integrations",
    items: [
      {
        id: "external-integrations",
        label: "External Integrations",
        icon: GlobeAltIcon,
      },
    ],
  },
  {
    category: "Security",
    items: [
      {
        id: "security-center",
        label: "Security Center",
        icon: ShieldCheckIcon,
      },
      {
        id: "threat-surface",
        label: "Threat Surface",
        icon: BoltIcon,
      },
      { id: "api-discovery", label: "API Discovery", icon: GlobeAltIcon },
    ],
  },
  {
    category: "Compliance & Scanning",
    items: [
      { id: "compliance-hub", label: "Compliance Hub", icon: ChartBarIcon },
      {
        id: "vulnerability-scanner",
        label: "Vulnerability Scanner",
        icon: FireIcon,
      },
    ],
  },
  {
    category: "Monitoring",
    items: [
      {
        id: "performance-monitor",
        label: "Performance Monitor",
        icon: ChartBarIcon,
      },
    ],
  },
  {
    category: "API Management",
    items: [
      { id: "api-management", label: "API Management", icon: GlobeAltIcon },
      { id: "custom-rules", label: "Security Policies", icon: CubeIcon },
      { id: "webhook-center", label: "Webhook Center", icon: BoltIcon },
      { id: "rate-limiting", label: "Rate Limiting", icon: ClockIcon },
    ],
  },
  {
    category: "Insights & Data",
    items: [
      {
        id: "analytics-insights",
        label: "Analytics & Insights",
        icon: ChartBarIcon,
      },
      { id: "data-management", label: "Data Management", icon: CubeIcon },
    ],
  },
  {
    category: "Settings",
    items: [
      {
        id: "billing-subscription",
        label: "Billing & Subscription",
        icon: ChartBarIcon,
      },
      {
        id: "enterprise-settings",
        label: "Enterprise Settings",
        icon: ShieldCheckIcon,
      },
    ],
  },
];

export default function AdvancedDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [activeFeature, setActiveFeature] = useState("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [addApiUrl, setAddApiUrl] = useState("");
  const [addApiName, setAddApiName] = useState("");
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  // All data comes from dashboardStats (fetched from /api/customer/dashboard)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = sessionStorage.getItem("user");
      const storedCompany = sessionStorage.getItem("company");

      if (storedUser && storedCompany) {
        setUser(JSON.parse(storedUser));
        setCompany(JSON.parse(storedCompany));
      } else {
        router.push("/login");
      }
    }
  }, []);

  // SWR fetcher — uses company.id as tenant header
  const dashFetcher = (url: string) =>
    fetch(url, { headers: { "x-tenant-id": company?.id?.toString() || "" } })
      .then((r) => r.json())
      .then((d) => (d.success ? d.dashboard : null));

  const { data: swrDashboard, mutate: refreshDashboard } = useSWR(
    company?.id ? "/api/customer/dashboard" : null,
    dashFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 },
  );

  // Sync SWR data into state (keeps existing renderContent() working)
  useEffect(() => {
    if (swrDashboard) {
      setDashboardStats(swrDashboard);
      setInitialLoading(false);
    }
  }, [swrDashboard]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  const handleRefresh = () => refreshDashboard();

  if (initialLoading || !dashboardStats) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex">
        {/* Static sidebar skeleton */}
        <div className="w-[280px] border-r border-white/[0.06] bg-black/20 p-6">
          <div className="h-7 w-32 bg-slate-700/30 rounded-lg animate-pulse mb-8" />
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-9 bg-slate-700/20 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        {/* Content skeleton */}
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-white/[0.06] bg-black/10" />
          <div className="flex-1 p-8">
            <PageSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const handleOnboardingAddApi = async () => {
    if (!addApiUrl || !company?.id) return;
    setOnboardingLoading(true);
    try {
      // Step 1: Register the endpoint
      const addRes = await fetch("/api/customer/api-endpoints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": company.id.toString(),
        },
        body: JSON.stringify({
          name: addApiName || new URL(addApiUrl).hostname,
          url: addApiUrl,
          method: "GET",
          description: "Added during onboarding",
        }),
      });
      const addResult = await addRes.json();
      if (!addResult.success) {
        alert(addResult.error || "Failed to add API");
        setOnboardingLoading(false);
        return;
      }
      setOnboardingStep(2);

      // Step 2: Auto-trigger a scan
      await fetch("/api/customer/security-scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": company.id.toString(),
        },
        body: JSON.stringify({ url: addApiUrl, scanType: "quick" }),
      });
      setOnboardingStep(3);

      // Step 3: Wait for scan to complete, then refresh dashboard
      const poll = setInterval(async () => {
        const dashRes = await fetch("/api/customer/dashboard", {
          headers: { "x-tenant-id": company.id.toString() },
        });
        const dashData = await dashRes.json();
        if (dashData.success && dashData.stats.totalScans > 0 && dashData.stats.postureScore > 0) {
          clearInterval(poll);
          setDashboardStats(dashData.dashboard);
          setOnboardingDone(true);
          setOnboardingLoading(false);
        }
      }, 3000);

      // Stop polling after 60s regardless
      setTimeout(() => {
        clearInterval(poll);
        setOnboardingLoading(false);
        setOnboardingDone(true);
        handleRefresh();
      }, 60000);
    } catch (err) {
      console.error("Onboarding error:", err);
      setOnboardingLoading(false);
    }
  };

  const renderContent = () => {
    if (activeFeature === "overview") {
      return (
        <div className="space-y-6">
          {/* Onboarding Card — shown when customer has no APIs and hasn't completed onboarding */}
          {dashboardStats.overview.totalApis === 0 && !onboardingDone && (
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[15px] font-semibold text-white">Get Started</h2>
                  <p className="text-[12px] text-gray-500 mt-0.5">Add an API endpoint to run your first security scan</p>
                </div>
                {/* Step indicators */}
                <div className="flex items-center gap-2">
                  {["Add API", "Scan", "Results"].map((label, i) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        onboardingStep > i ? "bg-emerald-500 text-white" :
                        onboardingStep === i ? "bg-cyan-500 text-white" :
                        "bg-slate-700 text-slate-500"
                      }`}>
                        {onboardingStep > i ? "✓" : i + 1}
                      </div>
                      <span className={`text-[11px] ${onboardingStep >= i ? "text-gray-300" : "text-gray-600"}`}>{label}</span>
                      {i < 2 && <div className={`w-4 h-px ${onboardingStep > i ? "bg-emerald-500" : "bg-slate-700"}`} />}
                    </div>
                  ))}
                </div>
              </div>

              {onboardingStep === 0 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={addApiName}
                    onChange={(e) => setAddApiName(e.target.value)}
                    placeholder="API name"
                    className="w-40 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-white/[0.12]"
                  />
                  <input
                    type="url"
                    value={addApiUrl}
                    onChange={(e) => setAddApiUrl(e.target.value)}
                    placeholder="https://api.yourcompany.com/endpoint"
                    className="flex-1 px-3 py-2 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-white/[0.12]"
                  />
                  <button
                    onClick={() => { setOnboardingStep(1); handleOnboardingAddApi(); }}
                    disabled={!addApiUrl || onboardingLoading}
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white text-[13px] font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    Scan
                  </button>
                </div>
              )}

              {onboardingStep >= 1 && onboardingStep < 3 && (
                <div className="flex items-center gap-2 text-cyan-400 text-[13px]">
                  <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
                  <span>{onboardingStep === 1 ? "Registering..." : "Scanning..."}</span>
                </div>
              )}

              {onboardingStep === 3 && onboardingDone && (
                <div className="flex items-center gap-2 text-emerald-400 text-[13px]">
                  <ShieldCheckIcon className="w-4 h-4" />
                  <span>Scan complete — your score is ready below.</span>
                </div>
              )}

              {onboardingStep === 3 && !onboardingDone && (
                <div className="flex items-center gap-2 text-cyan-400 text-[13px]">
                  <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
                  <span>Analyzing...</span>
                </div>
              )}
            </div>
          )}

          {/* Hero Security Score */}
          <SecurityScore
            score={dashboardStats.security.overallScore}
            totalEndpoints={dashboardStats.overview.totalApis}
            threatsBlocked={dashboardStats.overview.blockedThreats}
          />

          {/* Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={ShieldCheckIcon} label="Protected Endpoints" value={dashboardStats.overview.totalApis} delay={0.1} />
            <MetricCard icon={BoltIcon} label="Threats Blocked" value={dashboardStats.overview.blockedThreats} delay={0.15} />
            <MetricCard icon={BugAntIcon} label="Scans (7 days)" value={dashboardStats.overview.scansLast7Days} delay={0.2} />
            <MetricCard icon={ChartBarIcon} label="Total Scans" value={dashboardStats.overview.totalScans} delay={0.25} />
          </div>

          {/* Top Vulnerabilities — critical findings from latest scans */}
          {dashboardStats.topVulnerabilities && dashboardStats.topVulnerabilities.length > 0 && (
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-medium text-gray-400">Top Vulnerabilities</h3>
                <button onClick={() => setActiveFeature("vulnerability-scanner")} className="text-[11px] text-gray-500 hover:text-white transition-colors">View all →</button>
              </div>
              <div className="space-y-2">
                {dashboardStats.topVulnerabilities.slice(0, 3).map((v: any, i: number) => (
                  <div key={v.id || i} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        v.severity === "CRITICAL" ? "bg-red-500/15 text-red-400" :
                        v.severity === "HIGH" ? "bg-amber-500/15 text-amber-400" :
                        "bg-yellow-500/15 text-yellow-400"
                      }`}>{v.severity}</span>
                      <div className="min-w-0">
                        <div className="text-[13px] text-white truncate">{v.title}</div>
                        {v.affectedUrl && <div className="text-[11px] text-gray-600 truncate">{v.affectedUrl}</div>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Breakdown + Fix Instructions */}
          {dashboardStats.latestScanReport && dashboardStats.latestScanReport.vulnerabilities.length > 0 && (
            <ScoreBreakdown
              score={dashboardStats.security.overallScore}
              url={dashboardStats.latestScanReport.url}
              vulnerabilities={dashboardStats.latestScanReport.vulnerabilities}
              onNavigate={setActiveFeature}
            />
          )}

          {/* Quick Actions */}
          {dashboardStats.overview.totalScans > 0 && (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveFeature("security-center")} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors">View Full Report</button>
              {dashboardStats.topVulnerabilities?.length > 0 && (
                <button onClick={() => setActiveFeature("vulnerability-scanner")} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors">Fix Top Issue</button>
              )}
              <button onClick={() => setActiveFeature("security-center")} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors">Schedule Daily Scan</button>
              <button onClick={() => setActiveFeature("security-center")} className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white transition-colors">Export PDF</button>
            </div>
          )}

          {/* Threat Detection Timeline */}
          <ThreatTimeline companyId={company?.id?.toString()} />

          {/* Recent Activity — with score + issue count */}
          <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-[13px] font-medium text-gray-400 mb-4">Recent Activity</h3>
            {dashboardStats.recentActivity && dashboardStats.recentActivity.length > 0 ? (
              <div className="space-y-2">
                {dashboardStats.recentActivity.map((activity: any, i: number) => {
                  const url = activity.subject || "";
                  const host = (() => { try { return new URL(url).hostname; } catch { return url; } })();
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          activity.score >= 80 ? "bg-emerald-400" : activity.score >= 50 ? "bg-amber-400" : activity.score ? "bg-red-400" : "bg-gray-500"
                        }`} />
                        <div className="min-w-0">
                          <span className="text-[13px] text-white">{host}</span>
                          {activity.score != null && (
                            <span className="ml-2 text-[11px] text-gray-500">
                              Score: {activity.score}
                              {activity.vulnCount > 0 && ` · ${activity.vulnCount} issue${activity.vulnCount > 1 ? "s" : ""} found`}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-600 shrink-0 ml-2">{activity.timeAgo}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-[13px] text-gray-600">No activity yet</p>
                <p className="text-[11px] text-gray-700 mt-1">Scan an API to see activity here</p>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Feature pages
    switch (activeFeature) {
      case "external-integrations":
        return <ExternalIntegrationsPage companyId={company?.id.toString()} />;
      case "platform-api-keys":
        return <ApiManagementPage companyId={company?.id.toString()} />;
      case "security-center":
        return <SecurityCenterPage company={company} onNavigate={setActiveFeature} />
      case "vulnerability-scanner":
        return <VulnerabilitiesPage company={company} />;
      case "compliance-hub":
        return <ComplianceHubPage company={company} />;
      case "webhook-center":
        return <WebhookCenterPage companyId={company?.id.toString()} />;
      case "rate-limiting":
        return <RateLimitingPage companyId={company?.id.toString()} />;
      case "threat-surface":
        return <ThreatSurfacePage companyId={company?.id.toString()} />;
      case "api-discovery":
        return <ApiDiscoveryPage companyId={company?.id.toString()} />;
      case "custom-rules":
        return <CustomRulesPage companyId={company?.id.toString()} />;
      case "performance-monitor":
        return <PerformanceMonitorPage companyId={company?.id.toString()} />;
      case "analytics-insights":
        return <AnalyticsInsightsPage companyId={company?.id.toString()} />;
      case "data-management":
        return <DataManagementPage companyId={company?.id.toString()} />;
      case "billing-subscription":
        return <BillingSubscriptionPage companyId={company?.id.toString()} />;
      case "enterprise-settings":
        return <EnterpriseSettingsPage companyId={company?.id.toString()} />;
      case "api-management":
        return <ApiManagementPage companyId={company?.id.toString()} />;
      default:
        return (
          <div className="p-6 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">
              {
                SIDEBAR_ITEMS.flatMap((g) => g.items).find(
                  (i) => i.id === activeFeature,
                )?.label
              }
            </h3>
            <div className="text-gray-400">Feature page coming soon...</div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarCollapsed ? 64 : 260 }}
        transition={{ duration: 0.15 }}
        className="relative border-r border-white/[0.06] bg-[#0a0a0f] shrink-0 overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            {!sidebarCollapsed && (
              <span className="text-[15px] font-semibold text-white tracking-tight">GovernAPI</span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors text-gray-500"
            >
              {sidebarCollapsed ? (
                <Bars3Icon className="w-4 h-4" />
              ) : (
                <XMarkIcon className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="space-y-5">
            {SIDEBAR_ITEMS.map((group, idx) => (
              <div key={idx}>
                {!sidebarCollapsed && (
                  <div className="text-[11px] font-medium text-gray-600 uppercase tracking-wider mb-1.5 px-3">
                    {group.category}
                  </div>
                )}
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFeature === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveFeature(item.id)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-100
                          ${
                            isActive
                              ? "bg-white/[0.08] text-white"
                              : "text-gray-500 hover:bg-white/[0.04] hover:text-gray-300"
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <span className="flex-1 text-left text-[13px] font-medium">
                            {item.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <HeaderBar
          user={user}
          company={company}
          onLogout={handleLogout}
          onRefresh={handleRefresh}
        />

        <div className="flex-1 p-8 overflow-auto">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              style={{ willChange: "opacity" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
