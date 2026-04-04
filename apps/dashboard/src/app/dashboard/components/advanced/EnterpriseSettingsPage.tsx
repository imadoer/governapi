"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import {
  CogIcon,
  ShieldCheckIcon,
  UsersIcon,
  BellIcon,
  ClockIcon,
  KeyIcon,
  ArrowPathIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface EnterpriseSettings {
  ssoEnabled: boolean;
  ipWhitelist: string[];
  customBranding: boolean;
  auditLogging: boolean;
  dataRetentionDays: number;
  apiRateLimits: {
    requests_per_minute: number;
    burst_limit: number;
  };
  securityPolicies: {
    password_policy: string;
    mfa_required: boolean;
    session_timeout: number;
  };
}

interface Usage {
  totalUsers: number;
  totalApis: number;
  scansLast30Days: number;
  requestsLast30Days: number;
}

export function EnterpriseSettingsPage({ companyId }: { companyId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<EnterpriseSettings | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [activeTab, setActiveTab] = useState("security");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/enterprise-settings", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();

      if (data.success) {
        setSettings(data.enterpriseSettings);
        setUsage(data.usage);
        setCompanyName(data.companyInfo?.name || "");
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchSettings();
  }, [companyId]);

  const handleSaveSettings = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch("/api/customer/enterprise-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          ssoEnabled: settings.ssoEnabled,
          ipWhitelist: settings.ipWhitelist,
          customBranding: settings.customBranding,
          auditLogging: settings.auditLogging,
          dataRetentionDays: settings.dataRetentionDays,
          apiRateLimits: {
            requestsPerMinute: settings.apiRateLimits.requests_per_minute,
            burstLimit: settings.apiRateLimits.burst_limit,
          },
          securityPolicies: {
            passwordPolicy: settings.securityPolicies.password_policy,
            mfaRequired: settings.securityPolicies.mfa_required,
            sessionTimeout: settings.securityPolicies.session_timeout,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Settings saved successfully!", "success");
        setSettings(data.enterpriseSettings);
      } else {
        showToast(data.error || "Failed to save settings", "error");
      }
    } catch (error) {
      showToast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!settings) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-white">Enterprise subscription required</p>
      </div>
    );
  }

  const tabs = [
    { key: "security", label: "Security Policies" },
    { key: "data", label: "Data & Compliance" },
    { key: "api", label: "API Configuration" },
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-lg backdrop-blur-xl border border-white/10 ${
              toast.type === "success" ? "bg-emerald-500/90" : "bg-red-500/90"
            }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Enterprise Settings
          </h1>
          <p className="text-slate-400">
            Configure advanced security and compliance settings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <CheckCircleIcon className="w-5 h-5" />
            )}
            Save Changes
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchSettings}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <UsersIcon className="w-8 h-8 text-cyan-500 mb-3" />
          <p className="text-sm text-slate-400">Total Users</p>
          <p className="text-3xl font-bold text-white mt-1">
            {usage?.totalUsers || 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <CogIcon className="w-8 h-8 text-green-500 mb-3" />
          <p className="text-sm text-slate-400">Total APIs</p>
          <p className="text-3xl font-bold text-white mt-1">
            {usage?.totalApis || 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <ShieldCheckIcon className="w-8 h-8 text-purple-500 mb-3" />
          <p className="text-sm text-slate-400">Scans (30d)</p>
          <p className="text-3xl font-bold text-white mt-1">
            {usage?.scansLast30Days || 0}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <ArrowPathIcon className="w-8 h-8 text-orange-500 mb-3" />
          <p className="text-sm text-slate-400">Requests (30d)</p>
          <p className="text-3xl font-bold text-white mt-1">
            {usage?.requestsLast30Days || 0}
          </p>
        </motion.div>
      </div>

      {/* Settings Tabs */}
      <div>
        <div className="flex gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                activeTab === tab.key
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/25"
                  : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700 border border-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                Authentication & Access
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div>
                    <p className="text-white font-semibold">
                      Single Sign-On (SSO)
                    </p>
                    <p className="text-sm text-slate-400">
                      Enable SAML-based SSO authentication
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, ssoEnabled: !settings.ssoEnabled })}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      settings.ssoEnabled ? "bg-cyan-500" : "bg-slate-600"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      settings.ssoEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div>
                    <p className="text-white font-semibold">
                      Require Multi-Factor Authentication
                    </p>
                    <p className="text-sm text-slate-400">
                      Force MFA for all users
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        securityPolicies: {
                          ...settings.securityPolicies,
                          mfa_required: !settings.securityPolicies.mfa_required,
                        },
                      })
                    }
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      settings.securityPolicies.mfa_required ? "bg-cyan-500" : "bg-slate-600"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      settings.securityPolicies.mfa_required ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-white font-semibold mb-3">
                    Password Policy
                  </p>
                  <select
                    value={settings.securityPolicies.password_policy}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        securityPolicies: {
                          ...settings.securityPolicies,
                          password_policy: e.target.value,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="basic" className="bg-slate-800">Basic (8+ characters)</option>
                    <option value="standard" className="bg-slate-800">Standard (12+ chars, mixed case)</option>
                    <option value="strict" className="bg-slate-800">Strict (16+ chars, special chars required)</option>
                  </select>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-white font-semibold mb-3">
                    Session Timeout (seconds)
                  </p>
                  <input
                    type="number"
                    min={300}
                    max={86400}
                    value={settings.securityPolicies.session_timeout}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        securityPolicies: {
                          ...settings.securityPolicies,
                          session_timeout: Number(e.target.value) || 3600,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Range: 5 minutes to 24 hours
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "data" && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                Data Management
              </h3>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div>
                    <p className="text-white font-semibold">
                      Audit Logging
                    </p>
                    <p className="text-sm text-slate-400">
                      Log all security events and actions
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, auditLogging: !settings.auditLogging })}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      settings.auditLogging ? "bg-cyan-500" : "bg-slate-600"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      settings.auditLogging ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>

                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-white font-semibold mb-3">
                    Data Retention Period (days)
                  </p>
                  <input
                    type="number"
                    min={30}
                    max={3650}
                    value={settings.dataRetentionDays}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        dataRetentionDays: Number(e.target.value) || 90,
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Range: 30 days to 10 years
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
                  <div>
                    <p className="text-white font-semibold">
                      Custom Branding
                    </p>
                    <p className="text-sm text-slate-400">
                      Use custom logo and colors
                    </p>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, customBranding: !settings.customBranding })}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      settings.customBranding ? "bg-cyan-500" : "bg-slate-600"
                    }`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                      settings.customBranding ? "translate-x-5" : "translate-x-0.5"
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-6">
                Rate Limits
              </h3>

              <div className="space-y-6">
                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-white font-semibold mb-3">
                    Requests Per Minute
                  </p>
                  <input
                    type="number"
                    min={100}
                    max={10000}
                    value={settings.apiRateLimits.requests_per_minute}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        apiRateLimits: {
                          ...settings.apiRateLimits,
                          requests_per_minute: Number(e.target.value) || 1000,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="p-4 bg-slate-900/50 rounded-xl">
                  <p className="text-white font-semibold mb-3">
                    Burst Limit
                  </p>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={settings.apiRateLimits.burst_limit}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        apiRateLimits: {
                          ...settings.apiRateLimits,
                          burst_limit: Number(e.target.value) || 100,
                        },
                      })
                    }
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <p className="text-cyan-400 text-sm">
                    <strong>Tip:</strong> Higher rate limits allow more
                    concurrent requests but may increase costs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
