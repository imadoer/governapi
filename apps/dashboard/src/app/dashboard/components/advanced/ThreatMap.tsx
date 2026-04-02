"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface ThreatLocation {
  lat: number;
  lng: number;
  city: string;
  country: string;
  threats: number;
}

interface ThreatMapProps {
  threats: ThreatLocation[];
}

export function ThreatMap({ threats }: ThreatMapProps) {
  const [animatedThreats, setAnimatedThreats] = useState<ThreatLocation[]>([]);

  useEffect(() => {
    setAnimatedThreats(threats);
  }, [threats]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9 }}
      className="rounded-2xl p-6 backdrop-blur-xl bg-white/5 border border-white/10"
    >
      <h3 className="text-xl font-bold text-white mb-6">Global Threat Map</h3>

      <div className="relative h-96 bg-slate-900/50 rounded-xl overflow-hidden">
        {/* World Map Visualization */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="relative w-full h-full"
          >
            {/* Simplified world map SVG background */}
            <div className="absolute inset-0 opacity-20">
              <svg viewBox="0 0 1000 500" className="w-full h-full">
                <path
                  d="M150,250 Q250,200 350,250 T550,250 Q650,300 750,250 T950,250"
                  stroke="rgba(6, 182, 212, 0.5)"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </div>

            {/* Threat markers */}
            {animatedThreats.map((threat, index) => {
              const x = (threat.lng + 180) * (1000 / 360);
              const y = (90 - threat.lat) * (500 / 180);

              return (
                <motion.div
                  key={index}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1, type: "spring" }}
                  className="absolute"
                  style={{ left: `${x / 10}%`, top: `${y / 5}%` }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.8, 1, 0.8],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2,
                    }}
                    className="relative"
                  >
                    <div className="w-4 h-4 rounded-full bg-red-500 shadow-lg shadow-red-500/50" />
                    <motion.div
                      animate={{
                        scale: [1, 2, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: index * 0.2,
                      }}
                      className="absolute inset-0 rounded-full bg-red-500"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileHover={{ opacity: 1, y: 0 }}
                    className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-slate-900/90 backdrop-blur-xl border border-red-500/30 rounded-lg px-3 py-2 whitespace-nowrap pointer-events-none"
                  >
                    <div className="text-xs font-semibold text-white">
                      {threat.city}, {threat.country}
                    </div>
                    <div className="text-xs text-red-400">
                      {threat.threats} threats
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-lg p-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Active Threat Sources</span>
          </div>
        </div>
      </div>

      {/* Top Threat Sources */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {threats.slice(0, 4).map((threat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 + index * 0.1 }}
            className="p-3 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="text-sm font-semibold text-white">
              {threat.city}, {threat.country}
            </div>
            <div className="text-xs text-red-400 mt-1">
              {threat.threats} attacks detected
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
