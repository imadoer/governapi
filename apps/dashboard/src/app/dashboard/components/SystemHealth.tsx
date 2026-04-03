"use client";

import { useState, useEffect } from "react";

interface HealthData {
  database: string;
  scanner: string;
  apis: string;
  alerts: number;
}

interface Alert {
  id: number;
  component: string;
  message: string;
  timestamp: string;
  severity: string;
}

export function SystemHealth() {
  const [health, setHealth] = useState<HealthData>({
    database: "unknown",
    scanner: "unknown",
    apis: "unknown",
    alerts: 0,
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/health");
        const data = await response.json();
        setHealth(data.health || {});
        setAlerts(data.alerts || []);
      } catch (error) {
        console.error("Failed to fetch health data:", error);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-emerald-400";
      case "degraded": return "text-amber-400";
      case "unhealthy": return "text-red-400";
      default: return "text-gray-400";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "healthy": return "bg-emerald-400";
      case "degraded": return "bg-amber-400";
      case "unhealthy": return "bg-red-400";
      default: return "bg-gray-400";
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="text-sm text-gray-400 mb-1">Database Status</div>
          <div className={`text-xl font-bold flex items-center gap-2 ${getStatusColor(health.database)}`}>
            <span className={`w-2 h-2 rounded-full ${getStatusDot(health.database)}`} />
            {health.database}
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="text-sm text-gray-400 mb-1">Scanner Status</div>
          <div className={`text-xl font-bold flex items-center gap-2 ${getStatusColor(health.scanner)}`}>
            <span className={`w-2 h-2 rounded-full ${getStatusDot(health.scanner)}`} />
            {health.scanner}
          </div>
        </div>
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
          <div className="text-sm text-gray-400 mb-1">Active Alerts</div>
          <div className={`text-xl font-bold ${health.alerts > 0 ? "text-amber-400" : "text-emerald-400"}`}>
            {health.alerts}
          </div>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 mb-6">
          <h4 className="text-white font-semibold mb-4">Recent Alerts</h4>
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 border-l-2 border-amber-400 pl-4">
                <div>
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 font-medium">
                    {alert.component}
                  </span>
                  <p className="text-gray-300 text-sm mt-1">{alert.message}</p>
                  <small className="text-gray-500">{new Date(alert.timestamp).toLocaleString()}</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
