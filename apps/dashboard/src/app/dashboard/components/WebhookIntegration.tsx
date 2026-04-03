"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  secret?: string;
  createdAt: string;
  lastTriggered?: string;
}

export function WebhookIntegration() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<Webhook | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [formSecret, setFormSecret] = useState("");

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormUrl("");
    setFormEvents([]);
    setFormSecret("");
  };

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/webhooks");
      const data = await response.json();
      setWebhooks(data.webhooks || []);
    } catch (error) {
      console.error("Error fetching webhooks:", error);
      console.log("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUrl || formEvents.length === 0) return;

    try {
      const method = editingWebhook ? "PUT" : "POST";
      const url = editingWebhook
        ? `/api/webhooks/${editingWebhook.id}`
        : "/api/webhooks";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          url: formUrl,
          events: formEvents,
          secret: formSecret,
        }),
      });

      if (response.ok) {
        console.log(`Webhook ${editingWebhook ? "updated" : "created"} successfully`);
        setModalVisible(false);
        setEditingWebhook(null);
        resetForm();
        fetchWebhooks();
      } else {
        console.log("Failed to save webhook");
      }
    } catch (error) {
      console.error("Error saving webhook:", error);
    }
  };

  const handleEdit = (webhook: Webhook) => {
    setEditingWebhook(webhook);
    setFormName(webhook.name);
    setFormUrl(webhook.url);
    setFormEvents(webhook.events);
    setFormSecret(webhook.secret || "");
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      if (response.ok) {
        console.log("Webhook deleted successfully");
        fetchWebhooks();
      } else {
        console.log("Failed to delete webhook");
      }
    } catch (error) {
      console.error("Error deleting webhook:", error);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (response.ok) {
        console.log(`Webhook ${!isActive ? "enabled" : "disabled"}`);
        fetchWebhooks();
      } else {
        console.log("Failed to update webhook");
      }
    } catch (error) {
      console.error("Error updating webhook:", error);
    }
  };

  const handleEventToggle = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const eventOptions = [
    "user.created",
    "user.updated",
    "user.deleted",
    "security.alert",
    "api.limit.exceeded",
    "compliance.violation",
    "threat.detected",
    "system.error",
  ];

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-cyan-400">&#128279;</span> Webhook Integration
        </h3>
        <button
          onClick={() => {
            setEditingWebhook(null);
            resetForm();
            setModalVisible(true);
          }}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          + Add Webhook
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Name</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">URL</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Events</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Status</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Last Triggered</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks.map((webhook) => (
                <tr key={webhook.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-3 text-white font-medium">{webhook.name}</td>
                  <td className="py-2 px-3">
                    <code className="text-xs text-gray-400 bg-white/5 px-2 py-0.5 rounded">
                      {webhook.url.length > 50 ? `${webhook.url.substring(0, 50)}...` : webhook.url}
                    </code>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 2).map((event) => (
                        <span key={event} className="inline-block px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-300">
                          {event}
                        </span>
                      ))}
                      {webhook.events.length > 2 && (
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-white/10 text-gray-300">
                          +{webhook.events.length - 2} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <button
                      onClick={() => handleToggle(webhook.id, webhook.isActive)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${webhook.isActive ? "bg-cyan-500" : "bg-gray-600"}`}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${webhook.isActive ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  </td>
                  <td className="py-2 px-3 text-gray-400 text-xs">
                    {webhook.lastTriggered ? new Date(webhook.lastTriggered).toLocaleDateString() : "Never"}
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(webhook)}
                        className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(webhook.id)}
                        className="px-2 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modalVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setModalVisible(false);
              setEditingWebhook(null);
              resetForm();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl bg-[#0a0a0f] border border-white/10 p-6 shadow-xl"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingWebhook ? "Edit" : "Add"} Webhook
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Webhook Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Enter webhook name"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Webhook URL</label>
                  <input
                    type="url"
                    value={formUrl}
                    onChange={(e) => setFormUrl(e.target.value)}
                    placeholder="https://your-domain.com/webhook"
                    required
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Events</label>
                  <div className="flex flex-wrap gap-2">
                    {eventOptions.map((event) => (
                      <button
                        key={event}
                        type="button"
                        onClick={() => handleEventToggle(event)}
                        className={`px-2 py-1 rounded-full text-xs transition-colors ${formEvents.includes(event) ? "bg-cyan-500/30 text-cyan-400 border border-cyan-500/50" : "bg-white/5 text-gray-400 border border-white/10"}`}
                      >
                        {event}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Secret (Optional)</label>
                  <input
                    type="password"
                    value={formSecret}
                    onChange={(e) => setFormSecret(e.target.value)}
                    placeholder="Webhook secret for verification"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {editingWebhook ? "Update" : "Create"} Webhook
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalVisible(false);
                      setEditingWebhook(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
