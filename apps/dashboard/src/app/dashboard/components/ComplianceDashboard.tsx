"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";

export function ComplianceDashboard() {
  const [loading, setLoading] = useState(false);
  const [framework, setFramework] = useState("SOC2");

  const frameworks: Record<string, { score: number; color: string }> = {
    SOC2: { score: 92, color: "#06b6d4" },
    GDPR: { score: 88, color: "#3b82f6" },
    "PCI-DSS": { score: 79, color: "#f59e0b" },
    HIPAA: { score: 94, color: "#8b5cf6" },
    "ISO-27001": { score: 85, color: "#10b981" },
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/compliance/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ framework, format: "detailed" }),
      });
      const data = await response.json();
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.report, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${framework}-compliance-report-${Date.now()}.json`;
        a.click();
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Compliance Management</h3>

      <div className="flex items-center gap-4 mb-6">
        <select
          value={framework}
          onChange={(e) => setFramework(e.target.value)}
          className="bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer"
        >
          {Object.keys(frameworks).map((fw) => (
            <option key={fw} value={fw} className="bg-slate-800">{fw}</option>
          ))}
        </select>
        <button
          onClick={generateReport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <ArrowDownTrayIcon className="w-4 h-4" />
          )}
          Generate {framework} Report
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Object.entries(frameworks).map(([fw, data], i) => (
          <motion.div
            key={fw}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="bg-slate-900/50 border border-white/10 rounded-xl p-4 text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-2">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.915" fill="none"
                  stroke={data.color}
                  strokeWidth="3"
                  strokeDasharray={`${data.score} ${100 - data.score}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{data.score}%</span>
              </div>
            </div>
            <div className="text-sm font-semibold text-white">{fw}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
