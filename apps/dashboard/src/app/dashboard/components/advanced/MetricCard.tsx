"use client";

import { motion } from "framer-motion";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from "@heroicons/react/24/outline";
import { ResponsiveContainer, AreaChart, Area } from "recharts";

interface MetricCardProps {
  icon: any;
  label: string;
  value: number | string;
  change?: number;
  trend?: "up" | "down";
  color: string;
  sparklineData?: any[];
  delay?: number;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  change,
  trend,
  color,
  sparklineData,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{
        scale: 1.02,
        boxShadow: `0 0 24px ${color}40`,
        transition: { duration: 0.2 },
      }}
      className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 shadow-xl transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-4">
        <motion.div
          className="p-3 rounded-xl"
          style={{
            backgroundColor: `${color}25`,
          }}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </motion.div>
        {change !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.2 }}
            className={`flex items-center text-sm font-semibold ${
              trend === "up" ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {trend === "up" ? (
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
            )}
            {change}%
          </motion.div>
        )}
      </div>

      <div className="text-3xl font-bold text-white mb-1">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>

      <div className="text-sm text-slate-400">{label}</div>

      {sparklineData && (
        <div className="mt-4 h-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient
                  id={`gradient-${label}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={`url(#gradient-${label})`}
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
