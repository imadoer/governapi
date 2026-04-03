"use client";

import { useState, useEffect } from "react";

export function RiskAssessment() {
  const [risks, setRisks] = useState<any[]>([]);
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    const fetchRiskData = async () => {
      try {
        const response = await fetch("/api/health/overview");
        const data = await response.json();

        if (data.apis && data.apis.length > 0) {
          const api = data.apis[0];
          const riskItems: any[] = [];

          if (api.vulnerability_count > 0) {
            riskItems.push({
              severity: api.risk_level,
              title: `${api.name} has ${api.vulnerability_count} security vulnerabilities`,
              description: `Risk level: ${api.risk_level}. Requires immediate attention.`,
              action: "Review and fix security vulnerabilities identified in scan",
            });
          }

          if (api.vulnerability_count >= 5) {
            riskItems.push({
              severity: "MEDIUM",
              title: "Multiple security headers missing",
              description: "API lacks essential security headers for XSS and CSRF protection",
              action: "Configure security headers according to OWASP guidelines",
            });
          }

          setRisks(riskItems);
          setSummary(`${riskItems.length} security issues require attention based on recent scan`);
        } else {
          setSummary("No security scans available. Run a scan to assess risks.");
        }
      } catch (error) {
        console.error("Failed to fetch risk data:", error);
      }
    };

    fetchRiskData();
    const interval = setInterval(fetchRiskData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "text-red-400 bg-red-500/20";
      case "HIGH": return "text-amber-400 bg-amber-500/20";
      case "MEDIUM": return "text-cyan-400 bg-cyan-500/20";
      default: return "text-emerald-400 bg-emerald-500/20";
    }
  };

  const getDotColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL": return "bg-red-400";
      case "HIGH": return "bg-amber-400";
      default: return "bg-cyan-400";
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Risk Assessment</h3>

      <div className={`rounded-lg p-3 mb-4 ${risks.length > 0 ? "bg-amber-500/10 border border-amber-500/20" : "bg-emerald-500/10 border border-emerald-500/20"}`}>
        <p className={`text-sm ${risks.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
          {summary}
        </p>
      </div>

      <div className="space-y-4">
        {risks.map((risk, index) => (
          <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/5">
            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${getDotColor(risk.severity)}`} />
            <div className="flex-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                {risk.severity}
              </span>
              <div className="text-white font-medium mt-1">{risk.title}</div>
              <div className="text-gray-400 text-sm mt-1">{risk.description}</div>
              <div className="text-cyan-400 text-sm font-medium mt-1">Action: {risk.action}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
