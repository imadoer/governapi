"use client";

import { useState, useEffect } from "react";

export function IntegrationStatus() {
  const [stats, setStats] = useState({
    webhooks: 0,
    alerts: 0,
    reports: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const webhookResponse = await fetch("/api/webhooks");
        const webhookData = await webhookResponse.json();

        const alertResponse = await fetch("/api/notifications");
        const alertData = await alertResponse.json();

        setStats({
          webhooks: webhookData.webhooks?.length || 0,
          alerts: alertData.alert_configs?.length || 0,
          reports: 3,
        });
      } catch (error) {
        console.error("Failed to fetch integration stats:", error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Integration Status</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.webhooks}</div>
          <div className="text-sm text-gray-400 mt-1">Active Webhooks</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-cyan-400">{stats.alerts}</div>
          <div className="text-sm text-gray-400 mt-1">Alert Configs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.reports}</div>
          <div className="text-sm text-gray-400 mt-1">Report Types</div>
        </div>
      </div>
      <div className="mt-4 text-gray-500 text-xs">
        All enterprise integrations are operational and connected to your security platform.
      </div>
    </div>
  );
}
