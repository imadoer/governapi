"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton, FadeIn } from "./PageSkeleton";
import {
  PlusIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  FireIcon,
  BoltIcon,
  TrashIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";

interface CustomRule {
  id: string;
  name: string;
  ruleType: string;
  description: string;
  priority: string;
  action: string;
  conditions: any;
  isActive: boolean;
  triggeredCount: number;
  createdAt: string;
  updatedAt: string;
}

interface RuleStatistics {
  totalRules: number;
  activeRules: number;
  totalTriggers: number;
  rulesByType: Record<string, number>;
  mostTriggeredRule: string | null;
}

export function CustomRulesPage({ companyId }: { companyId: string }) {
  const [rules, setRules] = useState<CustomRule[]>([]);
  const [stats, setStats] = useState<RuleStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<CustomRule | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Form state
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState("rate_limit");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [action, setAction] = useState("BLOCK");
  const [conditions, setConditions] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/customer/custom-rules", {
        headers: { "x-tenant-id": companyId },
      });
      const data = await response.json();

      if (data.success) {
        setRules(data.rules || []);
        setStats(data.statistics || null);
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchRules();
  }, [companyId]);

  const handleCreateRule = async () => {
    if (!ruleName || !ruleType) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    let parsedConditions = {};
    if (conditions) {
      try {
        parsedConditions = JSON.parse(conditions);
      } catch (e) {
        showToast("Invalid JSON in conditions", "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/customer/custom-rules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-id": companyId,
        },
        body: JSON.stringify({
          name: ruleName,
          ruleType,
          description,
          priority,
          action,
          conditions: parsedConditions,
        }),
      });

      const data = await response.json();

      if (data.success) {
        showToast("Rule created successfully!", "success");
        resetForm();
        setIsModalOpen(false);
        fetchRules();
      } else {
        showToast(data.error || "Failed to create rule", "error");
      }
    } catch (error) {
      showToast("Failed to create rule", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRuleName("");
    setRuleType("rate_limit");
    setDescription("");
    setPriority("Medium");
    setAction("BLOCK");
    setConditions("");
    setEditingRule(null);
  };

  const getRuleTypeIcon = (type: string) => {
    switch (type) {
      case "rate_limit":
        return <BoltIcon className="w-5 h-5" />;
      case "ip_blocking":
        return <ShieldCheckIcon className="w-5 h-5" />;
      case "path_blocking":
        return <FireIcon className="w-5 h-5" />;
      default:
        return <ShieldCheckIcon className="w-5 h-5" />;
    }
  };

  const getPriorityClasses = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  const getActionClasses = (action: string) => {
    switch (action.toUpperCase()) {
      case "BLOCK":
        return "bg-red-500/20 text-red-400 border border-red-500/30";
      case "ALLOW":
        return "bg-green-500/20 text-green-400 border border-green-500/30";
      case "MONITOR":
        return "bg-blue-500/20 text-blue-400 border border-blue-500/30";
      case "CHALLENGE":
        return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border border-slate-500/30";
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">Custom Rules</h1>
          <p className="text-slate-400">
            Create and manage custom security rules for your APIs
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
            Create Rule
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchRules}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Rules", value: stats?.totalRules || 0 },
          { label: "Active Rules", value: stats?.activeRules || 0 },
          { label: "Total Triggers", value: stats?.totalTriggers || 0 },
          { label: "Most Triggered", value: stats?.mostTriggeredRule || "N/A", small: true },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5">
            <div className="text-[12px] text-gray-500 mb-2">{s.label}</div>
            <div className={`${s.small ? "text-[14px]" : "text-2xl"} font-semibold text-white tracking-tight truncate`}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">
          Your Rules ({rules.length})
        </h2>
        <AnimatePresence>
          {rules.map((rule, index) => (
            <motion.div
              key={rule.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-3 rounded-xl bg-cyan-500/20">
                    {getRuleTypeIcon(rule.ruleType)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">
                        {rule.name}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.isActive ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityClasses(rule.priority)}`}>
                        {rule.priority}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionClasses(rule.action)}`}>
                        {rule.action}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 mb-3">
                      {rule.description}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="capitalize">
                        Type: {rule.ruleType.replace("_", " ")}
                      </span>
                      <span>•</span>
                      <span>
                        Triggered:{" "}
                        <span className="text-orange-400 font-semibold">
                          {rule.triggeredCount}
                        </span>{" "}
                        times
                      </span>
                      <span>•</span>
                      <span>
                        Created: {new Date(rule.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {Object.keys(rule.conditions).length > 0 && (
                      <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">
                          Conditions:
                        </p>
                        <code className="text-xs text-cyan-400">
                          {JSON.stringify(rule.conditions, null, 2)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="p-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
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
          ))}
        </AnimatePresence>

        {rules.length === 0 && (
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-white/10">
            <ShieldCheckIcon className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl text-white font-semibold mb-2">
              No Custom Rules
            </p>
            <p className="text-slate-400 mb-4">
              Create your first security rule to get started
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold"
            >
              Create Rule
            </motion.button>
          </div>
        )}
      </div>

      {/* Create Rule Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[700px] bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Create Custom Rule</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Rate Limit API Endpoints"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Rule Type *
                    </label>
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="rate_limit" className="bg-slate-800">Rate Limit</option>
                      <option value="ip_blocking" className="bg-slate-800">IP Blocking</option>
                      <option value="path_blocking" className="bg-slate-800">Path Blocking</option>
                      <option value="geo_blocking" className="bg-slate-800">Geo Blocking</option>
                      <option value="header_validation" className="bg-slate-800">Header Validation</option>
                      <option value="custom" className="bg-slate-800">Custom Rule</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                    >
                      <option value="Critical" className="bg-slate-800">Critical</option>
                      <option value="High" className="bg-slate-800">High</option>
                      <option value="Medium" className="bg-slate-800">Medium</option>
                      <option value="Low" className="bg-slate-800">Low</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Action</label>
                  <select
                    value={action}
                    onChange={(e) => setAction(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors appearance-none cursor-pointer"
                  >
                    <option value="BLOCK" className="bg-slate-800">Block</option>
                    <option value="ALLOW" className="bg-slate-800">Allow</option>
                    <option value="MONITOR" className="bg-slate-800">Monitor</option>
                    <option value="CHALLENGE" className="bg-slate-800">Challenge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what this rule does..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Conditions (JSON)
                  </label>
                  <textarea
                    placeholder='{"limit": 100, "window": "1m", "path": "/api/*"}'
                    value={conditions}
                    onChange={(e) => setConditions(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-slate-800 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm resize-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Define rule conditions in JSON format
                  </p>
                </div>
              </div>
              <div className="p-6 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRule}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />}
                  Create Rule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
