"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  BeakerIcon,
  ClipboardDocumentIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CommandLineIcon,
} from "@heroicons/react/24/outline";

interface PlatformApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  ipWhitelist: string[];
  expiresAt: string | null;
  isActive: boolean;
  lastUsed: string | null;
  usageCount: number;
  createdAt: string;
}

interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: string;
  status: string;
  scan_count: number;
  last_scan_date: string | null;
  avg_security_score: number | null;
  vulnerability_count: number;
}

// Toast notification component
function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-[100] px-5 py-3 rounded-xl text-sm font-medium shadow-2xl backdrop-blur-xl border ${
        type === "success"
          ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
          : "bg-red-500/20 border-red-500/30 text-red-300"
      }`}
    >
      {message}
    </motion.div>
  );
}

// Method tag colors
function MethodTag({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-500/15 text-blue-400",
    POST: "bg-emerald-500/15 text-emerald-400",
    PUT: "bg-amber-500/15 text-amber-400",
    PATCH: "bg-amber-500/15 text-amber-400",
    DELETE: "bg-red-500/15 text-red-400",
  };
  const cls = colors[method] || "bg-cyan-500/15 text-cyan-400";
  return (
    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${cls}`}>
      {method}
    </span>
  );
}

const PERMISSION_OPTIONS = [
  { value: "read", label: "Read" },
  { value: "write", label: "Write" },
  { value: "scan", label: "Scan" },
  { value: "monitor", label: "Monitor" },
  { value: "admin", label: "Admin" },
];

function formatNextRun(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffH = Math.round(diffMs / 3600000);
  if (diffH < 1) return "Less than 1 hour";
  if (diffH < 24) return `In ${diffH} hour${diffH === 1 ? "" : "s"}`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return "Tomorrow at " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }) + " UTC";
  if (diffD < 7) return `In ${diffD} days`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " at 2:00 AM UTC";
}

export function ApiManagementPage({ companyId }: { companyId: string }) {
  // Platform API Keys state
  const [platformKeys, setPlatformKeys] = useState<PlatformApiKey[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([
    "read",
  ]);
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(1000);
  const [newKeyIpWhitelist, setNewKeyIpWhitelist] = useState<string>("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  // API Discovery state
  const [discoverDomain, setDiscoverDomain] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoveredApis, setDiscoveredApis] = useState<any[]>([]);

  // API Endpoints state
  const [apiEndpoints, setApiEndpoints] = useState<ApiEndpoint[]>([]);
  const [schedules, setSchedules] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState("platform-keys");

  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showToast = useCallback(
    (message: string, type: "success" | "error") => {
      setToast({ message, type });
    },
    [],
  );

  const [fetchError, setFetchError] = useState(false);

  const safeFetch = async (url: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url, {
        headers: { "x-tenant-id": companyId },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return await response.json();
    } catch {
      clearTimeout(timeout);
      return null;
    }
  };

  const fetchPlatformKeys = async () => {
    const data = await safeFetch("/api/customer/platform-api-keys");
    if (data?.success) {
      setPlatformKeys(data.apiKeys || []);
    }
  };

  const fetchApiEndpoints = async () => {
    const data = await safeFetch("/api/customer/api-endpoints");
    if (data?.success) {
      setApiEndpoints(data.endpoints || []);
    }
  };

  const fetchSchedules = async () => {
    const data = await safeFetch("/api/customer/scan-schedules");
    if (data?.success) {
      setSchedules(data.schedules || {});
    }
  };

  const updateSchedule = async (url: string, frequency: string) => {
    try {
      const resp = await fetch("/api/customer/scan-schedules", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ url, frequency }),
      });
      const data = await resp.json();
      if (data.success) {
        setSchedules((prev) => ({ ...prev, [url]: { ...prev[url], frequency, nextRunAt: data.schedule.nextRunAt } }));
        showToast(`Schedule updated: ${frequency === "manual" ? "Manual only" : frequency}`, "success");
      } else {
        showToast(data.error || "Failed to update schedule", "error");
      }
    } catch {
      showToast("Failed to update schedule", "error");
    }
  };

  useEffect(() => {
    if (companyId) {
      setFetchError(false);
      Promise.all([fetchPlatformKeys(), fetchApiEndpoints(), fetchSchedules()])
        .catch(() => setFetchError(true))
        .finally(() => setLoading(false));
    }
  }, [companyId]);

  const handleCreatePlatformKey = async () => {
    if (!newKeyName) {
      showToast("Please enter a key name", "error");
      return;
    }

    setSubmitting(true);
    try {
      const ipWhitelist = newKeyIpWhitelist
        .split(",")
        .map((ip) => ip.trim())
        .filter((ip) => ip.length > 0);

      const response = await fetch("/api/customer/platform-api-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          name: newKeyName,
          permissions: newKeyPermissions,
          rateLimit: newKeyRateLimit,
          ipWhitelist: ipWhitelist.length > 0 ? ipWhitelist : null,
          expiresInDays: 365,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedKey(data.apiKey.key);
        showToast("API key created successfully!", "success");
        fetchPlatformKeys();
      } else {
        showToast(data.error || "Failed to create API key", "error");
      }
    } catch (error) {
      showToast("Failed to create API key", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDiscoverApis = async () => {
    if (!discoverDomain) {
      showToast("Please enter a domain", "error");
      return;
    }

    setDiscovering(true);
    try {
      const response = await fetch(
        `/api/customer/api-discovery?domain=${encodeURIComponent(discoverDomain)}`,
        {
          headers: { "x-tenant-id": companyId },
        },
      );
      const data = await response.json();

      if (data.success) {
        setDiscoveredApis(data.discovery.discoveredEndpoints || []);
        showToast(
          `Discovered ${data.discovery.discoveredEndpoints?.length || 0} APIs!`,
          "success",
        );
      } else {
        showToast(data.error || "Discovery failed", "error");
      }
    } catch (error) {
      showToast("Failed to discover APIs", "error");
    } finally {
      setDiscovering(false);
    }
  };

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(keyId);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const closeKeyModal = () => {
    setShowNewKeyModal(false);
    setNewKeyName("");
    setNewKeyPermissions(["read"]);
    setNewKeyRateLimit(1000);
    setNewKeyIpWhitelist("");
    setGeneratedKey(null);
  };

  const togglePermission = (perm: string) => {
    setNewKeyPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-8 w-48 bg-slate-700/30 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-72 bg-slate-700/20 rounded animate-pulse" />
        </div>
        <div className="h-12 bg-slate-800/50 rounded-xl animate-pulse" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/30 rounded-xl border border-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (fetchError && platformKeys.length === 0 && apiEndpoints.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">API Management</h1>
          <p className="text-slate-400">Manage your GovernAPI platform keys and discover APIs to monitor</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <KeyIcon className="w-10 h-10 text-slate-600 mb-4" />
          <p className="text-[15px] text-slate-400 mb-1">Unable to load API management data</p>
          <p className="text-[13px] text-slate-600 mb-6">This could be a temporary issue. Try refreshing.</p>
          <button
            onClick={() => { setLoading(true); setFetchError(false); fetchPlatformKeys(); fetchApiEndpoints().finally(() => setLoading(false)); }}
            className="px-4 py-2 text-[13px] font-medium text-white bg-white/[0.06] hover:bg-white/[0.1] rounded-lg border border-white/[0.06] transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      key: "platform-keys",
      icon: <KeyIcon className="w-5 h-5" />,
      label: "Your GovernAPI Keys",
    },
    {
      key: "api-discovery",
      icon: <MagnifyingGlassIcon className="w-5 h-5" />,
      label: "Discover APIs",
    },
    {
      key: "monitored-apis",
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      label: `Monitored APIs (${apiEndpoints.length})`,
    },
    {
      key: "cicd",
      icon: <CommandLineIcon className="w-5 h-5" />,
      label: "CI/CD Integration",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">API Management</h1>
        <p className="text-slate-400">
          Manage your GovernAPI platform keys and discover APIs to monitor
        </p>
      </div>

      {/* Custom Tabs */}
      <div>
        <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-white/5 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Platform Keys Tab */}
        {activeTab === "platform-keys" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Platform Keys Header */}
            <div className="flex items-center justify-between">
              <p className="text-slate-400">
                API keys to authenticate with GovernAPI
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowNewKeyModal(true)}
                className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Generate New Key
              </motion.button>
            </div>

            {/* Platform Keys List */}
            <div className="space-y-3">
              {platformKeys.map((key, index) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {key.name}
                        </h3>
                        {key.isActive ? (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-400">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-red-500/15 text-red-400">
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <code className="px-3 py-1 bg-slate-900 rounded text-cyan-400 font-mono">
                          {key.keyPrefix}••••••••••••••••
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(key.keyPrefix, key.id)
                          }
                          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        >
                          {copiedKeyId === key.id ? (
                            <CheckIcon className="w-4 h-4 text-green-500" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span>
                          Permissions: {key.permissions.join(", ")}
                        </span>
                        <span>•</span>
                        <span>Rate Limit: {key.rateLimit ? `${key.rateLimit}/hr` : "Unlimited"}</span>
                        <span>•</span>
                        <span>Used: {key.usageCount} times</span>
                        {key.lastUsed && (
                          <>
                            <span>•</span>
                            <span>
                              Last used:{" "}
                              {new Date(key.lastUsed).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}

              {platformKeys.length === 0 && (
                <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                  <KeyIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    No API keys yet. Generate your first key to get started.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* API Discovery Tab */}
        {activeTab === "api-discovery" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                Scan Domain for APIs
              </h3>
              <p className="text-slate-400 mb-6">
                Enter a domain to automatically discover API endpoints via
                OpenAPI/Swagger documentation
              </p>

              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <GlobeAltIcon className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="api.example.com"
                    value={discoverDomain}
                    onChange={(e) => setDiscoverDomain(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleDiscoverApis();
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDiscoverApis}
                  disabled={discovering}
                  className="px-8 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
                >
                  {discovering ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />{" "}
                      Scanning...
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="w-5 h-5" /> Discover
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {discoveredApis.length > 0 && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4">
                  Discovered APIs ({discoveredApis.length})
                </h3>
                <div className="space-y-2">
                  {discoveredApis.map((api, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <MethodTag method={api.method} />
                            <span className="text-white font-mono">
                              {api.path}
                            </span>
                          </div>
                          {api.description && (
                            <p className="text-sm text-slate-400">
                              {api.description}
                            </p>
                          )}
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30"
                        >
                          Add to Monitor
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Monitored APIs Tab */}
        {activeTab === "monitored-apis" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {apiEndpoints.map((endpoint: any, index) => {
              const url = endpoint.url || endpoint.path;
              const sched = schedules[url];
              const freq = sched?.frequency || "manual";
              const nextRun = sched?.nextRunAt;
              const score = endpoint.score ?? endpoint.avg_security_score;

              return (
                <motion.div
                  key={endpoint.id || url}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          (score ?? 0) >= 70 ? "bg-emerald-500/15 text-emerald-400" :
                          (score ?? 0) >= 40 ? "bg-amber-500/15 text-amber-400" :
                          "bg-red-500/15 text-red-400"
                        }`}>
                          {score ?? "—"}
                        </span>
                        <span className="text-white font-mono text-sm truncate">{url}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[12px] text-slate-400">
                        <span>{endpoint.scanCount ?? endpoint.scan_count} scans</span>
                        {(endpoint.vulnCount ?? endpoint.vulnerability_count) > 0 && (
                          <>
                            <span>•</span>
                            <span className="text-red-400">
                              {endpoint.vulnCount ?? endpoint.vulnerability_count} vulns
                            </span>
                          </>
                        )}
                        {endpoint.lastScanned && (
                          <>
                            <span>•</span>
                            <span>Last: {new Date(endpoint.lastScanned).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      {/* Next scheduled scan */}
                      {freq !== "manual" && nextRun && (
                        <div className="flex items-center gap-1.5 mt-2 text-[11px] text-cyan-400/80">
                          <ClockIcon className="w-3.5 h-3.5" />
                          <span>Next scan: {formatNextRun(nextRun)}</span>
                        </div>
                      )}
                    </div>

                    {/* Schedule dropdown */}
                    <div className="shrink-0">
                      <select
                        value={freq}
                        onChange={(e) => updateSchedule(url, e.target.value)}
                        className="px-3 py-1.5 text-[11px] font-medium bg-slate-700/50 border border-white/[0.06] text-gray-300 rounded-lg focus:outline-none focus:border-cyan-500/30 appearance-none cursor-pointer"
                      >
                        <option value="manual">Manual only</option>
                        <option value="daily">Daily (2 AM UTC)</option>
                        <option value="weekly">Weekly (Mon 2 AM)</option>
                        <option value="6h">Every 6 hours</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {apiEndpoints.length === 0 && (
              <div className="text-center py-16 bg-slate-800/30 rounded-2xl">
                <ShieldCheckIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">
                  No APIs being monitored yet. Scan an endpoint from Security Center to start monitoring.
                </p>
              </div>
            )}
          </motion.div>
        )}
        {/* CI/CD Integration Tab */}
        {activeTab === "cicd" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-2">CI/CD Security Gate</h3>
              <p className="text-sm text-slate-400 mb-6">
                Add a security check to your CI/CD pipeline. The check fails if any CRITICAL vulnerabilities exist or if a security policy with &quot;Fail CI/CD&quot; action is triggered.
              </p>

              <div className="space-y-2 mb-6">
                <div className="text-[12px] text-gray-400 mb-1">Endpoint</div>
                <code className="block px-4 py-2.5 bg-slate-900/50 border border-white/[0.06] rounded-xl text-cyan-400 font-mono text-[13px]">
                  GET http://146.190.99.58:3000/api/ci/check
                </code>
                <div className="text-[11px] text-gray-600">Requires: <code className="text-gray-400">Authorization: Bearer gov_live_...</code></div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="text-[12px] text-gray-400 mb-1">Response</div>
                <pre className="px-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-[11px] text-gray-300 font-mono overflow-x-auto">{`{
  "pass": true,
  "score": 72,
  "vulnerabilities": { "critical": 0, "high": 3, "medium": 5, "low": 2 },
  "violations": []
}`}</pre>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Pipeline Snippets</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-medium text-white">GitHub Actions</span>
                    <button onClick={() => { navigator.clipboard.writeText(`- name: Security Check\n  run: |\n    RESULT=$(curl -s -H "Authorization: Bearer $GOVERNAPI_KEY" http://146.190.99.58:3000/api/ci/check)\n    PASS=$(echo $RESULT | jq -r '.pass')\n    if [ "$PASS" != "true" ]; then echo "Security check failed"; exit 1; fi`); showToast("Copied!", "success"); }}
                      className="text-[10px] text-gray-500 hover:text-white transition-colors">Copy</button>
                  </div>
                  <pre className="px-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-[11px] text-emerald-400/80 font-mono overflow-x-auto whitespace-pre">{`- name: Security Check
  run: |
    RESULT=$(curl -s -H "Authorization: Bearer $GOVERNAPI_KEY" \\
      http://146.190.99.58:3000/api/ci/check)
    PASS=$(echo $RESULT | jq -r '.pass')
    if [ "$PASS" != "true" ]; then
      echo "Security check failed"
      echo $RESULT | jq .
      exit 1
    fi`}</pre>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-medium text-white">GitLab CI</span>
                    <button onClick={() => { navigator.clipboard.writeText(`security_check:\n  script:\n    - 'RESULT=$(curl -s -H "Authorization: Bearer $GOVERNAPI_KEY" http://146.190.99.58:3000/api/ci/check)'\n    - 'echo $RESULT | jq -e ".pass == true"'`); showToast("Copied!", "success"); }}
                      className="text-[10px] text-gray-500 hover:text-white transition-colors">Copy</button>
                  </div>
                  <pre className="px-4 py-3 bg-slate-900/50 border border-white/[0.06] rounded-xl text-[11px] text-amber-400/80 font-mono overflow-x-auto whitespace-pre">{`security_check:
  script:
    - 'RESULT=$(curl -s -H "Authorization: Bearer $GOVERNAPI_KEY"
        http://146.190.99.58:3000/api/ci/check)'
    - 'echo $RESULT | jq -e ".pass == true"'`}</pre>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Platform Key Modal */}
      <AnimatePresence>
        {showNewKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeKeyModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="relative w-full max-w-[600px] bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">
                  {generatedKey
                    ? "API Key Created!"
                    : "Generate New Platform API Key"}
                </h2>
                <button
                  onClick={closeKeyModal}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {generatedKey ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-yellow-400 font-semibold mb-2">
                        Save this key securely!
                      </p>
                      <p className="text-sm text-yellow-400/80">
                        This is the only time you&apos;ll see the full key.
                        Store it in a secure location.
                      </p>
                    </div>

                    <div className="relative">
                      <textarea
                        value={generatedKey}
                        readOnly
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-cyan-400 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                      />
                      <button
                        onClick={() =>
                          copyToClipboard(generatedKey, "generated")
                        }
                        className="absolute top-2 right-2 p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        {copiedKeyId === "generated" ? (
                          <CheckIcon className="w-4 h-4 text-green-500" />
                        ) : (
                          <ClipboardDocumentIcon className="w-4 h-4 text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Key Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g., Production API Key"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Permissions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PERMISSION_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => togglePermission(opt.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              newKeyPermissions.includes(opt.value)
                                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                                : "bg-slate-900/50 text-slate-400 border border-white/10 hover:border-white/20"
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Rate Limit (requests/hour)
                      </label>
                      <input
                        type="number"
                        value={newKeyRateLimit}
                        onChange={(e) =>
                          setNewKeyRateLimit(parseInt(e.target.value))
                        }
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        IP Whitelist (optional, comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="192.168.1.0/24, 10.0.0.1"
                        value={newKeyIpWhitelist}
                        onChange={(e) => setNewKeyIpWhitelist(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
                <button
                  onClick={closeKeyModal}
                  className="px-5 py-2.5 text-sm font-medium text-slate-400 hover:text-white bg-slate-700/50 hover:bg-slate-700 border border-white/10 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={
                    generatedKey ? closeKeyModal : handleCreatePlatformKey
                  }
                  disabled={submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-cyan-500 hover:bg-cyan-600 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  )}
                  {generatedKey ? "Done" : "Generate Key"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
