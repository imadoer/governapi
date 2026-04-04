"use client";

import { motion } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";

interface MetricCardProps {
  icon: any;
  label: string;
  value: number | string;
  change?: number;
  trend?: "up" | "down";
  color?: string;
  sparklineData?: any[];
  delay?: number;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-gray-500" />
          <span className="text-[12px] text-gray-500 font-medium">{label}</span>
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center text-[12px] font-medium ${
              trend === "up" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {trend === "up" ? (
              <ArrowTrendingUpIcon className="w-3.5 h-3.5 mr-0.5" />
            ) : (
              <ArrowTrendingDownIcon className="w-3.5 h-3.5 mr-0.5" />
            )}
            {change}%
          </div>
        )}
      </div>

      <div className="text-2xl font-semibold text-white tracking-tight">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </motion.div>
  );
}
