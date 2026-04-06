"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import {
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  TrashIcon,
  ClockIcon,
  XMarkIcon,
  BellAlertIcon,
} from "@heroicons/react/24/outline";

interface Integration {
  id: string;
  type: string;
  name: string;
  isActive: boolean;
  lastUsed: string | null;
  createdAt: string;
}

interface ToastState {
  id: number;
  message: string;
  type: "success" | "error";
}

/**
 * V1 NOTIFICATION INTEGRATIONS
 *
 * Architecture Promise Compliant:
 * - Outbound notifications only (we push TO their systems)
 * - No credential storage for reading customer data
 * - No sync/pull functionality
 *
 * Enabled: Slack (webhook), PagerDuty (Events API), Custom Webhook (HMAC signed)
 * Disabled for v1: Jira, GitHub, Datadog (require stored credentials with read access)
 */

const INTEGRATION_TYPES = [
  {
    id: "slack",
    name: "Slack",
    icon: "\u{1F4AC}",
    color: "#4A154B",
    gradient: "",
    borderColor: "",
    description: "Send security alerts to Slack channels",
    fields: ["webhook_url"],
    fieldLabels: { webhook_url: "Webhook URL" } as Record<string, string>,
    fieldPlaceholders: { webhook_url: "https://hooks.slack.com/services/..." } as Record<string, string>,
    testEndpoint: "/api/integrations/slack",
    docsUrl: "https://api.slack.com/messaging/webhooks",
  },
  {
    id: "pagerduty",
    name: "PagerDuty",
    icon: "\u{1F6A8}",
    color: "#06AC38",
    gradient: "",
    borderColor: "",
    description: "Critical alerts to on-call teams",
    fields: ["integration_key"],
    fieldLabels: { integration_key: "Integration Key" } as Record<string, string>,
    fieldPlaceholders: { integration_key: "Events API v2 integration key" } as Record<string, string>,
    testEndpoint: "/api/integrations/pagerduty",
    docsUrl: "https://support.pagerduty.com/docs/services-and-integrations",
  },
  {
    id: "webhook",
    name: "Custom Webhook",
    icon: "\u{1F517}",
    color: "#6366f1",
    gradient: "",
    borderColor: "",
    description: "HMAC-signed webhooks to any endpoint",
    fields: ["webhook_url", "secret"],
    fieldLabels: { webhook_url: "Webhook URL", secret: "Signing Secret (optional)" } as Record<string, string>,
    fieldPlaceholders: {
      webhook_url: "https://your-api.com/webhook",
      secret: "Used for HMAC-SHA256 signature verification"
    } as Record<string, string>,
    testEndpoint: "/api/webhooks/trigger",
    docsUrl: null as string | null,
  },
];

function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-xl shadow-2xl ${
        toast.type === "success"
          ? "bg-emerald-900/80 border-emerald-500/30 text-emerald-200"
          : "bg-red-900/80 border-red-500/30 text-red-200"
      }`}
    >
      {toast.type === "success" ? (
        <CheckCircleIcon className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <XCircleIcon className="w-5 h-5 text-red-400 shrink-0" />
      )}
      <span className="text-sm font-medium">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="ml-2 text-white/50 hover:text-white/80 transition-colors">
        <XMarkIcon className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ExternalIntegrationsPage({ companyId }: { companyId: string }) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [integrationName, setIntegrationName] = useState("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [showTestResult, setShowTestResult] = useState(false);
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const [toastCounter, setToastCounter] = useState(0);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToastCounter((prev) => {
      const id = prev + 1;
      setToasts((t) => [...t, { id, message, type }]);
      return id;
    });
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((t) => t.filter((toast) => toast.id !== id));
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/external-integrations", {
        headers: { "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
      });
      const data = await response.json();

      if (data.success) {
        const v1Types = INTEGRATION_TYPES.map(t => t.id);
        const filtered = (data.integrations || []).filter((i: Integration) =>
          v1Types.includes(i.type)
        );
        setIntegrations(filtered);
      }
    } catch (error) {
      console.error("Failed to fetch integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchIntegrations();
    }
  }, [companyId]);

  const handleAddIntegration = async () => {
    if (!selectedType || !integrationName) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    const integrationType = INTEGRATION_TYPES.find(t => t.id === selectedType);
    const requiredFields = integrationType?.fields.filter(f => f !== 'secret') || [];

    for (const field of requiredFields) {
      if (!credentials[field]) {
        showToast(`Please fill in ${integrationType?.fieldLabels?.[field] || field}`, "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/external-integrations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
          ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          integrationType: selectedType,
          integrationName,
          credentials,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Integration added successfully!", "success");
        setIsModalOpen(false);
        setSelectedType("");
        setIntegrationName("");
        setCredentials({});
        fetchIntegrations();
      } else {
        showToast(data.error || "Failed to add integration", "error");
      }
    } catch (error) {
      showToast("Failed to add integration", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestIntegration = async (integration: Integration) => {
    setTestingId(integration.id);
    try {
      const integrationType = INTEGRATION_TYPES.find(
        (t) => t.id === integration.type,
      );

      if (!integrationType?.testEndpoint) {
        showToast("Test endpoint not configured for this integration type", "error");
        return;
      }

      const response = await fetch(integrationType.testEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
          ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          integrationId: integration.id,
          event: "test",
          message: "Test alert from GovernAPI - Integration verified!",
          timestamp: new Date().toISOString(),
        }),
      });

      let result;
      try {
        result = await response.json();
      } catch (e) {
        result = {
          success: false,
          message: "Failed to parse response",
          error: "Invalid JSON response"
        };
      }

      setTestResult({
        success: result.success === true,
        integration: integration.name,
        message: result.message || (response.ok ? "Success" : "Failed"),
        details: result.details,
        error: result.error,
        status: response.status,
      });
      setShowTestResult(true);

      if (response.ok && result.success) {
        showToast(result.message || `${integration.name} test successful!`, "success");
      } else {
        showToast(result.message || `Test failed: ${result.error || "Unknown error"}`, "error");
      }
    } catch (error) {
      setTestResult({
        success: false,
        integration: integration.name,
        message: "Failed to test integration",
        error: error instanceof Error ? error.message : String(error),
      });
      setShowTestResult(true);
      showToast("Failed to test integration", "error");
    } finally {
      setTestingId(null);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    try {
      const response = await fetch(
        `/api/customer/external-integrations/${id}`,
        {
          method: "DELETE",
          headers: { "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
          credentials: "include",
        },
      );

      if (response.ok) {
        showToast("Integration deleted", "success");
        fetchIntegrations();
      } else {
        showToast("Failed to delete integration", "error");
      }
    } catch (error) {
      showToast("Failed to delete integration", "error");
    }
  };

  const getIntegrationType = (type: string) => {
    return INTEGRATION_TYPES.find((t) => t.id === type) || INTEGRATION_TYPES[0];
  };

  const selectedIntegrationType = INTEGRATION_TYPES.find(
    (t) => t.id === selectedType,
  );

  if (loading) {
    return <PageSkeleton />;
  }

  const activeCount = integrations.filter((i) => i.isActive).length;

  return (
    <div className="space-y-8">
      {/* Toast notifications */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Notification Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Security alerts delivered to your team&apos;s tools</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-1.5"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Add Integration
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Connected", value: integrations.length, sub: "Total integrations" },
          { label: "Active", value: activeCount, sub: "Receiving alerts" },
          { label: "Available", value: INTEGRATION_TYPES.length, sub: "Integration types" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5">
            <div className="text-[12px] text-gray-500 mb-2">{s.label}</div>
            <div className="text-2xl font-semibold text-white tracking-tight">{s.value}</div>
            <div className="text-[11px] text-gray-600 mt-1">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      {/* Available Integrations */}
      <div>
        <h2 className="text-[13px] font-medium text-gray-400 mb-4">Available Integrations</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {INTEGRATION_TYPES.map((type, index) => {
            const isConnected = integrations.some((i) => i.type === type.id);
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                onClick={() => { setSelectedType(type.id); setIsModalOpen(true); }}
                className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5 cursor-pointer hover:border-white/[0.12] transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{type.icon}</span>
                  {isConnected && (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">Connected</span>
                  )}
                </div>
                <h3 className="text-[14px] font-medium text-white mb-1">{type.name}</h3>
                <p className="text-[12px] text-gray-500 leading-relaxed">{type.description}</p>
                {type.docsUrl && (
                  <a href={type.docsUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="inline-block text-[11px] text-gray-500 hover:text-white mt-2 transition-colors">
                    Setup docs →
                  </a>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Your Integrations */}
      {integrations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-[13px] font-medium text-gray-400">Your Integrations</h2>
            <span className="text-[11px] text-gray-600">{integrations.length}</span>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {integrations.map((integration, index) => {
                const type = getIntegrationType(integration.type);
                const isTesting = testingId === integration.id;

                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5 hover:border-white/[0.12] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <span className="text-2xl">{type.icon}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-[14px] font-medium text-white">{integration.name}</h3>
                            {integration.isActive ? (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-xs font-medium text-emerald-400">Active</span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-500/20 rounded-full border border-slate-500/30">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                                <span className="text-xs font-medium text-slate-400">Inactive</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                            <span className="capitalize">{integration.type}</span>
                            <span className="w-1 h-1 bg-slate-600 rounded-full" />
                            <span className="flex items-center gap-1.5">
                              <ClockIcon className="w-3.5 h-3.5" />
                              Added {new Date(integration.createdAt).toLocaleDateString()}
                            </span>
                            {integration.lastUsed && (
                              <>
                                <span className="w-1 h-1 bg-slate-600 rounded-full" />
                                <span>Last alert {new Date(integration.lastUsed).toLocaleDateString()}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Test Integration"
                          onClick={() => handleTestIntegration(integration)}
                          disabled={isTesting}
                          className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 disabled:opacity-50 transition-all"
                        >
                          {isTesting ? (
                            <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                          ) : (
                            <BeakerIcon className="w-5 h-5" />
                          )}
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete Integration"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${integration.name}?`)) {
                              handleDeleteIntegration(integration.id);
                            }
                          }}
                          className="p-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 transition-all"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {integrations.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="inline-flex p-4 bg-slate-800/50 rounded-2xl mb-4">
            <BellAlertIcon className="w-12 h-12 text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No integrations yet</h3>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Connect your first notification integration to start receiving real-time security alerts.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add Your First Integration
          </motion.button>
        </motion.div>
      )}

      {/* Add Integration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedType("");
                setIntegrationName("");
                setCredentials({});
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-[560px] mx-4 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">Add New Integration</h3>
                    <p className="text-sm text-slate-400">Configure where to send security alerts</p>
                  </div>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedType("");
                      setIntegrationName("");
                      setCredentials({});
                    }}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Integration Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => { setSelectedType(e.target.value); setCredentials({}); }}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 appearance-none cursor-pointer transition-all"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 12px center', backgroundRepeat: 'no-repeat', backgroundSize: '20px' }}
                  >
                    <option value="" disabled className="bg-slate-900 text-slate-400">Select integration type</option>
                    {INTEGRATION_TYPES.map((type) => (
                      <option key={type.id} value={type.id} className="bg-slate-900 text-white py-2">
                        {type.icon} {type.name} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Integration Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Production Alerts, Security Team"
                    value={integrationName}
                    onChange={(e) => setIntegrationName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                  />
                </div>

                {selectedIntegrationType && (
                  <div className="space-y-4 pt-2 border-t border-white/10">
                    <div className="text-sm font-medium text-slate-300">Configuration</div>
                    {selectedIntegrationType.fields.map((field) => (
                      <div key={field}>
                        <label className="block text-sm text-slate-400 mb-1.5">
                          {selectedIntegrationType.fieldLabels?.[field] || field.replace("_", " ")}
                          {field !== 'secret' && <span className="text-red-400 ml-1">*</span>}
                        </label>
                        <input
                          type={field.includes("token") || field.includes("key") || field.includes("secret") ? "password" : "text"}
                          placeholder={selectedIntegrationType.fieldPlaceholders?.[field] || `Enter ${field.replace("_", " ")}`}
                          value={credentials[field] || ""}
                          onChange={(e) => setCredentials({ ...credentials, [field]: e.target.value })}
                          className="w-full px-4 py-3 bg-slate-900/80 border border-white/10 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10">
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedType("");
                    setIntegrationName("");
                    setCredentials({});
                  }}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 border border-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddIntegration}
                  disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  Add Integration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Test Results Modal */}
      <AnimatePresence>
        {showTestResult && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowTestResult(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
              className="relative w-full max-w-[500px] mx-4 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50"
            >
              {testResult && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white">Test Result</h3>
                    <button
                      onClick={() => setShowTestResult(false)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  <div className={`flex items-center gap-3 mb-6 p-4 rounded-xl ${testResult.success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                    {testResult.success ? (
                      <CheckCircleIcon className="w-8 h-8 text-emerald-400" />
                    ) : (
                      <XCircleIcon className="w-8 h-8 text-red-400" />
                    )}
                    <div>
                      <h4 className={`font-semibold ${testResult.success ? 'text-emerald-400' : 'text-red-400'}`}>
                        {testResult.success ? 'Test Successful' : 'Test Failed'}
                      </h4>
                      <p className="text-sm text-slate-400">{testResult.integration}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-slate-400">Status</span>
                      <span className={testResult.success ? 'text-emerald-400' : 'text-red-400'}>
                        {testResult.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-white/10">
                      <span className="text-slate-400">Message</span>
                      <span className="text-slate-300">{testResult.message}</span>
                    </div>
                    {testResult.error && (
                      <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mt-4">
                        <span className="text-red-400 text-sm">{testResult.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end px-6 py-4 border-t border-white/10">
                <button
                  onClick={() => setShowTestResult(false)}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
