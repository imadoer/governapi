"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { calcImpactPoints } from "../../../../utils/score-utils";

// ==================== TYPES ====================

interface Vulnerability {
  id: number;
  title: string;
  vulnerability_type: string;
  severity: "critical" | "high" | "medium" | "low" | "info";
  cvss_score?: number;
  cwe_id?: string;
  affected_url?: string;
  affected_parameter?: string;
  description?: string;
  evidence?: string;
  remediation?: string;
  status: "open" | "acknowledged" | "in_progress" | "resolved" | "false_positive";
  scan_id?: number;
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

interface OWASPCategory {
  id: string;
  name: string;
  count: number;
  severity: string;
}

// ==================== TOAST HELPER ====================

function showToast(msg: string, type: "success" | "error" = "success") {
  const el = document.createElement("div");
  el.textContent = msg;
  el.className = `fixed top-6 right-6 z-[9999] px-5 py-3 rounded-lg text-sm font-medium shadow-lg transition-opacity duration-300 ${
    type === "success"
      ? "bg-emerald-600/90 text-white border border-emerald-400/30"
      : "bg-red-600/90 text-white border border-red-400/30"
  }`;
  document.body.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    setTimeout(() => el.remove(), 300);
  }, 2500);
}

// ==================== FIX GUIDES ====================

const VULN_GUIDES: Record<string, {
  description: string;
  fixes: { framework: string; code: string }[];
  docs: { label: string; url: string }[];
}> = {
  "Missing HSTS": {
    description: "Without HTTP Strict Transport Security, browsers allow connections over unencrypted HTTP. An attacker on the same network (coffee shop Wi-Fi, hotel, airport) can intercept all traffic between your users and your API, stealing tokens, passwords, and data in transit. This is one of the most exploited vulnerabilities in real-world attacks.",
    fixes: [
      { framework: "Express / Node.js", code: `const helmet = require('helmet');\napp.use(helmet.hsts({\n  maxAge: 31536000,\n  includeSubDomains: true\n}));` },
      { framework: "Nginx", code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` },
      { framework: "Apache", code: `Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"` },
      { framework: "Django", code: `# settings.py\nSECURE_HSTS_SECONDS = 31536000\nSECURE_HSTS_INCLUDE_SUBDOMAINS = True` },
    ],
    docs: [
      { label: "MDN: Strict-Transport-Security", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security" },
      { label: "OWASP: HSTS Cheat Sheet", url: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html" },
    ],
  },
  "Missing CSP": {
    description: "Without a Content Security Policy, your API has no defense against cross-site scripting (XSS). If an attacker can inject even one line of JavaScript — through a form field, URL parameter, or stored data — it will execute with full access to the user's session. CSP tells the browser which scripts are allowed to run, blocking everything else.",
    fixes: [
      { framework: "Express / Node.js", code: `const helmet = require('helmet');\napp.use(helmet.contentSecurityPolicy({\n  directives: {\n    defaultSrc: ["'self'"],\n    scriptSrc: ["'self'"],\n    styleSrc: ["'self'", "'unsafe-inline'"],\n  }\n}));` },
      { framework: "Nginx", code: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'" always;` },
      { framework: "Apache", code: `Header always set Content-Security-Policy "default-src 'self'; script-src 'self'"` },
      { framework: "Django", code: `# pip install django-csp\nMIDDLEWARE += ['csp.middleware.CSPMiddleware']\nCSP_DEFAULT_SRC = ("'self'",)\nCSP_SCRIPT_SRC = ("'self'",)` },
    ],
    docs: [
      { label: "MDN: Content-Security-Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP" },
      { label: "CSP Evaluator (Google)", url: "https://csp-evaluator.withgoogle.com/" },
    ],
  },
  "Missing X-Frame-Options": {
    description: "Without X-Frame-Options, your pages can be loaded inside invisible iframes on attacker-controlled websites. The attacker overlays their own UI on top, tricking users into clicking buttons they can't see — like 'Delete Account' or 'Transfer Funds'. This is called clickjacking and it's trivially easy to exploit.",
    fixes: [
      { framework: "Express / Node.js", code: `const helmet = require('helmet');\napp.use(helmet.frameguard({ action: 'deny' }));` },
      { framework: "Nginx", code: `add_header X-Frame-Options "DENY" always;` },
      { framework: "Apache", code: `Header always set X-Frame-Options "DENY"` },
      { framework: "Django", code: `# Enabled by default in Django\nX_FRAME_OPTIONS = 'DENY'` },
    ],
    docs: [
      { label: "MDN: X-Frame-Options", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options" },
      { label: "OWASP: Clickjacking", url: "https://owasp.org/www-community/attacks/Clickjacking" },
    ],
  },
  "Insecure CORS Configuration": {
    description: "An overly permissive CORS policy (Access-Control-Allow-Origin: *) means any website in the world can make requests to your API and read the responses. If your API returns user data, authentication tokens, or any sensitive information, a malicious site can steal it silently while the user browses.",
    fixes: [
      { framework: "Express / Node.js", code: `const cors = require('cors');\napp.use(cors({\n  origin: 'https://yourdomain.com',\n  credentials: true\n}));` },
      { framework: "Nginx", code: `add_header Access-Control-Allow-Origin "https://yourdomain.com" always;\nadd_header Access-Control-Allow-Credentials "true" always;` },
      { framework: "Django", code: `# pip install django-cors-headers\nCORS_ALLOWED_ORIGINS = [\n    "https://yourdomain.com",\n]\nCORS_ALLOW_CREDENTIALS = True` },
    ],
    docs: [
      { label: "MDN: CORS", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS" },
      { label: "OWASP: CORS Misconfig", url: "https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny" },
    ],
  },
  "Information Disclosure": {
    description: "Your server is revealing its software name and version in HTTP response headers (e.g., 'Server: nginx/1.21.3' or 'X-Powered-By: Express'). Attackers use this to look up known vulnerabilities for your exact software version. It's like leaving your house key under the mat — it makes their job much easier.",
    fixes: [
      { framework: "Express / Node.js", code: `app.disable('x-powered-by');\n// Or use helmet:\nconst helmet = require('helmet');\napp.use(helmet.hidePoweredBy());` },
      { framework: "Nginx", code: `server_tokens off;` },
      { framework: "Apache", code: `ServerTokens Prod\nServerSignature Off` },
    ],
    docs: [
      { label: "OWASP: Info Leakage", url: "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering" },
    ],
  },
  "Missing X-Content-Type-Options": {
    description: "Without the X-Content-Type-Options header, browsers may 'sniff' the content type of responses and interpret files differently than intended. An attacker could upload a file that looks like an image but contains JavaScript — the browser would execute it. This header tells the browser to trust the declared content type only.",
    fixes: [
      { framework: "Express / Node.js", code: `const helmet = require('helmet');\napp.use(helmet.noSniff());\n// Or manually:\napp.use((req, res, next) => {\n  res.setHeader('X-Content-Type-Options', 'nosniff');\n  next();\n});` },
      { framework: "Nginx", code: `add_header X-Content-Type-Options "nosniff" always;` },
      { framework: "Apache", code: `Header always set X-Content-Type-Options "nosniff"` },
    ],
    docs: [
      { label: "MDN: X-Content-Type-Options", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options" },
    ],
  },
};

// ==================== MAIN COMPONENT ====================

export function VulnerabilitiesPage({ company }: { company?: any }) {
  // ========== STATE ==========
  const [activeTab, setActiveTab] = useState("vulnerabilities");
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [filteredVulnerabilities, setFilteredVulnerabilities] = useState<Vulnerability[]>([]);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [owaspData, setOwaspData] = useState<OWASPCategory[]>([]);
  const [workflowModalVisible, setWorkflowModalVisible] = useState(false);
  const [jiraModalVisible, setJiraModalVisible] = useState(false);

  // Form state for JIRA modal
  const [jiraProject, setJiraProject] = useState("");
  const [jiraIssueType, setJiraIssueType] = useState("Bug");
  const [jiraPriority, setJiraPriority] = useState("High");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Sort state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const [fetchError, setFetchError] = useState(false);

  const safeFetch = async (url: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        headers: { "x-tenant-id": company?.id || "1", ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return await response.json();
    } catch {
      clearTimeout(timeout);
      return null;
    }
  };

  // ========== FETCH DATA ==========
  useEffect(() => {
    fetchVulnerabilities();
    fetchOwaspData();
  }, [company]);

  useEffect(() => {
    filterVulnerabilities();
  }, [vulnerabilities, searchText, severityFilter, statusFilter]);

  const fetchVulnerabilities = async () => {
    try {
      setLoading(true);
      setFetchError(false);
      const data = await safeFetch("/api/customer/vulnerabilities");
      if (data?.success) {
        setVulnerabilities(data.vulnerabilities || []);
      } else if (!data) {
        setFetchError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchOwaspData = async () => {
    const data = await safeFetch("/api/customer/vulnerabilities/owasp-breakdown");
    if (data?.success) {
      const raw = data.owaspCategories || data.breakdown || [];
      // Map API response {category, count, critical, high, medium, low}
      // to component's OWASPCategory {id, name, count, severity}
      setOwaspData(raw.map((cat: any, i: number) => ({
        id: cat.id || `V${String(i + 1).padStart(2, "0")}`,
        name: cat.name || cat.category || "Unknown",
        count: cat.count || 0,
        severity: cat.critical > 0 ? "critical" : cat.high > 0 ? "high" : cat.medium > 0 ? "medium" : cat.low > 0 ? "low" : "info",
      })));
    }
  };

  const filterVulnerabilities = () => {
    let filtered = [...vulnerabilities];

    if (searchText) {
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(searchText.toLowerCase()) ||
          v.vulnerability_type.toLowerCase().includes(searchText.toLowerCase()) ||
          v.cwe_id?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (severityFilter !== "all") {
      filtered = filtered.filter((v) => v.severity === severityFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((v) => v.status === statusFilter);
    }

    setFilteredVulnerabilities(filtered);
    setCurrentPage(1);
  };

  // ========== ACTIONS ==========
  const handleStatusChange = async (vulnId: number, newStatus: string, comment?: string) => {
    try {
      const response = await fetch(`/api/customer/vulnerabilities/${vulnId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": company?.id || "1",
          ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ status: newStatus, comment }),
      });

      if (response.ok) {
        showToast(`Vulnerability ${newStatus.replace("_", " ")}`);
        fetchVulnerabilities();
        setWorkflowModalVisible(false);
        setDrawerVisible(false);
      } else {
        showToast("Failed to update vulnerability status", "error");
      }
    } catch (error) {
      showToast("Failed to update vulnerability", "error");
    }
  };

  const handleCreateJiraTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVulnerability) return;
    if (!jiraProject) return;

    try {
      const response = await fetch("/api/integrations/jira/create-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": company?.id || "1",
          ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          vulnerabilityId: selectedVulnerability.id,
          project: jiraProject,
          issueType: jiraIssueType,
          priority: jiraPriority,
        }),
      });

      if (response.ok) {
        showToast("JIRA ticket created successfully");
        setJiraModalVisible(false);
        setJiraProject("");
        setJiraIssueType("Bug");
        setJiraPriority("High");
      } else {
        showToast("Failed to create JIRA ticket", "error");
      }
    } catch (error) {
      showToast("Failed to create JIRA ticket", "error");
    }
  };

  const handleExport = async (format: "pdf" | "json" | "csv") => {
    try {
      const response = await fetch(`/api/customer/vulnerabilities/export?format=${format}`, {
        headers: { "x-tenant-id": company?.id || "1", ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vulnerabilities_${Date.now()}.${format}`;
        a.click();
        showToast(`Vulnerabilities exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      showToast("Failed to export vulnerabilities", "error");
    }
  };

  // ========== UTILITY FUNCTIONS ==========
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "#ff4d4f";
      case "high":
        return "#fa8c16";
      case "medium":
        return "#faad14";
      case "low":
        return "#1890ff";
      case "info":
        return "#8c8c8c";
      default:
        return "#d9d9d9";
    }
  };

  const getSeverityClasses = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "info":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "acknowledged":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "resolved":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "false_positive":
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return "!";
      case "acknowledged":
        return "👁";
      case "in_progress":
        return "⏳";
      case "resolved":
        return "✓";
      case "false_positive":
        return "⚠";
      default:
        return "";
    }
  };

  const calculateSLA = (createdAt: string, severity: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const hoursOpen = (now.getTime() - created.getTime()) / (1000 * 60 * 60);

    let slaHours = 168;
    if (severity === "critical") slaHours = 24;
    else if (severity === "high") slaHours = 72;
    else if (severity === "medium") slaHours = 168;

    const slaRemaining = slaHours - hoursOpen;
    const slaPercent = Math.max(0, (slaRemaining / slaHours) * 100);

    return {
      remaining: slaRemaining,
      percent: slaPercent,
      breached: slaRemaining < 0,
    };
  };

  // ========== SORTING ==========
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortedData = () => {
    let data = [...filteredVulnerabilities];
    if (sortField) {
      data.sort((a, b) => {
        let cmp = 0;
        if (sortField === "impact") {
          cmp = calcImpactPoints(a) - calcImpactPoints(b);
        } else if (sortField === "severity") {
          const order: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1, info: 0 };
          cmp = order[a.severity] - order[b.severity];
        } else if (sortField === "created_at") {
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return sortDirection === "asc" ? cmp : -cmp;
      });
    } else {
      // Default sort: impact score descending
      data.sort((a, b) => calcImpactPoints(b) - calcImpactPoints(a));
    }
    return data;
  };

  // ========== PAGINATION ==========
  const sortedData = getSortedData();
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // ========== STATISTICS ==========
  const stats = {
    total: vulnerabilities.length,
    critical: vulnerabilities.filter((v) => v.severity === "critical").length,
    high: vulnerabilities.filter((v) => v.severity === "high").length,
    medium: vulnerabilities.filter((v) => v.severity === "medium").length,
    low: vulnerabilities.filter((v) => v.severity === "low").length,
    open: vulnerabilities.filter((v) => v.status === "open").length,
    acknowledged: vulnerabilities.filter((v) => v.status === "acknowledged").length,
    inProgress: vulnerabilities.filter((v) => v.status === "in_progress").length,
    resolved: vulnerabilities.filter((v) => v.status === "resolved").length,
  };

  // ========== SUB-COMPONENTS ==========

  const Pill = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${className}`}>
      {children}
    </span>
  );

  const ProgressBar = ({
    percent,
    color,
  }: {
    percent: number;
    color: string;
  }) => (
    <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, backgroundColor: color }}
      />
    </div>
  );

  const SortHeader = ({ field, label }: { field: string; label: string }) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider cursor-pointer hover:text-cyan-400 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-cyan-400">{sortDirection === "asc" ? "▲" : "▼"}</span>
        )}
      </span>
    </th>
  );

  // ========== TAB DEFINITIONS ==========
  const tabs = [
    { key: "vulnerabilities", label: "Vulnerabilities", icon: "🐛", badge: stats.open },
    { key: "owasp", label: "OWASP Top 10", icon: "🛡" },
    { key: "timeline", label: "Timeline", icon: "⏱" },
  ];

  // ========== RENDER ==========

  if (loading && vulnerabilities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-56 bg-slate-700/30 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-80 bg-slate-700/20 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-white/[0.06] bg-slate-800/30 p-5 space-y-3">
              <div className="h-3 w-16 bg-slate-700/30 rounded animate-pulse" />
              <div className="h-7 w-12 bg-slate-700/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-64 bg-slate-800/30 rounded-xl border border-white/[0.06] animate-pulse" />
      </div>
    );
  }

  if (fetchError && vulnerabilities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Vulnerability Scanner</h2>
          <p className="mt-2 text-slate-400 text-sm">Comprehensive vulnerability management and remediation tracking</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="text-4xl mb-4">🛡</span>
          <p className="text-[15px] text-slate-400 mb-1">Unable to load vulnerability data</p>
          <p className="text-[13px] text-slate-600 mb-6">This could be a temporary issue. Try refreshing.</p>
          <button
            onClick={fetchVulnerabilities}
            className="px-4 py-2 text-[13px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] rounded-lg border border-white/[0.06] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-orange-400 text-2xl">🐛</span>
              Vulnerability Scanner
            </h2>
            <p className="mt-2 text-slate-400 text-sm">
              Comprehensive vulnerability management and remediation tracking
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              className="bg-slate-800/60 border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/50"
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) handleExport(e.target.value as "pdf" | "json" | "csv");
                e.target.value = "";
              }}
            >
              <option value="" disabled>Export...</option>
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
            </select>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-300 hover:bg-slate-700/60 hover:border-cyan-500/30 transition-all text-sm"
              onClick={fetchVulnerabilities}
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin inline-block w-4 h-4 border-2 border-slate-500 border-t-cyan-400 rounded-full" />
              ) : (
                <span>↻</span>
              )}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KEY METRICS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Vulnerabilities", value: stats.total, icon: "🐛", color: "text-cyan-400" },
          { label: "Critical", value: stats.critical, icon: "‼", color: "text-red-400" },
          { label: "High", value: stats.high, icon: "⚠", color: "text-orange-400" },
          { label: "Open", value: stats.open, icon: "⏳", color: "text-yellow-400" },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-xl p-5"
          >
            <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
            <div className={`text-2xl font-bold ${stat.color} flex items-center gap-2`}>
              <span className="text-lg">{stat.icon}</span>
              {stat.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 mb-6 border-b border-white/10 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-5 py-3 text-sm font-medium rounded-t-lg transition-all flex items-center gap-2 ${
              activeTab === tab.key
                ? "text-cyan-400 bg-slate-800/40 border border-white/10 border-b-transparent -mb-px"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20"
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-red-500/80 text-white">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ==================== VULNERABILITIES TAB ==================== */}
      {activeTab === "vulnerabilities" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {/* FILTERS */}
          <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-[300px]">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="Search vulnerabilities..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                />
                {searchText && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-sm"
                    onClick={() => setSearchText("")}
                  >
                    ✕
                  </button>
                )}
              </div>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="acknowledged">Acknowledged</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="false_positive">False Positive</option>
              </select>
              <span className="text-xs text-slate-500">
                Showing {filteredVulnerabilities.length} of {vulnerabilities.length} vulnerabilities
              </span>
            </div>
          </div>

          {/* TABLE */}
          <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <span className="animate-spin inline-block w-8 h-8 border-3 border-slate-600 border-t-cyan-400 rounded-full" />
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <span className="text-4xl mb-3">📭</span>
                <p>No vulnerabilities found</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-slate-900/40">
                        <SortHeader field="impact" label="Impact" />
                        <SortHeader field="severity" label="Severity" />
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Title</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Affected</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-[100px]">SLA</th>
                        <SortHeader field="created_at" label="Discovered" />
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedData.map((vuln) => {
                        const sla = calculateSLA(vuln.created_at, vuln.severity);
                        return (
                          <tr
                            key={vuln.id}
                            className="hover:bg-slate-700/20 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400">+{calcImpactPoints(vuln)} pts</span>
                            </td>
                            <td className="px-4 py-3">
                              <Pill className={getSeverityClasses(vuln.severity)}>
                                {vuln.severity.toUpperCase()}
                              </Pill>
                            </td>
                            <td className="px-4 py-3 max-w-[280px]">
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-medium text-slate-200 truncate">{vuln.title}</span>
                                <div className="flex gap-1.5 flex-wrap">
                                  {vuln.cwe_id && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-white/5">
                                      {String(vuln.cwe_id).startsWith("CWE-") ? vuln.cwe_id : `CWE-${vuln.cwe_id}`}
                                    </span>
                                  )}
                                  {vuln.cvss_score !== undefined && vuln.cvss_score !== null && (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                        vuln.cvss_score >= 7
                                          ? "bg-red-500/20 text-red-400 border-red-500/30"
                                          : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                                      }`}
                                    >
                                      CVSS: {vuln.cvss_score}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Pill className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                {vuln.vulnerability_type}
                              </Pill>
                            </td>
                            <td className="px-4 py-3 max-w-[200px]">
                              <div className="flex flex-col gap-0.5">
                                {vuln.affected_url && (
                                  <code className="text-[11px] text-cyan-400/80 bg-slate-900/50 px-1.5 py-0.5 rounded truncate block">
                                    {vuln.affected_url}
                                  </code>
                                )}
                                {vuln.affected_parameter && (
                                  <span className="text-[11px] text-slate-500">Param: {vuln.affected_parameter}</span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Pill className={getStatusClasses(vuln.status)}>
                                {getStatusIcon(vuln.status)} {vuln.status.replace("_", " ").toUpperCase()}
                              </Pill>
                            </td>
                            <td className="px-4 py-3 w-[100px]">
                              <div
                                title={`${Math.abs(sla.remaining).toFixed(0)}h ${sla.breached ? "overdue" : "remaining"}`}
                              >
                                <ProgressBar
                                  percent={sla.percent}
                                  color={sla.breached ? "#ff4d4f" : sla.percent < 20 ? "#fa8c16" : "#52c41a"}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-400">
                              {new Date(vuln.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                                onClick={() => {
                                  setSelectedVulnerability(vuln);
                                  setDrawerVisible(true);
                                }}
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Rows per page:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="bg-slate-900/60 border border-white/10 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none"
                      >
                        {[10, 20, 50, 100].map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                      <span className="text-xs text-slate-500 px-3">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        className="px-3 py-1 rounded text-xs text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* ==================== OWASP TOP 10 TAB ==================== */}
      {activeTab === "owasp" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="flex flex-col gap-4">
              {owaspData.length > 0 ? (
                owaspData.map((category) => (
                  <div
                    key={category.id}
                    className="bg-slate-900/40 border border-white/5 rounded-lg p-4 flex items-center justify-between hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Pill className={getSeverityClasses(category.severity)}>
                        {category.id}
                      </Pill>
                      <span className="text-sm font-medium text-slate-200">{category.name}</span>
                    </div>
                    <span
                      className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: getSeverityColor(category.severity) }}
                    >
                      {category.count}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <span className="text-4xl mb-3">📭</span>
                  <p>No OWASP vulnerabilities found</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ==================== TIMELINE TAB ==================== */}
      {activeTab === "timeline" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-xl p-6">
            <div className="relative">
              {vulnerabilities
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 20)
                .map((vuln, idx, arr) => (
                  <div key={vuln.id} className="relative flex gap-6 pb-8 last:pb-0">
                    {/* Vertical line */}
                    {idx < arr.length - 1 && (
                      <div
                        className="absolute left-[7px] top-[20px] w-0.5 h-full"
                        style={{ backgroundColor: `${getSeverityColor(vuln.severity)}33` }}
                      />
                    )}
                    {/* Dot */}
                    <div className="relative flex-shrink-0 mt-1">
                      <div
                        className="w-4 h-4 rounded-full border-2"
                        style={{
                          borderColor: getSeverityColor(vuln.severity),
                          backgroundColor: `${getSeverityColor(vuln.severity)}40`,
                        }}
                      />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-slate-500 mb-1 block">
                        {new Date(vuln.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Pill className={getSeverityClasses(vuln.severity)}>
                          {vuln.severity.toUpperCase()}
                        </Pill>
                        <span className="text-sm font-medium text-slate-200">{vuln.title}</span>
                      </div>
                      <div className="mt-1">
                        <Pill className={getStatusClasses(vuln.status)}>
                          {vuln.status.replace("_", " ").toUpperCase()}
                        </Pill>
                      </div>
                    </div>
                  </div>
                ))}
              {vulnerabilities.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <span className="text-4xl mb-3">📭</span>
                  <p>No vulnerabilities to display</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ==================== VULNERABILITY DETAILS DRAWER ==================== */}
      <AnimatePresence>
        {drawerVisible && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[100]"
              onClick={() => setDrawerVisible(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-[720px] bg-slate-900 border-l border-white/10 z-[101] flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="text-orange-400">🐛</span>
                  Vulnerability Details
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    className="px-3 py-1.5 rounded-lg text-sm bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 transition-colors"
                    onClick={() => setWorkflowModalVisible(true)}
                  >
                    Change Status
                  </button>
                  <button
                    className="px-3 py-1.5 rounded-lg text-sm bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                    onClick={() => setJiraModalVisible(true)}
                  >
                    Create JIRA Ticket
                  </button>
                  <button
                    className="text-slate-400 hover:text-white text-xl px-2 transition-colors"
                    onClick={() => setDrawerVisible(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                {selectedVulnerability && (
                  <div className="flex flex-col gap-6">
                    {/* Header */}
                    <div>
                      <h4 className="text-xl font-semibold text-white mb-3">{selectedVulnerability.title}</h4>
                      <div className="flex gap-2 flex-wrap">
                        <Pill className={getSeverityClasses(selectedVulnerability.severity)}>
                          {selectedVulnerability.severity.toUpperCase()}
                        </Pill>
                        <Pill className={getStatusClasses(selectedVulnerability.status)}>
                          {selectedVulnerability.status.replace("_", " ").toUpperCase()}
                        </Pill>
                        {selectedVulnerability.cvss_score !== undefined && selectedVulnerability.cvss_score !== null && (
                          <Pill className="bg-red-500/20 text-red-400 border-red-500/30">
                            CVSS: {selectedVulnerability.cvss_score}
                          </Pill>
                        )}
                        {selectedVulnerability.cwe_id && (
                          <Pill className="bg-slate-700/50 text-slate-300 border-white/10">
                            {String(selectedVulnerability.cwe_id).startsWith("CWE-") ? selectedVulnerability.cwe_id : `CWE-${selectedVulnerability.cwe_id}`}
                          </Pill>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-white/10 my-0" />

                    {/* Details Key-Value Grid */}
                    <div className="grid grid-cols-1 gap-px bg-white/5 rounded-lg overflow-hidden border border-white/10">
                      {[
                        { label: "Type", value: selectedVulnerability.vulnerability_type },
                        {
                          label: "Affected URL",
                          value: selectedVulnerability.affected_url ? (
                            <code className="text-xs text-cyan-400/80 bg-slate-900/50 px-2 py-1 rounded">
                              {selectedVulnerability.affected_url}
                            </code>
                          ) : (
                            "N/A"
                          ),
                        },
                        ...(selectedVulnerability.affected_parameter
                          ? [{ label: "Parameter", value: selectedVulnerability.affected_parameter }]
                          : []),
                        {
                          label: "Discovered",
                          value: new Date(selectedVulnerability.created_at).toLocaleString(),
                        },
                        {
                          label: "Last Seen",
                          value: selectedVulnerability.last_seen
                            ? new Date(selectedVulnerability.last_seen).toLocaleString()
                            : new Date(selectedVulnerability.created_at).toLocaleString(),
                        },
                      ].map((item, i) => (
                        <div key={i} className="flex bg-slate-900/40">
                          <div className="w-40 flex-shrink-0 px-4 py-3 text-xs font-medium text-slate-400 bg-slate-800/30">
                            {item.label}
                          </div>
                          <div className="flex-1 px-4 py-3 text-sm text-slate-200">
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Description */}
                    {selectedVulnerability.description && (
                      <div className="bg-slate-800/30 border border-white/10 rounded-xl p-4">
                        <h5 className="text-sm font-semibold text-slate-300 mb-2">Description</h5>
                        <p className="text-sm text-slate-400 leading-relaxed">{selectedVulnerability.description}</p>
                      </div>
                    )}

                    {/* Evidence */}
                    {selectedVulnerability.evidence && (
                      <div className="bg-slate-800/30 border border-white/10 rounded-xl p-4">
                        <h5 className="text-sm font-semibold text-slate-300 mb-2">Evidence</h5>
                        <pre className="bg-slate-900/60 border border-white/5 rounded-lg p-3 overflow-auto text-xs text-slate-400 font-mono">
                          {selectedVulnerability.evidence}
                        </pre>
                      </div>
                    )}

                    {/* Remediation — rich fix guide */}
                    {(() => {
                      const guide = VULN_GUIDES[selectedVulnerability.vulnerability_type];
                      const userPlan = company?.subscriptionPlan || company?.plan || "free";
                      const canSeeFixes = userPlan !== "free";
                      return (
                        <div className="bg-slate-800/30 border border-white/10 rounded-xl p-4 space-y-4">
                          <h5 className="text-sm font-semibold text-slate-300">How to Fix</h5>

                          {/* Quick fix — first line always visible */}
                          {selectedVulnerability.remediation && (
                            <div>
                              <div className="text-[11px] font-medium text-gray-400 mb-1">Quick fix</div>
                              <p className="text-[12px] text-slate-300">{selectedVulnerability.remediation}</p>
                            </div>
                          )}

                          {/* Blurred gate for free users */}
                          {!canSeeFixes ? (
                            <div className="relative">
                              <div className="blur-[6px] pointer-events-none select-none opacity-60">
                                <div className="text-[11px] font-medium text-gray-400 mb-1">Why this matters</div>
                                <p className="text-[12px] text-slate-400">This vulnerability allows attackers to exploit your API by intercepting unencrypted traffic and performing man-in-the-middle attacks...</p>
                                <div className="text-[11px] font-medium text-gray-400 mt-3 mb-1">Code examples</div>
                                <pre className="text-[11px] text-slate-400 bg-black/30 rounded-lg p-3">{"// Express.js\napp.use(helmet.hsts({\n  maxAge: 31536000\n}));"}</pre>
                              </div>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-slate-900/90 border border-white/[0.08] rounded-xl px-5 py-4 text-center shadow-xl">
                                  <p className="text-[12px] text-gray-300 mb-2">Upgrade to Starter to see full fix instructions</p>
                                  <button className="px-4 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                                    Upgrade — $19/mo
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Rich description */}
                              {guide?.description && (
                                <div>
                                  <div className="text-[11px] font-medium text-gray-400 mb-1">Why this matters</div>
                                  <p className="text-[12px] text-slate-300 leading-relaxed">{guide.description}</p>
                                </div>
                              )}

                              {/* Code examples */}
                              {guide?.fixes && guide.fixes.length > 0 && (
                                <div>
                                  <div className="text-[11px] font-medium text-gray-400 mb-2">Code examples</div>
                                  <div className="space-y-2">
                                    {guide.fixes.map((fix: any) => (
                                      <div key={fix.framework}>
                                        <div className="text-[10px] text-cyan-400 font-medium mb-1">{fix.framework}</div>
                                        <pre className="text-[11px] text-slate-300 bg-black/30 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">{fix.code}</pre>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Reference links */}
                              {guide?.docs && guide.docs.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {guide.docs.map((doc: any) => (
                                    <a key={doc.url} href={doc.url} target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] text-gray-500 hover:text-white border border-white/[0.06] rounded-lg px-2 py-1 transition-colors">
                                      {doc.label} ↗
                                    </a>
                                  ))}
                                </div>
                              )}
                            </>
                          )}

                          {/* Fallback if no guide exists */}
                          {!guide && !selectedVulnerability.remediation && (
                            <p className="text-[12px] text-slate-500">No specific fix guide available for this vulnerability type.</p>
                          )}
                        </div>
                      );
                    })()}

                    {/* SLA Status */}
                    <div className="bg-slate-800/30 border border-white/10 rounded-xl p-4">
                      <h5 className="text-sm font-semibold text-slate-300 mb-3">SLA Status</h5>
                      {(() => {
                        const sla = calculateSLA(selectedVulnerability.created_at, selectedVulnerability.severity);
                        return (
                          <div className="flex flex-col gap-2">
                            <ProgressBar
                              percent={sla.percent}
                              color={sla.breached ? "#ff4d4f" : sla.percent < 20 ? "#fa8c16" : "#52c41a"}
                            />
                            <span className={`text-sm ${sla.breached ? "text-red-400" : "text-slate-500"}`}>
                              {sla.breached
                                ? `SLA breached by ${Math.abs(sla.remaining).toFixed(0)} hours`
                                : `${sla.remaining.toFixed(0)} hours remaining`}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== WORKFLOW MODAL ==================== */}
      <AnimatePresence>
        {workflowModalVisible && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[200]"
              onClick={() => setWorkflowModalVisible(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-white">Change Vulnerability Status</h3>
                  <button
                    className="text-slate-400 hover:text-white text-lg transition-colors"
                    onClick={() => setWorkflowModalVisible(false)}
                  >
                    ✕
                  </button>
                </div>

                {selectedVulnerability && (
                  <div className="flex flex-col gap-5">
                    {/* Alert */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg px-4 py-3 text-sm text-blue-400">
                      Current Status: {selectedVulnerability.status.replace("_", " ").toUpperCase()}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {[
                        { status: "acknowledged", label: "Acknowledge" },
                        { status: "in_progress", label: "Mark In Progress" },
                        { status: "resolved", label: "Mark Resolved" },
                      ].map((action) => (
                        <button
                          key={action.status}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            selectedVulnerability.status === action.status
                              ? "bg-cyan-600 text-white"
                              : "bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700"
                          }`}
                          onClick={() => handleStatusChange(selectedVulnerability.id, action.status)}
                        >
                          {action.label}
                        </button>
                      ))}
                      <button
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          selectedVulnerability.status === "false_positive"
                            ? "bg-red-600 text-white"
                            : "bg-slate-800 border border-red-500/30 text-red-400 hover:bg-red-900/30"
                        }`}
                        onClick={() => handleStatusChange(selectedVulnerability.id, "false_positive")}
                      >
                        Mark False Positive
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ==================== JIRA MODAL ==================== */}
      <AnimatePresence>
        {jiraModalVisible && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[200]"
              onClick={() => setJiraModalVisible(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-[201] flex items-center justify-center p-4"
            >
              <div className="bg-slate-900 border border-white/10 rounded-xl shadow-2xl w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold text-white">Create JIRA Ticket</h3>
                  <button
                    className="text-slate-400 hover:text-white text-lg transition-colors"
                    onClick={() => setJiraModalVisible(false)}
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateJiraTicket} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">
                      Project <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="PROJECT-KEY"
                      value={jiraProject}
                      onChange={(e) => setJiraProject(e.target.value)}
                      required
                      className="w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Issue Type</label>
                    <select
                      value={jiraIssueType}
                      onChange={(e) => setJiraIssueType(e.target.value)}
                      className="w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="Bug">Bug</option>
                      <option value="Task">Task</option>
                      <option value="Story">Story</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Priority</label>
                    <select
                      value={jiraPriority}
                      onChange={(e) => setJiraPriority(e.target.value)}
                      className="w-full bg-slate-800/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="Highest">Highest</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                    >
                      Create Ticket
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 transition-colors"
                      onClick={() => setJiraModalVisible(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
