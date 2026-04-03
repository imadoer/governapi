"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { handleCreatePolicy } from "../actions";

export function CreatePolicyModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [severity, setSeverity] = useState("");
  const [rules, setRules] = useState("");
  const [enabled, setEnabled] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleCreatePolicy({ name, type, severity, rules, enabled });
      setName("");
      setType("");
      setSeverity("");
      setRules("");
      setEnabled(true);
      onClose();
    } catch {
      // Error handled in action
    }
  };

  const selectClass = "w-full bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer";

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl mx-4 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Create New Policy</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Policy Name</label>
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  placeholder="e.g., Require Authentication"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Policy Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)} required className={selectClass}>
                  <option value="" className="bg-slate-800">Select policy type</option>
                  <option value="security" className="bg-slate-800">Security</option>
                  <option value="rate-limiting" className="bg-slate-800">Rate Limiting</option>
                  <option value="authentication" className="bg-slate-800">Authentication</option>
                  <option value="data-validation" className="bg-slate-800">Data Validation</option>
                  <option value="compliance" className="bg-slate-800">Compliance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Severity</label>
                <select value={severity} onChange={(e) => setSeverity(e.target.value)} required className={selectClass}>
                  <option value="" className="bg-slate-800">Select severity</option>
                  <option value="critical" className="bg-slate-800">Critical</option>
                  <option value="high" className="bg-slate-800">High</option>
                  <option value="medium" className="bg-slate-800">Medium</option>
                  <option value="low" className="bg-slate-800">Low</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Policy Rules (JSON)</label>
                <textarea
                  value={rules} onChange={(e) => setRules(e.target.value)} rows={5}
                  placeholder='{"require": "authentication", "methods": ["POST", "PUT", "DELETE"]}'
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors font-mono text-sm resize-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-300">Enable Policy</label>
                <button
                  type="button"
                  onClick={() => setEnabled(!enabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? "bg-cyan-500" : "bg-slate-600"}`}
                >
                  <span className={`block w-5 h-5 rounded-full bg-white shadow transform transition-transform ${enabled ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Create Policy
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
