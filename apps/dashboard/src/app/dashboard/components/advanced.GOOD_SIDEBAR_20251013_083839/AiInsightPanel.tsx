"use client";

import { motion } from "framer-motion";
import {
  SparklesIcon,
  LightBulbIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

interface AiInsightPanelProps {
  insights: {
    type: "anomaly" | "recommendation" | "alert";
    title: string;
    description: string;
    action?: string;
  }[];
}

export function AiInsightPanel({ insights }: AiInsightPanelProps) {
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "anomaly":
        return <ExclamationCircleIcon className="w-5 h-5" />;
      case "recommendation":
        return <LightBulbIcon className="w-5 h-5" />;
      default:
        return <SparklesIcon className="w-5 h-5" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case "anomaly":
        return "from-red-500/20 to-orange-500/20 border-red-500/30";
      case "recommendation":
        return "from-blue-500/20 to-cyan-500/20 border-cyan-500/30";
      default:
        return "from-purple-500/20 to-pink-500/20 border-purple-500/30";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="rounded-2xl p-6 backdrop-blur-xl bg-white/5 border border-white/10"
    >
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <SparklesIcon className="w-6 h-6 text-purple-400" />
        </motion.div>
        <h3 className="text-xl font-bold text-white">AI Security Insights</h3>
        <motion.div
          className="ml-auto px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs font-semibold text-purple-400">
            POWERED BY AI
          </span>
        </motion.div>
      </div>

      <div className="space-y-4">
        {insights.map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-xl bg-gradient-to-br ${getInsightColor(insight.type)} border backdrop-blur-sm`}
          >
            <div className="flex items-start gap-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-2 rounded-lg bg-white/10"
              >
                {getInsightIcon(insight.type)}
              </motion.div>
              <div className="flex-1">
                <div className="text-white font-semibold mb-1">
                  {insight.title}
                </div>
                <div className="text-sm text-gray-300 mb-2">
                  {insight.description}
                </div>
                {insight.action && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    {insight.action} →
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
