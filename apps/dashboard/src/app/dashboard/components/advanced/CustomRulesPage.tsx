"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageSkeleton } from "./PageSkeleton";
import {
  PlusIcon,
  ArrowPathIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

const RULE_TYPES = [
  { id: "score_alert", label: "Score Alert", desc: "Trigger when an endpoint's score drops below a threshold" },
  { id: "vuln_alert", label: "Vulnerability Alert", desc: "Trigger when a new vulnerability of a specific severity is found" },
  { id: "header_check", label: "Header Check", desc: "Trigger when a specific security header is missing" },
  { id: "compliance_alert", label: "Compliance Alert", desc: "Trigger when a compliance framework score drops below a threshold" },
  { id: "endpoint_down", label: "Endpoint Down", desc: "Trigger when a scanned endpoint returns 5xx or times out" },
  { id: "new_exposure", label: "New Exposure", desc: "Trigger when API Discovery finds a new exposed endpoint" },
];

const ACTIONS = [
  { id: "notify", label: "Notify", desc: "Send alert to Slack/PagerDuty/webhook" },
  { id: "flag_critical", label: "Flag Critical", desc: "Mark the vulnerability as critical" },
  { id: "fail_cicd", label: "Fail CI/CD", desc: "Return failure status via API key" },
  { id: "auto_rescan", label: "Auto-Rescan", desc: "Immediately rescan the endpoint" },
];

const HEADERS = ["HSTS", "CSP", "X-Frame-Options", "X-Content-Type-Options", "CORS", "Referrer-Policy"];
const SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function CustomRulesPage({ companyId }: { companyId: string }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState("score_alert");
  const [action, setAction] = useState("notify");
  const [threshold, setThreshold] = useState(50);
  const [severity, setSeverity] = useState("CRITICAL");
  const [header, setHeader] = useState("HSTS");

  const flash = (text: string, ok = true) => { setToast({ text, ok }); setTimeout(() => setToast(null), 2500); };

  const fetchRules = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/customer/custom-rules", { headers: { "x-tenant-id": companyId } });
      const d = await r.json();
      if (d.success) setRules(d.rules || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { if (companyId) fetchRules(); }, [companyId]);

  const resetForm = () => {
    setName(""); setRuleType("score_alert"); setAction("notify");
    setThreshold(50); setSeverity("CRITICAL"); setHeader("HSTS");
  };

  const buildConditions = () => {
    switch (ruleType) {
      case "score_alert": return { type: "score_below", threshold };
      case "vuln_alert": return { type: "severity_match", severity };
      case "header_check": return { type: "header_missing", header };
      case "compliance_alert": return { type: "compliance_below", threshold };
      case "endpoint_down": return { type: "endpoint_error" };
      case "new_exposure": return { type: "new_exposure" };
      default: return {};
    }
  };

  const describeRule = (rule: any) => {
    const c = typeof rule.conditions === "string" ? JSON.parse(rule.conditions) : rule.conditions || {};
    switch (c.type) {
      case "score_below": return `Alert when score drops below ${c.threshold}`;
      case "severity_match": return `Alert on ${c.severity} vulnerabilities`;
      case "header_missing": return `Alert when ${c.header} header is missing`;
      case "compliance_below": return `Alert when compliance drops below ${c.threshold}%`;
      case "endpoint_error": return "Alert when endpoint returns 5xx or times out";
      case "new_exposure": return "Alert when new exposed endpoint is found";
      default: return rule.description || "Custom policy";
    }
  };

  const handleCreate = async () => {
    if (!name) { flash("Name required", false); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/customer/custom-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({
          name,
          ruleType,
          conditions: buildConditions(),
          action,
          description: describeRule({ conditions: buildConditions() }),
        }),
      });
      const d = await r.json();
      if (d.success) { flash("Policy created"); setModal(false); resetForm(); fetchRules(); }
      else flash(d.error || "Failed", false);
    } catch { flash("Failed", false); }
    setSubmitting(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/customer/custom-rules?id=${id}`, {
        method: "DELETE",
        headers: { "x-tenant-id": companyId },
      });
      flash("Policy deleted");
      fetchRules();
    } catch { flash("Delete failed", false); }
  };

  const handleToggle = async (rule: any) => {
    try {
      await fetch("/api/customer/custom-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ id: rule.id, name: rule.name, isActive: !rule.isActive }),
      });
      fetchRules();
    } catch {}
  };

  if (loading) return <PageSkeleton />;

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-[200] px-4 py-2 rounded-lg text-[13px] font-medium shadow-xl border border-white/[0.06] ${toast.ok ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Security Policies</h1>
          <p className="text-sm text-gray-500 mt-1">Automated alerts and actions based on scan results</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchRules} className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
            <ArrowPathIcon className="w-4 h-4" />
          </button>
          <button onClick={() => { resetForm(); setModal(true); }}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-1.5">
            <PlusIcon className="w-3.5 h-3.5" /> New Policy
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Policies", value: rules.length },
          { label: "Active", value: activeCount },
          { label: "Alert Policies", value: rules.filter((r) => r.action === "notify").length },
          { label: "CI/CD Policies", value: rules.filter((r) => r.action === "fail_cicd").length },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className="text-[12px] text-gray-500 mb-2">{s.label}</div>
            <div className="text-2xl font-semibold text-white">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Rules list */}
      <Card className="overflow-hidden">
        {rules.length > 0 ? (
          <div className="divide-y divide-white/[0.03]">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between px-5 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-4 min-w-0">
                  <button onClick={() => handleToggle(rule)}
                    className={`w-9 h-5 rounded-full transition-colors relative shrink-0 ${rule.isActive ? "bg-emerald-500" : "bg-gray-700"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${rule.isActive ? "left-[18px]" : "left-0.5"}`} />
                  </button>
                  <div className="min-w-0">
                    <div className="text-[13px] text-white font-medium">{rule.name}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{describeRule(rule)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-white/[0.04] text-gray-400 border border-white/[0.06]">
                    {ACTIONS.find((a) => a.id === rule.action)?.label || rule.action}
                  </span>
                  <button onClick={() => handleDelete(rule.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-5 py-16 text-center">
            <p className="text-[14px] text-gray-400 mb-1">No security policies configured</p>
            <p className="text-[12px] text-gray-600">Create policies to get automated alerts when scan results change</p>
          </div>
        )}
      </Card>

      {/* Create modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="relative z-10 bg-[#111318] rounded-2xl border border-white/[0.06] shadow-2xl w-[500px] max-w-[92vw]">

              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[15px] font-semibold text-white">New Security Policy</h3>
                <button onClick={() => setModal(false)} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-[12px] text-gray-400 mb-1.5">Policy Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alert on critical vulns"
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white placeholder-gray-600 focus:outline-none focus:border-white/[0.12]" />
                </div>

                {/* Rule Type */}
                <div>
                  <label className="block text-[12px] text-gray-400 mb-1.5">When</label>
                  <select value={ruleType} onChange={(e) => setRuleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none appearance-none cursor-pointer">
                    {RULE_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>)}
                  </select>
                </div>

                {/* Condition fields — depend on rule type */}
                {(ruleType === "score_alert" || ruleType === "compliance_alert") && (
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-1.5">
                      Alert when {ruleType === "score_alert" ? "score" : "compliance"} drops below
                    </label>
                    <input type="number" value={threshold} onChange={(e) => setThreshold(+e.target.value)} min={0} max={100}
                      className="w-24 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none" />
                  </div>
                )}

                {ruleType === "vuln_alert" && (
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-1.5">Alert when this severity is found</label>
                    <select value={severity} onChange={(e) => setSeverity(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none appearance-none cursor-pointer">
                      {SEVERITIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                {ruleType === "header_check" && (
                  <div>
                    <label className="block text-[12px] text-gray-400 mb-1.5">Alert when this header is missing</label>
                    <select value={header} onChange={(e) => setHeader(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none appearance-none cursor-pointer">
                      {HEADERS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                )}

                {/* Action */}
                <div>
                  <label className="block text-[12px] text-gray-400 mb-1.5">Then</label>
                  <select value={action} onChange={(e) => setAction(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[13px] text-white focus:outline-none appearance-none cursor-pointer">
                    {ACTIONS.map((a) => <option key={a.id} value={a.id}>{a.label} — {a.desc}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.06]">
                <button onClick={() => setModal(false)} className="px-3 py-1.5 rounded-lg text-[12px] text-gray-400 hover:bg-white/5 transition-colors">Cancel</button>
                <button onClick={handleCreate} disabled={submitting}
                  className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-50">
                  {submitting ? "Creating..." : "Create Policy"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
