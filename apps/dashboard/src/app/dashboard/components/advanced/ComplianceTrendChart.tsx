"use client";

import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { padChartData } from "../../../../utils/chart-utils";

interface ComplianceTrendChartProps {
  companyId: string;
}

interface HistoryData {
  [framework: string]: Array<{
    date: string;
    score: number;
    passed: number;
    failed: number;
    total: number;
  }>;
}

const FRAMEWORK_COLORS: Record<string, string> = {
  "SOC 2": "#06b6d4",      // cyan
  "GDPR": "#8b5cf6",       // purple
  "ISO 27001": "#f59e0b",  // amber
  "HIPAA": "#10b981",      // emerald
  "PCI DSS": "#ef4444"     // red
};

export default function ComplianceTrendChart({ companyId }: ComplianceTrendChartProps) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [companyId]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/customer/compliance/history", {
        headers: {
          "x-tenant-id": companyId,
          ...(typeof window !== "undefined" && sessionStorage.getItem("sessionToken") ? { "Authorization": `Bearer ${sessionStorage.getItem("sessionToken")}` } : {}),
        },
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.history) {
        // Get all unique dates across all frameworks
        const allDates = new Set<string>();
        Object.values(data.history as HistoryData).forEach((records: any[]) => {
          records.forEach((r) => {
            const dateStr = new Date(r.date).toLocaleDateString();
            allDates.add(dateStr);
          });
        });

        // Create chart data with all dates
        const sortedDates = Array.from(allDates).sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime()
        );

        const chartPoints = sortedDates.map((dateStr) => {
          const point: any = { date: dateStr };
          
          Object.entries(data.history as HistoryData).forEach(([framework, records]) => {
            // Find the record for this date (or closest before it)
            const record = records.find(
              (r) => new Date(r.date).toLocaleDateString() === dateStr
            );
            
            if (record) {
              point[framework] = record.score;
            }
          });

          return point;
        });

        setChartData(chartPoints);
        setFrameworks(Object.keys(data.history));
      }
    } catch (error) {
      console.error("Failed to fetch compliance history:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Compliance Trend</h3>
        <p className="text-slate-400 text-center py-8">
          No assessment history yet. Run your first assessment to see trends over time.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white">Compliance Score Trends</h3>
        <span className="text-sm text-slate-400">Last 30 days</span>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={padChartData(chartData)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
          />
          <YAxis 
            domain={[0, 100]}
            stroke="#94a3b8"
            tick={{ fill: '#94a3b8' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: any) => [`${value}%`, 'Score']}
          />
          <Legend 
            wrapperStyle={{ color: '#94a3b8' }}
          />
          {frameworks.map((framework) => (
            <Line
              key={framework}
              type="monotone"
              dataKey={framework}
              stroke={FRAMEWORK_COLORS[framework] || "#6366f1"}
              strokeWidth={2}
              dot={{ fill: FRAMEWORK_COLORS[framework] || "#6366f1", r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
