"use client";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface SecurityScoreProps {
  score: number;
  totalEndpoints: number;
  threatsBlocked: number;
  avgScanScore?: number;
  scoreBreakdown?: any;
  vulnerabilities?: any;
}

function Ring({ value, color, size = 100 }: { value: number; color: string; size?: number }) {
  const r = size * 0.42;
  const circ = 2 * Math.PI * r;
  const off = circ * (1 - Math.min(value, 100) / 100);
  const vb = size;
  const cx = vb / 2;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${vb} ${vb}`} className="w-full h-full -rotate-90">
        <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <motion.circle
          cx={cx} cy={cx} r={r}
          fill="none" stroke={color} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: off }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-white">{Math.round(value)}</span>
      </div>
    </div>
  );
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

  const scanScore = avgScanScore || score;
  const postureScore = score;

  const breakdown = scoreBreakdown || {
    baseScan: scanScore,
    vulnPenalty: 0,
    coveragePenalty: 0,
    stalenessPenalty: 0,
    incidentPenalty: 0,
    controlBonus: 0,
  };

  const vulnData = vulnerabilities || { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

  return (
    <>
      {/* Score rings + stat cards in one row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Scan Score ring card */}
        <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center">
          <div className="text-[12px] text-gray-500 mb-3">Scan Score</div>
          <Ring value={scanScore} color="#06b6d4" size={100} />
          <div className="text-[11px] text-gray-600 mt-2">Average across scans</div>
        </div>

        {/* Posture Score ring card */}
        <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5 flex flex-col items-center">
          <div className="text-[12px] text-gray-500 mb-3">Posture Score</div>
          <Ring value={postureScore} color="#10b981" size={100} />
          <button
            onClick={() => setShowBreakdown(true)}
            className="text-[11px] text-gray-500 hover:text-white mt-2 transition-colors"
          >
            View breakdown →
          </button>
        </div>

        {/* Endpoints */}
        <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5">
          <div className="text-[12px] text-gray-500 mb-2">Endpoints Protected</div>
          <div className="text-2xl font-semibold text-white tracking-tight">{totalEndpoints}</div>
          <div className="text-[11px] text-gray-600 mt-1">Monitored APIs</div>
        </div>

        {/* Threats */}
        <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-5">
          <div className="text-[12px] text-gray-500 mb-2">Policies Active</div>
          <div className="text-2xl font-semibold text-white tracking-tight">{threatsBlocked}</div>
          <div className="text-[11px] text-gray-600 mt-1">Automated alerts</div>
        </div>
      </div>

      {/* Breakdown Modal */}
      <AnimatePresence>
        {showBreakdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowBreakdown(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 380 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#111318] rounded-2xl border border-white/[0.06] shadow-2xl w-[480px] max-w-[92vw] max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
                <h3 className="text-[15px] font-semibold text-white">Posture Score Breakdown</h3>
                <button onClick={() => setShowBreakdown(false)} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/10">
                  <Ring value={postureScore} color="#10b981" size={64} />
                  <div>
                    <div className="text-[12px] text-gray-500">Final Score</div>
                    <div className="text-3xl font-semibold text-white">{postureScore}</div>
                  </div>
                </div>

                {[
                  { label: "Base Scan Score", value: breakdown.baseScan, sign: "+", color: "text-emerald-400" },
                  { label: "Vulnerability Penalty", value: breakdown.vulnPenalty, sign: "-", color: "text-red-400", sub: `${vulnData.critical} critical, ${vulnData.high} high, ${vulnData.medium} medium` },
                  { label: "Coverage Penalty", value: breakdown.coveragePenalty, sign: "-", color: "text-amber-400" },
                  { label: "Staleness Penalty", value: breakdown.stalenessPenalty, sign: "-", color: "text-amber-400" },
                  { label: "Incident Penalty", value: breakdown.incidentPenalty, sign: "-", color: "text-red-400" },
                  { label: "Control Bonus", value: breakdown.controlBonus, sign: "+", color: "text-emerald-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-white/[0.04]">
                    <div>
                      <div className="text-[13px] text-gray-400">{item.label}</div>
                      {item.sub && <div className="text-[11px] text-gray-600">{item.sub}</div>}
                    </div>
                    <span className={`text-[14px] font-medium ${item.color}`}>{item.sign}{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
