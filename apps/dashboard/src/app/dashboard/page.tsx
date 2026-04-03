// Cache bust 
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

// Import all advanced components
import { HeaderBar } from "./components/advanced/HeaderBar";
import { SecurityScore } from "./components/advanced/SecurityScore";
import { MetricCard } from "./components/advanced/MetricCard";
import { ThreatTimeline } from "./components/advanced/ThreatTimeline";
import { ActivityFeed } from "./components/advanced/ActivityFeed";
import { AiInsightPanel } from "./components/advanced/AiInsightPanel";
import { ThreatMap } from "./components/advanced/ThreatMap";

// Import existing feature components
import { SecurityCenterPage } from "./components/advanced/SecurityCenterPage";
import { VulnerabilitiesPage } from "./components/advanced/VulnerabilitiesPage";
import { ExternalIntegrationsPage } from "./components/advanced/ExternalIntegrationsPage";
import { ApiManagementPage } from "./components/advanced/ApiManagementPage";
import { ThreatIntelligencePage } from "./components/advanced/ThreatIntelligencePage";
import BotProtectionPage from "./components/advanced/BotProtectionPage";
import { CustomRulesPage } from "./components/advanced/CustomRulesPage";
import { PerformanceMonitorPage } from "./components/advanced/PerformanceMonitorPage";
import { ComplianceHubPage } from "./components/advanced/ComplianceHubPage";
import { WebhookCenterPage } from "./components/advanced/WebhookCenterPage";
import { RateLimitingPage } from "./components/advanced/RateLimitingPage";
import { AnalyticsInsightsPage } from "./components/advanced/AnalyticsInsightsPage";
import { DataManagementPage } from "./components/advanced/DataManagementPage";
import { BillingSubscriptionPage } from "./components/advanced/BillingSubscriptionPage";
import { EnterpriseSettingsPage } from "./components/advanced/EnterpriseSettingsPage";
import { RealComplianceDashboard } from "./components/RealComplianceDashboard";
import { WebhookIntegration } from "./components/WebhookIntegration";
import { APIDiscovery } from "./components/APIDiscovery";

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
        id: "threat-intelligence",
        label: "Threat Intelligence",
        icon: BoltIcon,
      },
      { id: "bot-protection", label: "Bot Protection", icon: BugAntIcon },
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
      { id: "custom-rules", label: "Custom Rules", icon: CubeIcon },
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
  const [loading, setLoading] = useState(true);

  // Mock data generators
  const generateSparklineData = () =>
    Array.from({ length: 7 }, () => ({ value: Math.random() * 100 + 50 }));

  const generateThreatData = () =>
    Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      threats: Math.floor(Math.random() * 50) + 10,
      blocked: Math.floor(Math.random() * 45) + 5,
    }));

  const activityFeed = [
    {
      id: 1,
      type: "block" as const,
      message: "SQL Injection attempt blocked on /api/login",
      ip: "192.168.1.45",
      time: "2 min ago",
      severity: "critical" as const,
    },
    {
      id: 2,
      type: "scan" as const,
      message: "Security scan completed on /api/payments",
      time: "5 min ago",
      severity: "info" as const,
    },
    {
      id: 3,
      type: "threat" as const,
      message: "Rate limit exceeded from IP 10.0.0.23",
      time: "8 min ago",
      severity: "warning" as const,
    },
    {
      id: 4,
      type: "block" as const,
      message: "XSS attempt prevented on /api/user/profile",
      ip: "45.33.22.11",
      time: "12 min ago",
      severity: "critical" as const,
    },
    {
      id: 5,
      type: "compliance" as const,
      message: "SOC2 compliance check passed",
      time: "15 min ago",
      severity: "info" as const,
    },
    {
      id: 6,
      type: "threat" as const,
      message: "DDoS mitigation activated",
      ip: "203.0.113.0",
      time: "18 min ago",
      severity: "critical" as const,
    },
  ];

  const aiInsights = [
    {
      type: "anomaly" as const,
      title: "Unusual Traffic Spike Detected",
      description:
        "Traffic from Singapore increased 340% in the last hour. Possible credential stuffing attack.",
      action: "Investigate now",
    },
    {
      type: "recommendation" as const,
      title: "Security Score Improvement",
      description:
        "Enable rate limiting on /api/auth/login to prevent brute force attacks. Expected score increase: +8 points.",
      action: "Apply recommendation",
    },
    {
      type: "alert" as const,
      title: "New Vulnerability Pattern",
      description:
        "API endpoint /api/v2/users shows signs of NoSQL injection vulnerability based on recent traffic patterns.",
      action: "Review endpoint",
    },
  ];

  const threatLocations = [
    {
      lat: 1.3521,
      lng: 103.8198,
      city: "Singapore",
      country: "SG",
      threats: 234,
    },
    { lat: 51.5074, lng: -0.1278, city: "London", country: "UK", threats: 156 },
    {
      lat: 40.7128,
      lng: -74.006,
      city: "New York",
      country: "USA",
      threats: 189,
    },
    {
      lat: 35.6762,
      lng: 139.6503,
      city: "Tokyo",
      country: "Japan",
      threats: 98,
    },
    {
      lat: 37.7749,
      lng: -122.4194,
      city: "San Francisco",
      country: "USA",
      threats: 167,
    },
  ];

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

  useEffect(() => {
    if (!company?.id) return;

    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/customer/dashboard", {
          headers: { "x-tenant-id": company.id.toString() },
        });
        const result = await response.json();
        if (result.success) {
          setDashboardStats(result.dashboard);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [company]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/login");
  };

  const handleRefresh = () => {
    if (company?.id) {
      fetch("/api/customer/dashboard", {
        headers: { "x-tenant-id": company.id.toString() },
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.success) {
            setDashboardStats(result.dashboard);
          }
        });
    }
  };

  if (loading || !dashboardStats) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    );
  }

  const [onboardingStep, setOnboardingStep] = useState(0);
  const [addApiUrl, setAddApiUrl] = useState("");
  const [addApiName, setAddApiName] = useState("");
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

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
            <div className="bg-gradient-to-r from-cyan-900/40 to-violet-900/40 border border-cyan-500/30 rounded-2xl p-8 shadow-lg shadow-cyan-500/10">
              <div className="flex items-start gap-6">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">Get Started with GovernAPI</h2>
                  <p className="text-slate-300 mb-6">Add your API endpoint and we&apos;ll run a security scan immediately. Takes about 30 seconds.</p>

                  {/* Step indicators */}
                  <div className="flex items-center gap-3 mb-6">
                    {["Add your API", "Running scan", "View results"].map((label, i) => (
                      <div key={label} className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          onboardingStep > i ? "bg-green-500 text-white" :
                          onboardingStep === i ? "bg-cyan-500 text-white" :
                          "bg-slate-700 text-slate-400"
                        }`}>
                          {onboardingStep > i ? "✓" : i + 1}
                        </div>
                        <span className={`text-sm ${onboardingStep >= i ? "text-white" : "text-slate-500"}`}>{label}</span>
                        {i < 2 && <div className={`w-8 h-0.5 ${onboardingStep > i ? "bg-green-500" : "bg-slate-700"}`} />}
                      </div>
                    ))}
                  </div>

                  {onboardingStep === 0 && (
                    <div className="flex flex-col gap-3 max-w-xl">
                      <input
                        type="text"
                        value={addApiName}
                        onChange={(e) => setAddApiName(e.target.value)}
                        placeholder="API name (e.g. Users API)"
                        className="px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      />
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={addApiUrl}
                          onChange={(e) => setAddApiUrl(e.target.value)}
                          placeholder="https://api.yourcompany.com/endpoint"
                          className="flex-1 px-4 py-3 bg-slate-800/80 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                        />
                        <button
                          onClick={() => { setOnboardingStep(1); handleOnboardingAddApi(); }}
                          disabled={!addApiUrl || onboardingLoading}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-violet-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          Scan My API
                        </button>
                      </div>
                      <p className="text-xs text-slate-500">We&apos;ll check security headers, HTTPS, CORS, and common vulnerabilities on your public endpoint.</p>
                    </div>
                  )}

                  {onboardingStep >= 1 && onboardingStep < 3 && (
                    <div className="flex items-center gap-3 text-cyan-400">
                      <div className="animate-spin w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full" />
                      <span>{onboardingStep === 1 ? "Registering your API..." : "Running security scan..."}</span>
                    </div>
                  )}

                  {onboardingStep === 3 && onboardingDone && (
                    <div className="flex items-center gap-3 text-green-400">
                      <ShieldCheckIcon className="w-6 h-6" />
                      <span className="font-medium">Scan complete! Your security score is ready below.</span>
                    </div>
                  )}

                  {onboardingStep === 3 && !onboardingDone && (
                    <div className="flex items-center gap-3 text-cyan-400">
                      <div className="animate-spin w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full" />
                      <span>Analyzing results...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hero Security Score */}
          <SecurityScore
            score={dashboardStats.security.overallScore}
            totalEndpoints={dashboardStats.overview.totalApis}
            threatsBlocked={dashboardStats.overview.blockedThreats}
          />

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              icon={ShieldCheckIcon}
              label="Protected Endpoints"
              value={dashboardStats.overview.totalApis}
              change={12.5}
              trend="up"
              color="#06b6d4"
              sparklineData={generateSparklineData()}
              delay={0.1}
            />
            <MetricCard
              icon={BoltIcon}
              label="Threats Blocked"
              value={dashboardStats.overview.blockedThreats}
              change={8.3}
              trend="up"
              color="#10b981"
              sparklineData={generateSparklineData()}
              delay={0.2}
            />
            <MetricCard
              icon={BugAntIcon}
              label="Security Scans"
              value={dashboardStats.overview.scansLast7Days}
              change={-3.2}
              trend="down"
              color="#f59e0b"
              sparklineData={generateSparklineData()}
              delay={0.3}
            />
            <MetricCard
              icon={ChartBarIcon}
              label="API Requests/sec"
              value={dashboardStats.overview.totalApis * 142}
              change={15.7}
              trend="up"
              color="#8b5cf6"
              sparklineData={generateSparklineData()}
              delay={0.4}
            />
          </div>

          {/* Threat Timeline & AI Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ThreatTimeline data={generateThreatData()} />
            </div>
            <div>
              <AiInsightPanel insights={aiInsights} />
            </div>
          </div>

          {/* Activity Feed & Threat Map */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ActivityFeed activities={activityFeed} />
            <ThreatMap threats={threatLocations} />
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
        return <ExternalIntegrationsPage companyId={company?.id.toString()} />;
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
      case "threat-intelligence":
        return <ThreatIntelligencePage companyId={company?.id.toString()} />;
      case "bot-protection":
        return <BotProtectionPage companyId={company?.id.toString()} />;
      case "custom-rules":
        return <CustomRulesPage companyId={company?.id.toString()} />;
      case "performance-monitor":
        return <PerformanceMonitorPage companyId={company?.id.toString()} />;
      case "analytics-insights":
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
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="relative border-r border-white/10 backdrop-blur-xl bg-black/20"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            {!sidebarCollapsed && (
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent"
              >
                🛡️ GovernAPI
              </motion.h1>
            )}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400"
            >
              {sidebarCollapsed ? (
                <Bars3Icon className="w-5 h-5" />
              ) : (
                <XMarkIcon className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          <div className="space-y-6">
            {SIDEBAR_ITEMS.map((group, idx) => (
              <div key={idx}>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3"
                  >
                    {group.category}
                  </motion.div>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeFeature === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        onClick={() => setActiveFeature(item.id)}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all
                          ${
                            isActive
                              ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 text-cyan-400"
                              : "text-gray-400 hover:bg-white/5 hover:text-white"
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left text-sm font-medium">
                              {item.label}
                            </span>
                            {isActive && (
                              <ChevronRightIcon className="w-4 h-4" />
                            )}
                          </>
                        )}
                      </motion.button>
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
