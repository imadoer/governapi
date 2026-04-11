"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import {
  PlusIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PencilIcon,
  BeakerIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  type: string;
  enabled: boolean;
  deliveryCount: number;
  successCount: number;
  failureCount: number;
  lastDelivery: string | null;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  webhookName: string;
  event: string;
  status: string;
  responseCode: number;
  createdAt: string;
}

const AVAILABLE_EVENTS = [
  { value: "scan.completed", label: "Scan Completed", category: "Scanning" },
  { value: "scan.failed", label: "Scan Failed", category: "Scanning" },
  { value: "scan.score_changed", label: "Score Changed", category: "Scanning" },
  { value: "scan.score_dropped", label: "Score Dropped Below Threshold", category: "Scanning" },
  { value: "vulnerability.detected", label: "Vulnerability Detected", category: "Security" },
  { value: "compliance.violation", label: "Compliance Violation", category: "Compliance" },
  { value: "discovery.new_endpoint", label: "New Endpoint Discovered", category: "API Discovery" },
  { value: "discovery.exposed_endpoint", label: "Exposed Endpoint Found", category: "API Discovery" },
  { value: "api.created", label: "API Created", category: "API Management" },
  { value: "api.deleted", label: "API Deleted", category: "API Management" },
  { value: "policy.triggered", label: "Policy Triggered", category: "Alerts" },
];

export function WebhookCenterPage({ companyId }: { companyId: string }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [webhookType, setWebhookType] = useState("generic");
  const [submitting, setSubmitting] = useState(false);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/webhooks", {
        headers: { "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
      });
      const data = await response.json();
      if (data.success) {
        setWebhooks(data.webhooks || []);
        setRecentDeliveries(data.recentDeliveries || []);
      }
    } catch (error) {
      console.error("Failed to fetch webhooks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchWebhooks();
  }, [companyId]);

  const handleCreateWebhook = async () => {
    if (!webhookName || !webhookUrl || selectedEvents.length === 0) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId, ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}) },
        credentials: "include",
        body: JSON.stringify({ name: webhookName, url: webhookUrl, events: selectedEvents, webhookType }),
      });
      const data = await response.json();
      if (data.success) {
        resetForm();
        setIsModalOpen(false);
        fetchWebhooks();
      }
    } catch (error) {
      console.error("Failed to create webhook:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhookId(webhookId);
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") : null;
      const res = await fetch("/api/webhooks/trigger", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          event_type: "test",
          data: {
            message: "Test webhook from GovernAPI",
            timestamp: new Date().toISOString(),
            webhook_id: webhookId,
          },
        }),
      });
      const d = await res.json();
      if (d.success) {
        fetchWebhooks();
      }
    } catch (error) {
      console.error("Webhook test failed:", error);
    } finally {
      setTestingWebhookId(null);
    }
  };

  const resetForm = () => {
    setWebhookName("");
    setWebhookUrl("");
    setSelectedEvents([]);
    setWebhookType("generic");
  };

  const getSuccessRate = (webhook: Webhook) => {
    if (webhook.deliveryCount === 0) return 0;
    return Math.round((webhook.successCount / webhook.deliveryCount) * 100);
  };

  const toggleEvent = (value: string) => {
    setSelectedEvents((prev) =>
      prev.includes(value) ? prev.filter((e) => e !== value) : [...prev, value]
    );
  };

  const eventsByCategory = AVAILABLE_EVENTS.reduce((acc, event) => {
    if (!acc[event.category]) acc[event.category] = [];
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, typeof AVAILABLE_EVENTS>);

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Webhook Center</h1>
          <p className="text-slate-400">Manage webhook endpoints and event subscriptions</p>
        </div>
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            Create Webhook
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchWebhooks}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors">
            <ArrowPathIcon className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Webhooks", value: webhooks.length },
          { label: "Active", value: webhooks.filter((w) => w.enabled).length },
          { label: "Total Deliveries", value: webhooks.reduce((s, w) => s + w.deliveryCount, 0) },
          { label: "Success Rate", value: `${webhooks.length > 0 ? Math.round(webhooks.reduce((s, w) => s + getSuccessRate(w), 0) / webhooks.length) : 0}%` },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5">
            <div className="text-[12px] text-gray-500 mb-2">{stat.label}</div>
            <div className="text-2xl font-semibold text-white tracking-tight">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Webhooks List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Your Webhooks ({webhooks.length})</h2>
        <AnimatePresence>
          {webhooks.map((webhook, index) => {
            const successRate = getSuccessRate(webhook);
            const isTesting = testingWebhookId === webhook.id;
            return (
              <motion.div key={webhook.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${webhook.enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                        {webhook.enabled ? "Active" : "Disabled"}
                      </span>
                      <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-blue-500/15 text-blue-400">{webhook.type}</span>
                    </div>
                    <div className="mb-3">
                      <code className="text-sm text-cyan-400 bg-slate-900/50 px-3 py-1 rounded">{webhook.url}</code>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <span>Deliveries: <span className="text-white font-semibold">{webhook.deliveryCount}</span></span>
                      <span>Success: <span className="text-green-500">{webhook.successCount}</span></span>
                      <span>Failed: <span className="text-red-500">{webhook.failureCount}</span></span>
                      <span>Rate: <span className="text-cyan-400">{successRate}%</span></span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <span key={event} className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-cyan-500/15 text-cyan-400">{event}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleTestWebhook(webhook.id)} disabled={isTesting}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 transition-colors">
                      {isTesting ? <div className="animate-spin w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" /> : <BeakerIcon className="w-5 h-5" />}
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors">
                      <PencilIcon className="w-5 h-5" />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors">
                      <TrashIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {webhooks.length === 0 && (
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700">
            <BoltIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-white font-semibold mb-2">No Webhooks Yet</p>
            <p className="text-slate-400 mb-4">Create your first webhook to receive event notifications</p>
            <button onClick={() => setIsModalOpen(true)} className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold">
              Create Webhook
            </button>
          </div>
        )}
      </div>

      {/* Recent Deliveries */}
      {recentDeliveries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Recent Deliveries</h2>
          {recentDeliveries.map((delivery, index) => (
            <motion.div key={delivery.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {delivery.status === "success" ? <CheckCircleIcon className="w-5 h-5 text-green-500" /> : <XCircleIcon className="w-5 h-5 text-red-500" />}
                  <div>
                    <span className="text-white font-medium">{delivery.webhookName}</span>
                    <span className="text-slate-400 text-sm ml-2">→ {delivery.event}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${delivery.status === "success" ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                    {delivery.responseCode}
                  </span>
                  <span>{new Date(delivery.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Webhook Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsModalOpen(false); resetForm(); }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl mx-4 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 bg-slate-800/90 backdrop-blur-xl z-10">
                <h2 className="text-lg font-semibold text-white">Create New Webhook</h2>
                <button onClick={() => { setIsModalOpen(false); resetForm(); }} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Webhook Name *</label>
                  <input type="text" value={webhookName} onChange={(e) => setWebhookName(e.target.value)} placeholder="e.g., Security Alerts"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Webhook URL *</label>
                  <input type="url" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-app.com/webhooks/governapi"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Webhook Type</label>
                  <select value={webhookType} onChange={(e) => setWebhookType(e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer">
                    <option value="generic" className="bg-slate-800">Generic</option>
                    <option value="slack" className="bg-slate-800">Slack</option>
                    <option value="discord" className="bg-slate-800">Discord</option>
                    <option value="teams" className="bg-slate-800">Microsoft Teams</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Select Events *</label>
                  <div className="space-y-4">
                    {Object.entries(eventsByCategory).map(([category, events]) => (
                      <div key={category}>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{category}</p>
                        <div className="grid grid-cols-2 gap-2">
                          {events.map((event) => (
                            <label key={event.value} className="flex items-center gap-2 cursor-pointer group">
                              <input type="checkbox" checked={selectedEvents.includes(event.value)} onChange={() => toggleEvent(event.value)}
                                className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-cyan-500 focus:ring-cyan-500/50 focus:ring-offset-0" />
                              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{event.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button onClick={() => { setIsModalOpen(false); resetForm(); }}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/10 transition-all">Cancel</button>
                  <button onClick={handleCreateWebhook} disabled={submitting || !webhookName || !webhookUrl || selectedEvents.length === 0}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center gap-2">
                    {submitting && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
                    Create Webhook
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
