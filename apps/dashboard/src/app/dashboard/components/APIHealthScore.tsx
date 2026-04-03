"use client";

import { useState, useEffect } from "react";

export function APIHealthScore() {
  const [healthData, setHealthData] = useState({
    overallScore: 0,
    apis: [] as any[],
  });

  useEffect(() => {
    const fetchRealHealthData = async () => {
      try {
        const response = await fetch("/api/health/overview");
        const data = await response.json();
        setHealthData(data);
      } catch (error) {
        console.error("Failed to fetch health data:", error);
      }
    };

    fetchRealHealthData();
    const interval = setInterval(fetchRealHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getScoreColor = (score: number) => {
    if (score > 80) return "text-emerald-400";
    if (score > 60) return "text-amber-400";
    return "text-red-400";
  };

  const getBarColor = (score: number) => {
    if (score > 80) return "bg-emerald-400";
    if (score > 60) return "bg-amber-400";
    return "bg-red-400";
  };

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-6">API Health Overview</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Circle Progress */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-[120px] h-[120px]">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="50" fill="none" stroke="#10b981" strokeWidth="8"
                strokeDasharray={`${healthData.overallScore * 3.14} ${314 - healthData.overallScore * 3.14}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-white">{healthData.overallScore}%</span>
            </div>
          </div>
          <div className="mt-4 text-white font-semibold">Overall Health Score</div>
        </div>

        {/* API List */}
        <div className="md:col-span-2 space-y-3">
          {healthData.apis.map((api: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5"
            >
              <span className="text-gray-300 text-sm">{api.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-28 bg-white/10 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full ${getBarColor(api.health_score)}`}
                    style={{ width: `${api.health_score}%` }}
                  />
                </div>
                <span className={`font-bold text-sm w-8 text-right ${getScoreColor(api.health_score)}`}>
                  {api.health_score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
