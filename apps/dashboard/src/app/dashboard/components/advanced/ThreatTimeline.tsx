"use client";

import { useState } from "react";
import useSWR from "swr";
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { ChartBarIcon } from "@heroicons/react/24/outline";

const fetcher = (url: string, _tid: string) => {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("sessionToken") || "" : "";
  return fetch(url, { headers: token ? { "Authorization": `Bearer ${token}` } : {}, credentials: "include" }).then((r) => r.json());
};

const tip = {
  contentStyle: { background: "#111318", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, fontSize: 12 },
  itemStyle: { color: "#e2e8f0" },
  labelStyle: { color: "#64748b" },
};

export function ThreatTimeline({ companyId }: { companyId: string }) {
  const [range, setRange] = useState("7d");

  const { data: raw } = useSWR(
    companyId ? [`/api/customer/dashboard/timeline/${range}`, companyId] : null,
    ([u, id]: [string, string]) => fetcher(u, id),
    { refreshInterval: 60_000 },
  );

  const timeline = raw?.success ? raw.timeline ?? [] : [];
  const hasData = raw?.hasData ?? false;

  const formatted = timeline.map((t: any) => {
    const d = new Date(t.bucket);
    return {
      ...t,
      label: range === "24h"
        ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  const ranges = [
    { key: "24h", label: "24h" },
    { key: "7d", label: "7d" },
    { key: "30d", label: "30d" },
  ];

  return (
    <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[13px] font-medium text-gray-400">Threat Detection Timeline</h3>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                range === r.key ? "bg-white/[0.08] text-white" : "text-gray-600 hover:text-gray-400"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {hasData ? (
        <div className="space-y-6">
          {/* Scan scores area chart */}
          {formatted.some((d: any) => d.avgScore != null) && (
            <div>
              <div className="text-[11px] text-gray-600 mb-2">Scan Scores</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={formatted}>
                  <defs>
                    <linearGradient id="tl-score" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" stroke="#4b5563" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fontSize: 10 }} />
                  <RechartsTooltip {...tip} />
                  <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="#06b6d4" fill="url(#tl-score)" strokeWidth={1.5} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Scans + threats bar chart */}
          <div>
            <div className="text-[11px] text-gray-600 mb-2">Activity</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={formatted} barSize={range === "24h" ? 8 : 14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="label" stroke="#4b5563" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} stroke="#4b5563" tick={{ fontSize: 10 }} />
                <RechartsTooltip {...tip} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                <Bar dataKey="scans" name="Scans" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                <Bar dataKey="threats" name="Findings" fill="#ef4444" radius={[3, 3, 0, 0]} />
                <Bar dataKey="blocked" name="Resolved" fill="#10b981" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ChartBarIcon className="w-8 h-8 text-gray-700 mb-3" />
          <p className="text-[13px] text-gray-500">No threat data yet</p>
          <p className="text-[11px] text-gray-600 mt-1">Add an API endpoint to start monitoring</p>
        </div>
      )}
    </div>
  );
}
