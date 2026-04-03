"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/db/supabase";

interface APIStats {
  critical: number;
  internal: number;
  external: number;
  unclassified: number;
  total: number;
}

export function LiveAPIInventory() {
  const [stats, setStats] = useState<APIStats>({
    critical: 0,
    internal: 0,
    external: 0,
    unclassified: 0,
    total: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: apis } = await supabase
        .from("apis")
        .select("classification");

      if (apis) {
        const stats = apis.reduce(
          (acc, api) => {
            acc.total++;
            acc[api.classification as keyof APIStats]++;
            return acc;
          },
          { critical: 0, internal: 0, external: 0, unclassified: 0, total: 0 },
        );
        setStats(stats);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const classificationPercentage =
    stats.total > 0
      ? Math.round(((stats.total - stats.unclassified) / stats.total) * 100)
      : 0;

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">API Inventory</h3>
        <span className="text-cyan-400 text-sm cursor-pointer hover:text-cyan-300">View All</span>
      </div>

      {/* Circle Progress */}
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-[120px] h-[120px]">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="50" fill="none" stroke="#06b6d4" strokeWidth="8"
              strokeDasharray={`${classificationPercentage * 3.14} ${314 - classificationPercentage * 3.14}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{classificationPercentage}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Critical APIs:</span>
          <span className="font-semibold text-white">{stats.critical}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">Internal APIs:</span>
          <span className="font-semibold text-white">{stats.internal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400 text-sm">External APIs:</span>
          <span className="font-semibold text-white">{stats.external}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-amber-400 text-sm">Unclassified:</span>
          <span className="font-semibold text-amber-400">{stats.unclassified}</span>
        </div>
      </div>
    </div>
  );
}
