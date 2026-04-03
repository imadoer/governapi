"use client";

import { useState, useEffect } from "react";

export function BotDetection() {
  const [botData, setBotData] = useState({
    total_requests: 0,
    bot_requests_detected: 0,
    bots_blocked: 0,
    success_rate: 0,
    recent_bots: [] as any[],
  });

  useEffect(() => {
    const fetchBotData = async () => {
      try {
        const response = await fetch("/api/bot-detection");
        const data = await response.json();
        setBotData(data);
      } catch (error) {
        console.error("Failed to fetch bot data:", error);
      }
    };

    fetchBotData();
    const interval = setInterval(fetchBotData, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      <h3 className="text-lg font-semibold text-white mb-6">Bot Detection Analytics</h3>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-sm text-gray-400 mb-1">Total Requests</div>
          <div className="text-2xl font-bold text-cyan-400">{botData.total_requests}</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-sm text-gray-400 mb-1">Bot Requests Detected</div>
          <div className="text-2xl font-bold text-amber-400">{botData.bot_requests_detected}</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-sm text-gray-400 mb-1">Bots Blocked</div>
          <div className="text-2xl font-bold text-red-400">{botData.bots_blocked}</div>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="text-sm text-gray-400 mb-1">Success Rate</div>
          <div className={`text-2xl font-bold ${botData.success_rate > 90 ? "text-emerald-400" : "text-amber-400"}`}>
            {botData.success_rate}%
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-white font-medium mb-3">Recent Bot Activity</h4>
        {botData.recent_bots.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-gray-400 py-2 px-3 font-medium">Time</th>
                  <th className="text-left text-gray-400 py-2 px-3 font-medium">IP</th>
                  <th className="text-left text-gray-400 py-2 px-3 font-medium">User Agent</th>
                  <th className="text-left text-gray-400 py-2 px-3 font-medium">Confidence</th>
                  <th className="text-left text-gray-400 py-2 px-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {botData.recent_bots.map((bot: any, idx: number) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-2 px-3 text-gray-300">{new Date(bot.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2 px-3 text-gray-300">{bot.ip}</td>
                    <td className="py-2 px-3 text-gray-300">{bot.user_agent ? bot.user_agent.substring(0, 50) + "..." : "N/A"}</td>
                    <td className="py-2 px-3 text-gray-300">{bot.confidence}%</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${bot.blocked ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                        {bot.blocked ? "BLOCKED" : "ALLOWED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-5 text-gray-500">
            No bot activity detected. Route API traffic through /api/proxy to see real data.
          </div>
        )}
      </div>
    </div>
  );
}
