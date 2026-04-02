"use client";
import { Card, List, Badge, Button } from "antd";
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
    <Card title="Security Alerts" size="small">
      {alerts.length > 0 ? (
        <List
          size="small"
          dataSource={alerts}
          renderItem={(alert: any) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Badge status="error" />}
                title={alert.message}
                description={`${alert.time} • Source: ${alert.source}`}
              />
            </List.Item>
          )}
        />
      ) : (
        <p>No security alerts</p>
      )}
    </Card>
  );
}
