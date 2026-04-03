"use client";

import { useState, useEffect } from "react";

export function AlertConfiguration() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [severityThreshold, setSeverityThreshold] = useState("HIGH");

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch("/api/notifications");
      const data = await response.json();
      setConfigs(data.alert_configs || []);
    } catch (error) {
      console.error("Failed to fetch alert configs:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, severity_threshold: severityThreshold }),
      });

      if (response.ok) {
        console.log("Alert configuration saved successfully");
        setEmail("");
        setSeverityThreshold("HIGH");
        fetchConfigs();
      } else {
        console.log("Failed to save alert configuration");
      }
    } catch (error) {
      console.log("Error saving configuration");
    }
    setLoading(false);
  };

  const testAlerts = async () => {
    try {
      const response = await fetch("/api/notifications/monitor", {
        method: "POST",
      });
      const data = await response.json();

      if (data.alerts_sent > 0) {
        console.log(`${data.alerts_sent} alert(s) sent based on latest scan results`);
      } else {
        console.log("No alerts triggered - run a security scan first or adjust threshold");
      }
    } catch (error) {
      console.log("Failed to test alerts");
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Security Alert Configuration</h3>

      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alerts@company.com"
            required
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Alert Threshold</label>
          <select
            value={severityThreshold}
            onChange={(e) => setSeverityThreshold(e.target.value)}
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cyan-500 appearance-none cursor-pointer"
          >
            <option value="CRITICAL" className="bg-[#0a0a0f]">Critical Only</option>
            <option value="HIGH" className="bg-[#0a0a0f]">High &amp; Critical</option>
            <option value="MEDIUM" className="bg-[#0a0a0f]">Medium &amp; Above</option>
            <option value="LOW" className="bg-[#0a0a0f]">All Vulnerabilities</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? "Saving..." : "Configure Alerts"}
          </button>
          <button
            type="button"
            onClick={testAlerts}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-sm transition-colors"
          >
            Test Alerts
          </button>
        </div>
      </form>

      <div>
        <h4 className="text-white font-medium mb-3">Active Alert Configurations</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Email</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Threshold</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Status</th>
                <th className="text-left text-gray-400 py-2 px-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config: any, idx: number) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                  <td className="py-2 px-3 text-gray-300">{config.email}</td>
                  <td className="py-2 px-3 text-gray-300">{config.severity_threshold}</td>
                  <td className="py-2 px-3 text-gray-300">{config.enabled ? "Active" : "Disabled"}</td>
                  <td className="py-2 px-3 text-gray-300">{new Date(config.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
