"use client";

import { Card, Alert, List } from "antd";
import { useState, useEffect } from "react";

export function RiskAssessment() {
  const [risks, setRisks] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>("");

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const response = await fetch("/api/health/overview");
        const data = await response.json();

        if (data.apis && data.apis.length > 0) {
          const api = data.apis[0];
          const riskItems = [];

          if (api.vulnerability_count > 0) {
            riskItems.push({
              severity: api.risk_level,
              title: `${api.name} has ${api.vulnerability_count} security vulnerabilities`,
              description: `Risk level: ${api.risk_level}. Requires immediate attention.`,
              action:
                "Review and fix security vulnerabilities identified in scan",
            });
          }

          if (api.vulnerability_count >= 5) {
            riskItems.push({
              severity: "MEDIUM",
              title: "Multiple security headers missing",
              description:
                "API lacks essential security headers for XSS and CSRF protection",
              action:
                "Configure security headers according to OWASP guidelines",
            });
          }

          setRisks(riskItems);
          setSummary(
            `${riskItems.length} security issues require attention based on recent scan`,
          );
        } else {
          setSummary(
            "No security scans available. Run a scan to assess risks.",
          );
        }
      } catch (error) {
        console.error("Failed to fetch risk data:", error);
      }
    };

    fetchRiskData();
    const interval = setInterval(fetchRiskData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityType = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "error";
      case "HIGH":
        return "warning";
      case "MEDIUM":
        return "info";
      default:
        return "success";
    }
  };

  return (
    <Card title="Risk Assessment">
      <Alert
        message={summary}
        type={risks.length > 0 ? "warning" : "success"}
        showIcon
        style={{ marginBottom: 16 }}
      />
      <List
        dataSource={risks}
        renderItem={(risk, index) => (
          <List.Item key={index}>
            <List.Item.Meta
              avatar={
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor:
                      risk.severity === "CRITICAL"
                        ? "#ff4d4f"
                        : risk.severity === "HIGH"
                          ? "#fa8c16"
                          : "#1890ff",
                  }}
                />
              }
              title={
                <span style={{ fontWeight: "bold" }}>{risk.severity}</span>
              }
              description={
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>
                    {risk.title}
                  </div>
                  <div style={{ color: "#666", marginBottom: 4 }}>
                    {risk.description}
                  </div>
                  <div style={{ fontWeight: 500, color: "#1890ff" }}>
                    Action: {risk.action}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
}
