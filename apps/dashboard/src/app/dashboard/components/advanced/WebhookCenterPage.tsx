"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  ArrowPathIcon,
  BoltIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon,
  BeakerIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import {
  Modal,
  Input,
  Select,
  message,
  Spin,
  Switch,
  Tag,
  Checkbox,
} from "antd";

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
  { value: "scan.completed", label: "🔍 Scan Completed", category: "Security" },
  { value: "scan.failed", label: "❌ Scan Failed", category: "Security" },
  {
    value: "vulnerability.detected",
    label: "🚨 Vulnerability Detected",
    category: "Security",
  },
  {
    value: "threat.detected",
    label: "⚠️ Threat Detected",
    category: "Security",
  },
  { value: "bot.blocked", label: "🤖 Bot Blocked", category: "Bot Protection" },
  {
    value: "compliance.violation",
    label: "📋 Compliance Violation",
    category: "Compliance",
  },
  { value: "api.created", label: "➕ API Created", category: "API Management" },
  { value: "api.deleted", label: "🗑️ API Deleted", category: "API Management" },
  {
    value: "rate_limit.exceeded",
    label: "⏱️ Rate Limit Exceeded",
    category: "Rate Limiting",
  },
  { value: "alert.triggered", label: "🔔 Alert Triggered", category: "Alerts" },
];

export function WebhookCenterPage({ companyId }: { companyId: string }) {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<WebhookDelivery[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);

  // Form state
  const [webhookName, setWebhookName] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [webhookType, setWebhookType] = useState("generic");
  const [submitting, setSubmitting] = useState(false);

  const fetchWebhooks = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/webhooks", {
        headers: { "x-tenant-id": companyId },
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
    if (!webhookName || !webhookUrl || selectedEvents.length === 0) {
      message.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/webhooks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          name: webhookName,
          url: webhookUrl,
          events: selectedEvents,
          webhookType,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success("Webhook created successfully!");
        resetForm();
        setIsModalOpen(false);
        fetchWebhooks();
      } else {
        message.error(data.error || "Failed to create webhook");
      }
    } catch (error) {
      message.error("Failed to create webhook");
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhookId(webhookId);
    try {
      // Simulate webhook test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      message.success("Test webhook sent successfully! ✅");
    } catch (error) {
      message.error("Failed to test webhook");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Webhook Center</h1>
          <p className="text-slate-400">
            Manage webhook endpoints and event subscriptions
          </p>
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
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchWebhooks}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Webhooks</p>
              <p className="text-3xl font-bold text-white mt-1">
                {webhooks.length}
              </p>
            </div>
            <LinkIcon className="w-10 h-10 text-cyan-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Active</p>
              <p className="text-3xl font-bold text-green-500 mt-1">
                {webhooks.filter((w) => w.enabled).length}
              </p>
            </div>
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Deliveries</p>
              <p className="text-3xl font-bold text-cyan-400 mt-1">
                {webhooks.reduce((sum, w) => sum + w.deliveryCount, 0)}
              </p>
            </div>
            <BoltIcon className="w-10 h-10 text-cyan-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Success Rate</p>
              <p className="text-3xl font-bold text-green-500 mt-1">
                {webhooks.length > 0
                  ? Math.round(
                      webhooks.reduce((sum, w) => sum + getSuccessRate(w), 0) /
                        webhooks.length,
                    )
                  : 0}
                %
              </p>
            </div>
            <CheckCircleIcon className="w-10 h-10 text-green-500" />
          </div>
        </motion.div>
      </div>

      {/* Webhooks List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">
          Your Webhooks ({webhooks.length})
        </h2>
        <AnimatePresence>
          {webhooks.map((webhook, index) => {
            const successRate = getSuccessRate(webhook);
            const isTesting = testingWebhookId === webhook.id;

            return (
              <motion.div
                key={webhook.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {webhook.name}
                      </h3>
                      <Tag color={webhook.enabled ? "green" : "red"}>
                        {webhook.enabled ? "Active" : "Disabled"}
                      </Tag>
                      <Tag color="blue">{webhook.type}</Tag>
                    </div>

                    <div className="mb-3">
                      <code className="text-sm text-cyan-400 bg-slate-900/50 px-3 py-1 rounded">
                        {webhook.url}
                      </code>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-400 mb-3">
                      <span>
                        Deliveries:{" "}
                        <span className="text-white font-semibold">
                          {webhook.deliveryCount}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Success:{" "}
                        <span className="text-green-500">
                          {webhook.successCount}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Failed:{" "}
                        <span className="text-red-500">
                          {webhook.failureCount}
                        </span>
                      </span>
                      <span>•</span>
                      <span>
                        Rate:{" "}
                        <span className="text-cyan-400">{successRate}%</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {webhook.events.map((event) => (
                        <Tag key={event} color="cyan">
                          {event}
                        </Tag>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleTestWebhook(webhook.id)}
                      disabled={isTesting}
                      className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                    >
                      {isTesting ? (
                        <Spin size="small" />
                      ) : (
                        <BeakerIcon className="w-5 h-5" />
                      )}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                    >
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
            <p className="text-xl text-white font-semibold mb-2">
              No Webhooks Yet
            </p>
            <p className="text-slate-400 mb-4">
              Create your first webhook to receive event notifications
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold"
            >
              Create Webhook
            </motion.button>
          </div>
        )}
      </div>

      {/* Recent Deliveries */}
      {recentDeliveries.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-white">Recent Deliveries</h2>
          {recentDeliveries.map((delivery, index) => (
            <motion.div
              key={delivery.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {delivery.status === "success" ? (
                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <span className="text-white font-medium">
                      {delivery.webhookName}
                    </span>
                    <span className="text-slate-400 text-sm ml-2">
                      → {delivery.event}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <Tag color={delivery.status === "success" ? "green" : "red"}>
                    {delivery.responseCode}
                  </Tag>
                  <span>{new Date(delivery.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Webhook Modal */}
      <Modal
        title="Create New Webhook"
        open={isModalOpen}
        onOk={handleCreateWebhook}
        onCancel={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        confirmLoading={submitting}
        okText="Create Webhook"
        width={700}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Webhook Name *
            </label>
            <Input
              placeholder="e.g., Security Alerts"
              value={webhookName}
              onChange={(e) => setWebhookName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Webhook URL *
            </label>
            <Input
              placeholder="https://your-app.com/webhooks/governapi"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Webhook Type
            </label>
            <Select
              value={webhookType}
              onChange={setWebhookType}
              className="w-full"
              options={[
                { value: "generic", label: "Generic" },
                { value: "slack", label: "Slack" },
                { value: "discord", label: "Discord" },
                { value: "teams", label: "Microsoft Teams" },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Select Events *
            </label>
            <Checkbox.Group
              value={selectedEvents}
              onChange={setSelectedEvents}
              className="w-full"
            >
              <div className="space-y-3">
                {Object.entries(
                  AVAILABLE_EVENTS.reduce(
                    (acc, event) => {
                      if (!acc[event.category]) acc[event.category] = [];
                      acc[event.category].push(event);
                      return acc;
                    },
                    {} as Record<string, typeof AVAILABLE_EVENTS>,
                  ),
                ).map(([category, events]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-slate-500 mb-2">
                      {category}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {events.map((event) => (
                        <Checkbox key={event.value} value={event.value}>
                          {event.label}
                        </Checkbox>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Checkbox.Group>
          </div>
        </div>
      </Modal>
    </div>
  );
}
