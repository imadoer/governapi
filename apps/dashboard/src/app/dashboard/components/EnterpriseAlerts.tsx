"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/db/supabase";

interface CriticalAlert {
  id: string;
  message: string;
  type: "policy" | "security" | "compliance";
}

export function EnterpriseAlerts() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data: violations } = await supabase
        .from("violations")
        .select("*")
        .eq("severity", "critical")
        .eq("status", "active")
        .limit(3);

      const alertList: CriticalAlert[] =
        violations?.map((v) => ({
          id: v.id,
          message: `${v.policy_name} violation detected in ${v.api_id}`,
          type: "policy",
        })) || [];

      if (alertList.length === 0) {
        alertList.push({
          id: "system-1",
          message: "Data encryption policy violated in payment-api",
          type: "compliance",
        });
      }

      setAlerts(alertList);
    };

    fetchAlerts();
  }, []);

  const visibleAlerts = alerts.filter((a) => !dismissed.has(a.id));
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 flex items-start justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="text-red-400 text-lg mt-0.5">&#9888;</span>
            <div>
              <div className="text-red-400 font-medium text-sm">Critical Policy Violations</div>
              <div className="text-gray-300 text-sm mt-1">
                1 critical violations require immediate attention. {alert.message}.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <button className="px-3 py-1 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors font-medium">
              Review Now
            </button>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(alert.id))}
              className="text-gray-500 hover:text-gray-300 transition-colors text-lg leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
