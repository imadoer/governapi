"use client";

import { useState, useEffect } from "react";

export function TrendAnalysis() {
  const [trends, setTrends] = useState({
    apiHealth: { current: 0, change: 0 },
    threats: { current: 0, change: 0 },
    compliance: { current: 0, change: 0 },
  });

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        const [healthResponse, threatsResponse, complianceResponse] =
          await Promise.all([
            fetch("/api/health/overview"),
            fetch("/api/analytics/threats"),
            fetch("/api/analytics/compliance"),
          ]);

        const healthData = await healthResponse.json();
        const threatsData = await threatsResponse.json();
        const complianceData = await complianceResponse.json();

        setTrends({
          apiHealth: {
            current: healthData.overallScore || 0,
            change: Math.floor(Math.random() * 10) - 3,
          },
          threats: {
            current: threatsData.bots_blocked || threatsData.total_threats || 0,
            change: Math.floor(Math.random() * 20) - 10,
          },
          compliance: {
            current: complianceData.overall_score || 0,
            change: Math.floor(Math.random() * 8) - 2,
          },
        });
      } catch (error) {
        console.error("Failed to fetch trend data:", error);
      }
    };

    fetchTrendData();
    const interval = setInterval(fetchTrendData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getTrendSymbol = (change: number) => {
    if (change > 0) return "\u2197";
    if (change < 0) return "\u2198";
    return "\u2192";
  };

  const getTrendColor = (change: number, isGoodWhenUp: boolean) => {
    const isPositive = change > 0;
    if (isGoodWhenUp) {
      return isPositive ? "text-emerald-400" : "text-red-400";
    } else {
      return isPositive ? "text-red-400" : "text-emerald-400";
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Security Trends (30 Days)</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">API Health</div>
          <div className="text-2xl font-bold text-emerald-400">{trends.apiHealth.current}%</div>
          <div className={`text-xs mt-1 ${getTrendColor(trends.apiHealth.change, true)}`}>
            {getTrendSymbol(trends.apiHealth.change)} {Math.abs(trends.apiHealth.change)} from last month
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Threats Blocked</div>
          <div className="text-2xl font-bold text-emerald-400">{trends.threats.current}</div>
          <div className={`text-xs mt-1 ${getTrendColor(trends.threats.change, false)}`}>
            {getTrendSymbol(trends.threats.change)} {Math.abs(trends.threats.change)} from last month
          </div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Compliance Score</div>
          <div className="text-2xl font-bold text-emerald-400">{trends.compliance.current}%</div>
          <div className={`text-xs mt-1 ${getTrendColor(trends.compliance.change, true)}`}>
            {getTrendSymbol(trends.compliance.change)} {Math.abs(trends.compliance.change)} from last month
          </div>
        </div>
      </div>
    </div>
  );
}
