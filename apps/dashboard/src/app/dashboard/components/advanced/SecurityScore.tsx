"use client";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowTrendingUpIcon, InformationCircleIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface SecurityScoreProps {
  score: number;
  totalEndpoints: number;
  threatsBlocked: number;
  avgScanScore?: number;
  scoreBreakdown?: any;
  vulnerabilities?: any;
}

export function SecurityScore({
  score,
  totalEndpoints,
  threatsBlocked,
  avgScanScore,
  scoreBreakdown,
  vulnerabilities,
}: SecurityScoreProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const actualAvgScore = avgScanScore || score;
  const actualPostureScore = score;

  const breakdown = scoreBreakdown || {
    baseScan: actualAvgScore,
    vulnPenalty: 0,
    coveragePenalty: 0,
    stalenessPenalty: 0,
    incidentPenalty: 0,
    controlBonus: 0,
  };

  const vulnData = vulnerabilities || {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
    total: 0,
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 bg-slate-800/50 border border-slate-700"
      >
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Text Content */}
          <div className="flex-1 max-w-xl">
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
              className="text-xl text-gray-300 mb-6"
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
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-xl font-semibold transition-colors shadow-lg"
            >
              <div className="flex items-center gap-2">
                <ArrowTrendingUpIcon className="w-5 h-5" />
                Improve Score
              </div>
            </motion.button>
          </div>

          {/* Right: Dual Circular Scores */}
          <div className="flex gap-12">
            {/* Average Scan Score */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="relative flex flex-col items-center"
            >
              <div className="relative">
                <svg className="w-56 h-56 transform -rotate-90">
                  <defs>
                    <linearGradient
                      id="avgGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="112"
                    cy="112"
                    r="100"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="20"
                  />
                  <motion.circle
                    cx="112"
                    cy="112"
                    r="100"
                    fill="none"
                    stroke="url(#avgGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 100}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 100 * (1 - actualAvgScore / 100),
                    }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.8, type: "spring" }}
                    className="text-6xl font-bold text-white"
                  >
                    {actualAvgScore}
                  </motion.div>
                  <div className="text-sm text-gray-400 mt-1">Scan Score</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm font-semibold text-purple-400 uppercase tracking-wider">
                  Average Scan Score
                </div>
                <div className="text-xs text-gray-500 mt-1">Simple average</div>
              </div>
            </motion.div>

            {/* Security Posture Score */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
              className="relative flex flex-col items-center"
            >
              <div className="relative">
                <svg className="w-56 h-56 transform -rotate-90">
                  <defs>
                    <linearGradient
                      id="postureGradient"
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
                    cx="112"
                    cy="112"
                    r="100"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="20"
                  />
                  <motion.circle
                    cx="112"
                    cy="112"
                    r="100"
                    fill="none"
                    stroke="url(#postureGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 100}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 100 }}
                    animate={{
                      strokeDashoffset: 2 * Math.PI * 100 * (1 - actualPostureScore / 100),
                    }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.9, type: "spring" }}
                    className="text-6xl font-bold text-white"
                  >
                    {actualPostureScore}
                  </motion.div>
                  <div className="text-sm text-gray-400 mt-1">Posture Score</div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">
                  Security Posture
                </div>
                <button
                  onClick={() => setShowBreakdown(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 underline mt-1 transition-colors"
                >
                  View Breakdown
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Breakdown Modal (same as before) */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowBreakdown(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-2xl border border-slate-700 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Security Posture Score Breakdown
                </h2>
                <button
                  onClick={() => setShowBreakdown(false)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-400" />
                </button>
              </div>

              <div className="mb-8 p-6 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 border border-cyan-500/30 rounded-xl">
                <div className="text-sm text-gray-300 mb-2">Your Security Posture Score</div>
                <div className="text-5xl font-bold text-white">{actualPostureScore}</div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Base Scan Score</span>
                    <span className="text-green-400 font-bold text-lg">+{breakdown.baseScan}</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-400"
                      style={{ width: `${breakdown.baseScan}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Vulnerability Penalty</span>
                    <span className="text-red-400 font-bold text-lg">-{breakdown.vulnPenalty}</span>
                  </div>
                  <div className="text-xs text-gray-400">
                    {vulnData.critical} critical, {vulnData.high} high, {vulnData.medium} medium, {vulnData.low} low
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Coverage Penalty</span>
                    <span className="text-orange-400 font-bold">-{breakdown.coveragePenalty}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Staleness Penalty</span>
                    <span className="text-orange-400 font-bold">-{breakdown.stalenessPenalty}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Incident Penalty</span>
                    <span className="text-red-400 font-bold">-{breakdown.incidentPenalty}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Control Bonus</span>
                    <span className="text-green-400 font-bold">+{breakdown.controlBonus}</span>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-white">Final Score</span>
                    <span className="text-4xl font-bold text-cyan-400">{actualPostureScore}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
