"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface ScanModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (values: Record<string, string>) => void;
  loading?: boolean;
}

export default function ScanModal({
  visible,
  onCancel,
  onSubmit,
  loading,
}: ScanModalProps) {
  const [formData, setFormData] = useState({
    target: "",
    apiType: "",
    environment: "",
    scanType: "",
    authType: "",
    schedule: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const selectClass =
    "w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none cursor-pointer";
  const labelClass = "block text-sm font-medium text-slate-300 mb-2";

  return (
    <AnimatePresence>
      {visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-xl mx-4 bg-slate-800/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <h2 className="text-lg font-semibold text-white">Configure API Security Scan</h2>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className={labelClass}>API Endpoint URL</label>
                <input
                  type="url"
                  value={formData.target}
                  onChange={(e) => handleChange("target", e.target.value)}
                  placeholder="https://api.example.com"
                  required
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>API Type</label>
                  <select
                    value={formData.apiType}
                    onChange={(e) => handleChange("apiType", e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="" className="bg-slate-800">Select API type</option>
                    <option value="rest" className="bg-slate-800">REST API</option>
                    <option value="graphql" className="bg-slate-800">GraphQL</option>
                    <option value="grpc" className="bg-slate-800">gRPC</option>
                    <option value="soap" className="bg-slate-800">SOAP</option>
                    <option value="websocket" className="bg-slate-800">WebSocket</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Environment</label>
                  <select
                    value={formData.environment}
                    onChange={(e) => handleChange("environment", e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="" className="bg-slate-800">Select environment</option>
                    <option value="production" className="bg-slate-800">Production</option>
                    <option value="staging" className="bg-slate-800">Staging</option>
                    <option value="development" className="bg-slate-800">Development</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Scan Type</label>
                  <select
                    value={formData.scanType}
                    onChange={(e) => handleChange("scanType", e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="" className="bg-slate-800">Select scan type</option>
                    <option value="discovery" className="bg-slate-800">API Discovery</option>
                    <option value="security" className="bg-slate-800">Security Scan</option>
                    <option value="compliance" className="bg-slate-800">Compliance Check</option>
                    <option value="full" className="bg-slate-800">Full Audit</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Authentication</label>
                  <select
                    value={formData.authType}
                    onChange={(e) => handleChange("authType", e.target.value)}
                    required
                    className={selectClass}
                  >
                    <option value="" className="bg-slate-800">Select auth type</option>
                    <option value="none" className="bg-slate-800">No Authentication</option>
                    <option value="apikey" className="bg-slate-800">API Key</option>
                    <option value="bearer" className="bg-slate-800">Bearer Token</option>
                    <option value="oauth2" className="bg-slate-800">OAuth 2.0</option>
                    <option value="basic" className="bg-slate-800">Basic Auth</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Schedule</label>
                <select
                  value={formData.schedule}
                  onChange={(e) => handleChange("schedule", e.target.value)}
                  required
                  className={selectClass}
                >
                  <option value="" className="bg-slate-800">Select schedule</option>
                  <option value="now" className="bg-slate-800">Run Now</option>
                  <option value="hourly" className="bg-slate-800">Hourly</option>
                  <option value="daily" className="bg-slate-800">Daily</option>
                  <option value="weekly" className="bg-slate-800">Weekly</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold text-sm hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && (
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  )}
                  Start Scan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
