"use client";

import { motion } from "framer-motion";
import { ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

interface SecurityScoreProps {
  score: number;
  totalEndpoints: number;
  threatsBlocked: number;
}

export function SecurityScore({
  score,
  totalEndpoints,
  threatsBlocked,
}: SecurityScoreProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-slate-800/50 border border-slate-700"
    >
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1">
          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-2"
          >
            API Security Command Center
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-gray-300"
          >
            Protecting{" "}
            <span className="text-cyan-400 font-bold">{totalEndpoints}</span>{" "}
            endpoints, blocked{" "}
            <span className="text-green-400 font-bold">{threatsBlocked}</span>{" "}
            threats in real-time
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors shadow-lg"
          >
            <div className="flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5" />
              Improve Score
            </div>
          </motion.button>
        </div>

        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="relative"
        >
          <svg className="w-48 h-48 transform -rotate-90">
            <defs>
              <linearGradient
                id="scoreGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="16"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 88}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 88 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 88 * (1 - score / 100),
              }}
              transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="text-6xl font-bold bg-gradient-to-br from-cyan-400 to-purple-600 bg-clip-text text-transparent"
              >
                {score}
              </motion.div>
              <div className="text-sm text-gray-400 mt-1">Security Score</div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
