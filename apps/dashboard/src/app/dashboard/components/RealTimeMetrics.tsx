"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/db/supabase";

interface Metrics {
  totalAPIs: number;
  policyCompliance: number;
  securityScore: number;
  monthlySavings: number;
  discoveredThisWeek: number;
}

export function RealTimeMetrics() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalAPIs: 0,
    policyCompliance: 0,
    securityScore: 0,
    monthlySavings: 0,
    discoveredThisWeek: 0,
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const { data: apis } = await supabase.from("apis").select("*");
        const { data: violations } = await supabase
          .from("violations")
          .select("*")
          .eq("status", "active");
        const { data: scans } = await supabase
          .from("scans")
          .select("*")
          .gte(
            "created_at",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          );

        const totalAPIs = apis?.length || 0;
        const activeViolations = violations?.length || 0;
        const policyCompliance =
          totalAPIs > 0
            ? Math.round(((totalAPIs - activeViolations) / totalAPIs) * 100)
            : 100;
        const securityScore = Math.max(50, 100 - activeViolations * 5);
        const monthlySavings = (scans?.length || 0) * 50;
        const discoveredThisWeek = scans?.length || 0;

        setMetrics({
          totalAPIs,
          policyCompliance,
          securityScore,
          monthlySavings,
          discoveredThisWeek,
        });
      } catch (error) {
        console.error("Failed to fetch metrics:", error);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total APIs */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="text-sm text-gray-400 mb-1">Total APIs</div>
        <div className="text-2xl font-bold text-white">{metrics.totalAPIs}</div>
        <div className="text-xs text-emerald-400 mt-1">+{metrics.discoveredThisWeek} discovered this week</div>
      </div>

      {/* Policy Compliance */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="text-sm text-gray-400 mb-1">Policy Compliance</div>
        <div className={`text-2xl font-bold ${metrics.policyCompliance > 80 ? "text-emerald-400" : "text-amber-400"}`}>
          {metrics.policyCompliance}%
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
          <div
            className={`h-1.5 rounded-full ${metrics.policyCompliance > 80 ? "bg-emerald-400" : "bg-amber-400"}`}
            style={{ width: `${metrics.policyCompliance}%` }}
          />
        </div>
      </div>

      {/* Security Score */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="text-sm text-gray-400 mb-1">Security Score</div>
        <div className={`text-2xl font-bold ${metrics.securityScore > 80 ? "text-emerald-400" : "text-amber-400"}`}>
          {metrics.securityScore}/100
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
          <div
            className={`h-1.5 rounded-full ${metrics.securityScore > 80 ? "bg-emerald-400" : "bg-amber-400"}`}
            style={{ width: `${metrics.securityScore}%` }}
          />
        </div>
      </div>

      {/* Monthly Savings */}
      <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-5">
        <div className="text-sm text-gray-400 mb-1">Monthly Savings</div>
        <div className="text-2xl font-bold text-emerald-400">${metrics.monthlySavings}</div>
        <div className="text-xs text-emerald-400 mt-1">28.9% cost reduction</div>
      </div>
    </div>
  );
}
