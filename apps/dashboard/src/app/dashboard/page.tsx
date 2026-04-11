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
  CogIcon,
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
import { getLetterGrade, calcImpactPoints } from "../../utils/score-utils";

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

const AnalyticsInsightsPage = dynamic(() => import("./components/advanced/AnalyticsInsightsPage").then(m => ({ default: m.AnalyticsInsightsPage })), { loading: () => <PageSkeleton /> });
const DataManagementPage = dynamic(() => import("./components/advanced/DataManagementPage").then(m => ({ default: m.DataManagementPage })), { loading: () => <PageSkeleton /> });
const BillingSubscriptionPage = dynamic(() => import("./components/advanced/BillingSubscriptionPage").then(m => ({ default: m.BillingSubscriptionPage })), { loading: () => <PageSkeleton /> });
const EnterpriseSettingsPage = dynamic(() => import("./components/advanced/EnterpriseSettingsPage").then(m => ({ default: m.EnterpriseSettingsPage })), { loading: () => <PageSkeleton /> });
const SettingsPage = dynamic(() => import("./components/advanced/SettingsPage").then(m => ({ default: m.SettingsPage })), { loading: () => <PageSkeleton /> });
const AiAdvisor = dynamic(() => import("./components/advanced/AiAdvisor").then(m => ({ default: m.AiAdvisor })), { ssr: false });
import { UpgradeGate, planHasAccess } from "./components/advanced/UpgradeGate";

const SIDEBAR_ITEMS = [
  {
    category: "Dashboard",
    items: [{ id: "overview", label: "Overview", icon: ChartBarIcon }],
  },
  {
    category: "Security",
    items: [
      { id: "security-center", label: "Security Center", icon: ShieldCheckIcon },
      { id: "threat-surface", label: "Threat Surface", icon: BoltIcon },
      { id: "vulnerability-scanner", label: "Vulnerability Scanner", icon: FireIcon },
      { id: "api-discovery", label: "API Discovery", icon: GlobeAltIcon },
      { id: "custom-rules", label: "Security Policies", icon: CubeIcon },
    ],
  },
  {
    category: "Compliance",
    items: [
      { id: "compliance-hub", label: "Compliance Hub", icon: ChartBarIcon },
    ],
  },
  {
    category: "Monitoring",
    items: [
      { id: "performance-monitor", label: "Performance Monitor", icon: ChartBarIcon },
    ],
  },
  {
    category: "API Management",
    items: [
      { id: "api-management", label: "API Management", icon: GlobeAltIcon },
      { id: "webhook-center", label: "Webhook Center", icon: BoltIcon },
    ],
  },
  {
    category: "Insights & Data",
    items: [
      { id: "analytics-insights", label: "Analytics & Insights", icon: ChartBarIcon },
      { id: "data-management", label: "Data Management", icon: CubeIcon },
    ],
  },
  {
    category: "Integrations",
    items: [
      { id: "external-integrations", label: "External Integrations", icon: GlobeAltIcon },
    ],
  },
  {
    category: "Settings",
    items: [
      { id: "settings", label: "Settings", icon: CogIcon },
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
  const [onboardingError, setOnboardingError] = useState("");
  const [plan, setPlan] = useState("free");

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

      // Read ?view= query param to switch tabs (used by upgrade buttons from anywhere)
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get("view");
      if (viewParam === "billing") {
        setActiveFeature("billing-subscription");
      }
    }
  }, []);

  // SWR fetcher — uses session token for auth
  const dashFetcher = (url: string) => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") || "" : "";
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return fetch(url, { headers, credentials: "include" })
      .then((r) => r.json())
      .then((d) => (d.success ? d.dashboard : null));
  };

  const { data: swrDashboard, mutate: refreshDashboard } = useSWR(
    company?.id ? "/api/customer/dashboard" : null,
    dashFetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 },
  );

  // Fetch endpoints for overview
  const { data: endpointsData } = useSWR(
    company?.id ? "/api/customer/api-endpoints" : null,
    dashFetcher ? (url: string) => {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") || "" : "";
      return fetch(url, { headers: token ? { "Authorization": `Bearer ${token}` } : {}, credentials: "include" })
        .then((r) => r.json());
    } : null,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );
  const endpointsList = endpointsData?.endpoints || [];
  const endpointCount = endpointsData?.total || 0;

  // Sync SWR data into state (keeps existing renderContent() working)
  useEffect(() => {
    if (swrDashboard) {
      setDashboardStats(swrDashboard);
      setInitialLoading(false);
    }
  }, [swrDashboard]);

  // Fetch plan once
  useEffect(() => {
    if (company?.id) {
      fetch("/api/customer/plan", { headers: { "x-tenant-id": company.id.toString(), ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) }, credentials: "include" })
        .then((r) => r.json())
        .then((d) => { if (d.success) setPlan(d.plan); })
        .catch(() => {});
    }
  }, [company?.id]);

  const handleLogout = () => {
    sessionStorage.clear();
    // Clear auth cookies
    document.cookie = "session_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "__Secure-next-auth.session-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    // Hard redirect to ensure full page reload and state reset
    window.location.href = "/login";
  };

  const handleRefresh = () => refreshDashboard();

  if (initialLoading || !dashboardStats) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex">
        <div className="w-[280px] border-r border-white/[0.06] bg-black/20 p-6">
          <div className="h-7 w-32 bg-slate-700/30 rounded-lg animate-pulse mb-8" />
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-9 bg-slate-700/20 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="h-16 border-b border-white/[0.06] bg-black/10" />
          <div className="flex-1 p-8"><PageSkeleton /></div>
        </div>
      </div>
    );
  }

  const handleOnboardingScan = async () => {
    if (!addApiUrl || !company?.id) return;
    setOnboardingLoading(true);
    setOnboardingError("");

    let scanUrl = addApiUrl.trim();
    if (!scanUrl.startsWith("http://") && !scanUrl.startsWith("https://")) {
      scanUrl = "https://" + scanUrl;
    }

    try {
      setOnboardingStep(2);
      const sessionToken = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") || "" : "";

      const scanRes = await fetch("/api/customer/security-scans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken ? { "Authorization": `Bearer ${sessionToken}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ url: scanUrl, scanType: "quick" }),
      });

      let scanResult: any;
      try { scanResult = await scanRes.json(); } catch {
        setOnboardingStep(0);
        setOnboardingLoading(false);
        setOnboardingError("Server error — please try logging out and back in.");
        return;
      }

      if (!scanResult.success) {
        setOnboardingStep(0);
        setOnboardingLoading(false);
        setOnboardingError(scanResult.error || "Scan failed to start. Try logging out and back in.");
        return;
      }

      setOnboardingStep(3);

      const headers: Record<string, string> = {};
      if (sessionToken) headers["Authorization"] = `Bearer ${sessionToken}`;

      const poll = setInterval(async () => {
        try {
          const dashRes = await fetch("/api/customer/dashboard", { headers, credentials: "include" });
          const dashData = await dashRes.json();
          if (dashData.success && (dashData.stats?.totalScans > 0 || dashData.stats?.completedScans > 0)) {
            clearInterval(poll);
            setDashboardStats(dashData.dashboard || dashData);
            setOnboardingDone(true);
            setOnboardingLoading(false);
          }
        } catch {}
      }, 3000);

      setTimeout(() => {
        clearInterval(poll);
        setOnboardingLoading(false);
        setOnboardingDone(true);
        refreshDashboard();
      }, 60000);
    } catch (err) {
      console.error("Onboarding error:", err);
      setOnboardingStep(0);
      setOnboardingLoading(false);
      setOnboardingError("Something went wrong. Please try again.");
    }
  };

  // Full-screen onboarding when user has 0 scans
  const hasScans = (dashboardStats?.overview?.totalScans ?? dashboardStats?.stats?.totalScans ?? 0) > 0;
  if (!hasScans && !onboardingDone) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-cyan-500/[0.06] rounded-full blur-[180px]" />
          <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[400px] bg-emerald-500/[0.04] rounded-full blur-[140px]" />
          <div className="absolute inset-0" style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        </div>

        <div className="relative z-10 w-full max-w-lg mx-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl mb-5 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
              <ShieldCheckIcon className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Welcome to GovernAPI</h1>
            <p className="text-gray-400 text-[15px]">Let&apos;s check your first API in seconds</p>
          </div>

          {/* Main card */}
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 shadow-[0_8px_60px_rgba(0,0,0,0.4)]">
            {onboardingStep === 0 && (
              <div className="space-y-5">
                {onboardingError && (
                  <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-[12px] text-red-400">
                    {onboardingError}
                  </div>
                )}
                <div>
                  <label className="block text-[12px] text-gray-400 mb-2">Your API URL</label>
                  <input type="text" value={addApiUrl} onChange={(e) => { setAddApiUrl(e.target.value); setOnboardingError(""); }}
                    placeholder="https://api.yourcompany.com"
                    className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-[15px] placeholder-gray-600 focus:outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    onKeyDown={(e) => { if (e.key === "Enter" && addApiUrl) { setOnboardingStep(1); handleOnboardingScan(); } }}
                    autoFocus
                  />
                </div>
                <button onClick={() => { setOnboardingStep(1); handleOnboardingScan(); }} disabled={!addApiUrl}
                  className="relative w-full py-3.5 rounded-xl text-[14px] font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:shadow-[0_0_36px_rgba(6,182,212,0.45)] transition-all disabled:opacity-30 disabled:shadow-none overflow-hidden group">
                  <span className="relative z-10">Scan Now</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.15] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </button>

                {/* Benefits */}
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { icon: "🔍", text: "Find vulnerabilities in seconds" },
                    { icon: "🛡️", text: "Get fix instructions with code" },
                    { icon: "📊", text: "Track your score over time" },
                  ].map((b) => (
                    <div key={b.text} className="text-center">
                      <div className="text-[18px] mb-1.5">{b.icon}</div>
                      <div className="text-[10px] text-gray-500 leading-tight">{b.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {onboardingStep >= 1 && !onboardingDone && (
              <div className="text-center py-8">
                <div className="relative mx-auto mb-5" style={{ width: 48, height: 48 }}>
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-500 animate-spin" />
                  <ShieldCheckIcon className="absolute inset-2.5 w-7 h-7 text-cyan-400/60" />
                </div>
                <p className="text-white text-[15px] font-medium">
                  {onboardingStep <= 2 ? "Scanning your API..." : "Analyzing security..."}
                </p>
                <p className="text-gray-600 text-[12px] mt-1.5">Checking headers, misconfigurations, and vulnerabilities</p>
                <div className="flex justify-center gap-1 mt-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
              </div>
            )}

            {onboardingDone && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 mb-4">
                  <ShieldCheckIcon className="w-7 h-7 text-emerald-400" />
                </div>
                <p className="text-white text-[16px] font-semibold mb-2">Scan complete!</p>
                <p className="text-gray-500 text-[13px] mb-5">Your security dashboard is ready</p>
                <button onClick={() => { setActiveFeature("overview"); refreshDashboard(); }}
                  className="px-8 py-2.5 rounded-xl text-[13px] font-medium bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all">
                  View Dashboard →
                </button>
              </div>
            )}
          </div>

          {/* Social proof + skip */}
          <div className="text-center mt-6 space-y-3">
            <p className="text-[11px] text-gray-600">Join 100+ developers securing their APIs with GovernAPI</p>
            {onboardingStep === 0 && (
              <button onClick={() => setOnboardingDone(true)} className="text-[11px] text-gray-700 hover:text-gray-500 transition-colors">
                Skip — I&apos;ll explore first
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (activeFeature === "overview") {
      const score = dashboardStats.security.overallScore;
      const grade = getLetterGrade(score);
      const vulns = dashboardStats.topVulnerabilities || dashboardStats.latestScanReport?.vulnerabilities || [];
      const ranked = vulns.map((v: any) => ({ ...v, impactPts: calcImpactPoints(v) })).sort((a: any, b: any) => b.impactPts - a.impactPts);
      const top3 = ranked.slice(0, 3);
      const projectedScore = Math.min(100, score + top3.reduce((s: number, v: any) => s + v.impactPts, 0));
      const projectedGrade = getLetterGrade(projectedScore);
      const lastScan = dashboardStats.latestScanReport;
      const lastScanTime = lastScan?.completedAt ? new Date(lastScan.completedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : null;
      const hasScansData = dashboardStats.overview.totalScans > 0;
      const scoreRingColor = score >= 80 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
      const r = 62, circ = 2 * Math.PI * r;

      // Zero-scan state
      if (!hasScansData && !onboardingDone) {
        return (
          <div className="flex flex-col items-center justify-center py-16 max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(6,182,212,0.3)]">
              <ShieldCheckIcon className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Scan your first API to see your security score</h2>
            <p className="text-sm text-gray-500 mb-8">Paste any public API endpoint below. Takes about 10 seconds.</p>
            <div className="flex gap-3 w-full">
              <input type="url" value={addApiUrl} onChange={(e) => setAddApiUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && addApiUrl) { setOnboardingStep(1); handleOnboardingScan(); } }}
                placeholder="https://api.yourcompany.com"
                className="flex-1 px-4 py-3.5 bg-white/[0.04] border border-cyan-500/25 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/50 text-sm" autoFocus />
              <button onClick={() => { setOnboardingStep(1); handleOnboardingScan(); }} disabled={!addApiUrl || onboardingLoading}
                className="px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-xl font-semibold text-sm shadow-[0_0_24px_rgba(6,182,212,0.3)] disabled:opacity-40 flex items-center gap-2 whitespace-nowrap">
                {onboardingLoading ? <><div className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" /> Scanning...</> : "Scan My API"}
              </button>
            </div>
            {onboardingStep >= 1 && (
              <div className="flex items-center gap-2 mt-4 text-cyan-400 text-sm">
                <div className="animate-spin w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full" />
                <span>{onboardingStep <= 2 ? "Scanning your API..." : "Analyzing security..."}</span>
              </div>
            )}
            <p className="text-[11px] text-gray-700 mt-4">No access to your data. Scan is read-only.</p>
          </div>
        );
      }

      return (
        <div className="space-y-6">

          {/* ═══ HERO CARD: Score + Risk + Fixes as one unit ═══ */}
          <div className="bg-gradient-to-b from-white/[0.03] to-transparent border border-white/[0.06] rounded-2xl overflow-hidden">

            {/* Score + Status + Risk Summary */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-start gap-6">
                {/* Score ring */}
                <div className="relative w-[120px] h-[120px] shrink-0">
                  <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
                    <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                    <motion.circle cx="70" cy="70" r={r} fill="none" stroke={scoreRingColor} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
                      animate={{ strokeDashoffset: circ * (1 - Math.min(score, 100) / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-black ${grade.color}`}>{grade.letter}</span>
                    <span className="text-2xl font-bold text-white">{score}</span>
                    <span className="text-[9px] text-gray-500">/ 100</span>
                  </div>
                </div>

                {/* Status + risk summary */}
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-[17px] font-semibold text-white mb-1">
                    {score >= 90 ? "Your API is well protected" : score >= 70 ? "Good, but room to improve" : score >= 50 ? "Security risks detected" : "Critical security issues found"}
                  </h2>
                  {lastScanTime && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[11px] text-gray-500">Last scanned: {lastScanTime}</span>
                      <button onClick={handleRefresh} className="text-[11px] text-cyan-500 hover:text-cyan-400 font-medium transition-colors">Rescan</button>
                    </div>
                  )}
                  {vulns.length > 0 && (
                    <p className="text-[13px] text-gray-400 leading-relaxed">
                      {(() => {
                        const vulnTypes = [...new Set(vulns.map((v: any) => v.type || v.title))];
                        const endpoints = [...new Set(vulns.map((v: any) => { try { return new URL(v.affectedUrl || "").hostname; } catch { return ""; } }).filter(Boolean))];
                        const critCount = vulns.filter((v: any) => v.severity === "CRITICAL").length;
                        const highCount = vulns.filter((v: any) => v.severity === "HIGH").length;
                        let s = `We found ${vulns.length} issue${vulns.length > 1 ? "s" : ""}`;
                        if (endpoints.length > 0) s += ` across ${endpoints.length} endpoint${endpoints.length > 1 ? "s" : ""}`;
                        s += ". ";
                        if (critCount > 0) s += `${critCount} critical — fix immediately. `;
                        else if (highCount > 0) s += `${highCount} high-priority to address. `;
                        if (vulnTypes.length <= 3) s += `Main concerns: ${vulnTypes.join(", ")}.`;
                        else s += `Main concerns: ${vulnTypes.slice(0, 3).join(", ")}, +${vulnTypes.length - 3} more.`;
                        return s;
                      })()}
                    </p>
                  )}
                  {score >= 90 && vulns.length === 0 && (
                    <p className="text-[13px] text-emerald-400/80 leading-relaxed">No issues found. Security headers, encryption, and access controls are properly configured.</p>
                  )}
                </div>

                {/* Compact scan input — right side */}
                <div className="shrink-0 hidden lg:flex items-center gap-2">
                  <input type="url" value={addApiUrl} onChange={(e) => setAddApiUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && addApiUrl) { setOnboardingStep(1); handleOnboardingScan(); } }}
                    placeholder="Scan a URL..."
                    className="w-48 px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30" />
                  <button onClick={() => { setOnboardingStep(1); handleOnboardingScan(); }} disabled={!addApiUrl || onboardingLoading}
                    className="px-3 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-[12px] font-medium hover:bg-cyan-500/30 disabled:opacity-40 transition-colors whitespace-nowrap">
                    {onboardingLoading ? "..." : "Scan"}
                  </button>
                </div>
              </div>
            </div>

            {/* Top 3 Fixes — inside the hero card */}
            {top3.length > 0 && (
              <div className="px-6 pb-5 border-t border-white/[0.04] pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-medium text-gray-400">Fix these to improve your score</h3>
                  <span className="text-[12px]">
                    <span className={grade.color}>{grade.letter} {score}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    <span className={`font-bold ${projectedGrade.color}`}>{projectedGrade.letter} {projectedScore}</span>
                  </span>
                </div>
                <div className="space-y-1.5">
                  {top3.map((v: any, i: number) => (
                    <button key={v.id || i} onClick={() => setActiveFeature("vulnerability-scanner")}
                      className="w-full flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.04] transition-colors text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[13px] text-gray-600 font-mono w-4">{i + 1}.</span>
                        <div className="min-w-0">
                          <div className="text-[13px] text-white">{v.title}</div>
                          {(v.remediation || v.description) && <div className="text-[11px] text-gray-600 truncate">{(v.remediation || v.description).slice(0, 80)}</div>}
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400">+{v.impactPts} pts</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mobile scan input (hidden on lg) */}
          <div className="lg:hidden">
            <div className="flex gap-2">
              <input type="url" value={addApiUrl} onChange={(e) => setAddApiUrl(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && addApiUrl) { setOnboardingStep(1); handleOnboardingScan(); } }}
                placeholder="Scan another URL..."
                className="flex-1 px-3 py-2.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-[12px] text-white placeholder-gray-600 focus:outline-none focus:border-cyan-500/30" />
              <button onClick={() => { setOnboardingStep(1); handleOnboardingScan(); }} disabled={!addApiUrl || onboardingLoading}
                className="px-4 py-2.5 bg-cyan-500 text-white rounded-lg text-[12px] font-medium disabled:opacity-40">Scan</button>
            </div>
          </div>

          {/* 5. Pass/Fail Checklist */}
          {lastScan && (
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-[14px] font-semibold text-white mb-4">Security Checklist</h3>
              {(() => {
                const scanVulns = lastScan.vulnerabilities || [];
                const vulnTypes = new Set(scanVulns.map((v: any) => (v.type || v.title || "").toLowerCase()));
                const checks = [
                  { label: "HTTPS Encryption", pass: lastScan.url?.startsWith("https"), failMsg: "Not using HTTPS" },
                  { label: "Security Headers", pass: !["missing hsts", "missing csp", "missing x-frame-options", "missing x-content-type-options"].some(h => vulnTypes.has(h)), failMsg: "Missing security headers" },
                  { label: "Rate Limiting", pass: !vulnTypes.has("missing rate limiting") && !vulnTypes.has("no rate limiting detected"), failMsg: "No rate limiting detected" },
                  { label: "Server Info Hidden", pass: !vulnTypes.has("information disclosure") && !vulnTypes.has("server version disclosure") && !vulnTypes.has("technology stack disclosure"), failMsg: "Server details exposed" },
                  { label: "No Sensitive Files Exposed", pass: ![...vulnTypes].some(t => t.includes("exposed sensitive")), failMsg: "Sensitive files accessible" },
                  { label: "No Credential Leaks", pass: ![...vulnTypes].some(t => t.includes("credential leak")), failMsg: "Credentials found in response" },
                ];
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {checks.map((c) => (
                      <div key={c.label} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                        {c.pass ? (
                          <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><span className="text-emerald-400 text-[12px]">✓</span></span>
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0"><span className="text-red-400 text-[12px]">✗</span></span>
                        )}
                        <div>
                          <span className={`text-[13px] ${c.pass ? "text-gray-300" : "text-white"}`}>{c.label}</span>
                          {!c.pass && <div className="text-[11px] text-red-400/70">{c.failMsg}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. Your APIs */}
          {endpointsList.length > 0 && (
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[14px] font-semibold text-white">Your APIs</h3>
                <button onClick={() => setActiveFeature("api-management")} className="text-[11px] text-gray-500 hover:text-white transition-colors">Manage →</button>
              </div>
              <div className="space-y-2">
                {endpointsList.slice(0, 6).map((ep: any) => {
                  const s = ep.score ?? 0;
                  const c = s >= 80 ? "text-emerald-400 bg-emerald-500/15" : s >= 60 ? "text-amber-400 bg-amber-500/15" : "text-red-400 bg-red-500/15";
                  return (
                    <div key={ep.url} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
                      <span className="text-[12px] text-cyan-400 font-mono truncate max-w-[60%]">{ep.url}</span>
                      <div className="flex items-center gap-3">
                        {ep.vulnCount > 0 && <span className="text-[11px] text-gray-500">{ep.vulnCount} issue{ep.vulnCount !== 1 ? "s" : ""}</span>}
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${c}`}>{s}/100</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. Recent Activity */}
          {dashboardStats.recentActivity && dashboardStats.recentActivity.length > 0 && (
            <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-[14px] font-semibold text-white mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {dashboardStats.recentActivity.slice(0, 8).map((activity: any, i: number) => {
                  const host = (() => { try { return new URL(activity.subject || "").hostname; } catch { return activity.subject; } })();
                  return (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${activity.score >= 80 ? "bg-emerald-400" : activity.score >= 50 ? "bg-amber-400" : activity.score ? "bg-red-400" : "bg-gray-500"}`} />
                        <span className="text-[13px] text-white">{host}</span>
                        {activity.score != null && <span className="text-[11px] text-gray-500">Score: {activity.score}{activity.vulnCount > 0 ? ` · ${activity.vulnCount} issue${activity.vulnCount > 1 ? "s" : ""}` : ""}</span>}
                      </div>
                      <span className="text-[11px] text-gray-600 shrink-0">{activity.timeAgo}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 8. Security Timeline */}
          <ThreatTimeline companyId={company?.id?.toString()} />

          {/* 9. Go Deeper */}
          <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-[14px] font-semibold text-white mb-3">Want to go deeper?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "vulnerability-scanner", label: "Vulnerability Scanner", desc: "Full list of findings with fix guides", icon: BugAntIcon },
                { id: "compliance-hub", label: "Compliance Hub", desc: "OWASP, PCI DSS, SOC 2, GDPR, HIPAA", icon: ShieldCheckIcon },
                { id: "security-center", label: "Security Center", desc: "Trend charts, scan history, PDF export", icon: ChartBarIcon },
              ].map((link) => (
                <button key={link.id} onClick={() => setActiveFeature(link.id)}
                  className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-colors text-left">
                  <link.icon className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[13px] font-medium text-white">{link.label}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{link.desc}</div>
                  </div>
                </button>
              ))}
            </div>
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
        return <ComplianceHubPage company={company} plan={plan} />;
      case "webhook-center":
        return <WebhookCenterPage companyId={company?.id.toString()} />;
      case "threat-surface":
        return <ThreatSurfacePage companyId={company?.id.toString()} />;
      case "api-discovery":
        return <ApiDiscoveryPage companyId={company?.id.toString()} />;
      case "custom-rules":
        return planHasAccess(plan, "professional") ? <CustomRulesPage companyId={company?.id.toString()} /> : <UpgradeGate feature="Security Policies" requiredPlan="professional" currentPlan={plan} />;
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
      case "settings":
        return <SettingsPage companyId={company?.id.toString()} />;
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
          onNavigate={setActiveFeature}
        />

        <div className="flex-1 p-8 overflow-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeFeature}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, ease: "easeOut" }}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      {/* AI Advisor floating chat */}
      {company?.id && <AiAdvisor companyId={company.id.toString()} plan={plan} />}
    </div>
  );
}
