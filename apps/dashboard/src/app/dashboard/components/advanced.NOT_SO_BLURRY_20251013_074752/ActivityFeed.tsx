"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  BoltIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface Activity {
  id: number;
  type: "block" | "scan" | "threat" | "compliance";
  message: string;
  ip?: string;
  time: string;
  severity: "critical" | "warning" | "success" | "info";
}

interface ActivityFeedProps {
  activities: Activity[];
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      case "warning":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "success":
        return "bg-green-500/20 text-green-400 border-green-500/50";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "block":
        return <ShieldCheckIcon className="w-5 h-5" />;
      case "threat":
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case "scan":
        return <BoltIcon className="w-5 h-5" />;
      case "compliance":
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <BoltIcon className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="rounded-2xl p-6 backdrop-blur-xl bg-white/5 border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">Live Activity Feed</h3>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex items-center gap-2"
        >
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-sm text-green-400 font-semibold">LIVE</span>
        </motion.div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{
                x: 4,
                boxShadow: "0 0 20px rgba(6, 182, 212, 0.2)",
              }}
              className={`p-4 rounded-xl border backdrop-blur-sm ${getSeverityColor(activity.severity)}`}
            >
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {getIcon(activity.type)}
                </motion.div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-1">
                    {activity.message}
                  </div>
                  {activity.ip && (
                    <div className="text-xs opacity-75 font-mono">
                      IP: {activity.ip}
                    </div>
                  )}
                  <div className="text-xs opacity-60 mt-1">{activity.time}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(6, 182, 212, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(6, 182, 212, 0.7);
        }
      `}</style>
    </motion.div>
  );
}
