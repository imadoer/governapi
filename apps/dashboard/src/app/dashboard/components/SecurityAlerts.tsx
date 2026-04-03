"use client";

import { useState, useEffect } from "react";

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch("/api/health/overview");
        const data = await response.json();
        if (data.apis && data.apis.length > 0) {
          const api = data.apis[0];
          const newAlerts = [
            {
              id: 1,
              time: new Date(api.last_scan).toLocaleTimeString(),
              severity:
                api.risk_level === "CRITICAL"
                  ? "critical"
                  : api.risk_level === "HIGH"
                    ? "warning"
                    : "info",
              message: `Risk Level: ${api.risk_level}`,
              source: "API Scanner",
            },
          ];
          setAlerts(newAlerts);
        }
      } catch (error) {
        console.error("Error fetching alerts:", error);
      }
    };
    fetchAlerts();
  }, []);

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
      <h3 className="text-white font-semibold text-sm mb-3">Security Alerts</h3>
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert: any) => (
            <div key={alert.id} className="flex items-start gap-3 p-2 rounded-lg bg-white/5">
              <span className="w-2 h-2 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
              <div>
                <div className="text-white text-sm font-medium">{alert.message}</div>
                <div className="text-gray-500 text-xs mt-0.5">{alert.time} &bull; Source: {alert.source}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No security alerts</p>
      )}
    </div>
  );
}
