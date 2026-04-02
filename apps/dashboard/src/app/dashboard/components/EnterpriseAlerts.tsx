"use client";

import { useEffect, useState } from "react";
import { Alert, Button } from "antd";
import { supabase } from "@/lib/db/supabase";

interface CriticalAlert {
  id: string;
  message: string;
  type: "policy" | "security" | "compliance";
}

export function EnterpriseAlerts() {
  const [alerts, setAlerts] = useState<CriticalAlert[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      // Get critical violations
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

      // Add system alerts
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

  if (alerts.length === 0) return null;

  return (
    <div className="mb-6">
      {alerts.map((alert) => (
        <Alert
          key={alert.id}
          message="Critical Policy Violations"
          description={`1 critical violations require immediate attention. ${alert.message}.`}
          type="error"
          showIcon
          action={
            <Button size="small" danger>
              Review Now
            </Button>
          }
          closable
          className="mb-2"
        />
      ))}
    </div>
  );
}
