"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlusIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  FireIcon,
  BoltIcon,
  TrashIcon,
  PencilIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";
import { Modal, Input, Select, message, Spin, Switch, Tag } from "antd";

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

  // Form state
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState("rate_limit");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [action, setAction] = useState("BLOCK");
  const [conditions, setConditions] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      message.error("Please fill in all required fields");
      return;
    }

    let parsedConditions = {};
    if (conditions) {
      try {
        parsedConditions = JSON.parse(conditions);
      } catch (e) {
        message.error("Invalid JSON in conditions");
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
        message.success("Rule created successfully!");
        resetForm();
        setIsModalOpen(false);
        fetchRules();
      } else {
        message.error(data.error || "Failed to create rule");
      }
    } catch (error) {
      message.error("Failed to create rule");
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

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "red";
      case "high":
        return "orange";
      case "medium":
        return "gold";
      case "low":
        return "green";
      default:
        return "default";
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "BLOCK":
        return "red";
      case "ALLOW":
        return "green";
      case "MONITOR":
        return "blue";
      case "CHALLENGE":
        return "orange";
      default:
        return "default";
    }
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Total Rules</p>
              <p className="text-3xl font-bold text-white mt-1">
                {stats?.totalRules || 0}
              </p>
            </div>
            <ShieldCheckIcon className="w-10 h-10 text-cyan-500" />
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
              <p className="text-sm text-slate-400">Active Rules</p>
              <p className="text-3xl font-bold text-green-500 mt-1">
                {stats?.activeRules || 0}
              </p>
            </div>
            <PlayIcon className="w-10 h-10 text-green-500" />
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
              <p className="text-sm text-slate-400">Total Triggers</p>
              <p className="text-3xl font-bold text-orange-500 mt-1">
                {stats?.totalTriggers || 0}
              </p>
            </div>
            <BoltIcon className="w-10 h-10 text-orange-500" />
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
              <p className="text-sm text-slate-400">Most Triggered</p>
              <p className="text-sm font-semibold text-white mt-1 truncate">
                {stats?.mostTriggeredRule || "N/A"}
              </p>
            </div>
            <FireIcon className="w-10 h-10 text-red-500" />
          </div>
        </motion.div>
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
              className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all"
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
                      <Tag color={rule.isActive ? "green" : "red"}>
                        {rule.isActive ? "Active" : "Inactive"}
                      </Tag>
                      <Tag color={getPriorityColor(rule.priority)}>
                        {rule.priority}
                      </Tag>
                      <Tag color={getActionColor(rule.action)}>
                        {rule.action}
                      </Tag>
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
          <div className="text-center py-16 bg-slate-800/30 rounded-2xl border border-slate-700">
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
      <Modal
        title="Create Custom Rule"
        open={isModalOpen}
        onOk={handleCreateRule}
        onCancel={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        confirmLoading={submitting}
        okText="Create Rule"
        width={700}
      >
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Rule Name *
            </label>
            <Input
              placeholder="e.g., Rate Limit API Endpoints"
              value={ruleName}
              onChange={(e) => setRuleName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Rule Type *
              </label>
              <Select
                value={ruleType}
                onChange={setRuleType}
                className="w-full"
                options={[
                  { value: "rate_limit", label: "Rate Limit" },
                  { value: "ip_blocking", label: "IP Blocking" },
                  { value: "path_blocking", label: "Path Blocking" },
                  { value: "geo_blocking", label: "Geo Blocking" },
                  { value: "header_validation", label: "Header Validation" },
                  { value: "custom", label: "Custom Rule" },
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Select
                value={priority}
                onChange={setPriority}
                className="w-full"
                options={[
                  { value: "Critical", label: "Critical" },
                  { value: "High", label: "High" },
                  { value: "Medium", label: "Medium" },
                  { value: "Low", label: "Low" },
                ]}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Action</label>
            <Select
              value={action}
              onChange={setAction}
              className="w-full"
              options={[
                { value: "BLOCK", label: "🚫 Block" },
                { value: "ALLOW", label: "✅ Allow" },
                { value: "MONITOR", label: "👁️ Monitor" },
                { value: "CHALLENGE", label: "⚠️ Challenge" },
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <Input.TextArea
              placeholder="Describe what this rule does..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Conditions (JSON)
            </label>
            <Input.TextArea
              placeholder='{"limit": 100, "window": "1m", "path": "/api/*"}'
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              rows={4}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              Define rule conditions in JSON format
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
