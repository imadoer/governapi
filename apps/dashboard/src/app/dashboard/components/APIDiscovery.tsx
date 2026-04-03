"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MagnifyingGlassIcon, GlobeAltIcon, ServerIcon, LockClosedIcon } from "@heroicons/react/24/outline";

interface DiscoveredAPI {
  id: string;
  url: string;
  type: string;
  method: string;
  status: string;
  responseTime?: number;
  lastSeen?: string;
  version?: string;
  authentication?: string;
}

interface APIStats {
  totalAPIs?: number;
  activeAPIs?: number;
  publicAPIs?: number;
  privateAPIs?: number;
}

const methodColors: Record<string, string> = {
  GET: "bg-blue-500/15 text-blue-400",
  POST: "bg-emerald-500/15 text-emerald-400",
  PUT: "bg-amber-500/15 text-amber-400",
  DELETE: "bg-red-500/15 text-red-400",
};

const typeColors: Record<string, string> = {
  REST: "bg-blue-500/15 text-blue-400",
  GraphQL: "bg-violet-500/15 text-violet-400",
  SOAP: "bg-amber-500/15 text-amber-400",
  WebSocket: "bg-emerald-500/15 text-emerald-400",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  inactive: "bg-red-500/15 text-red-400",
  unknown: "bg-amber-500/15 text-amber-400",
  deprecated: "bg-slate-500/15 text-slate-400",
};

export function APIDiscovery() {
  const [discoveredAPIs, setDiscoveredAPIs] = useState<DiscoveredAPI[]>([]);
  const [stats, setStats] = useState<APIStats>({});
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState("");
  const [scanType, setScanType] = useState("");
  const [depth, setDepth] = useState("");

  useEffect(() => {
    fetchDiscoveredAPIs();
  }, []);

  const fetchDiscoveredAPIs = async () => {
    try {
      const response = await fetch("/api/discovery");
      const data = await response.json();
      setDiscoveredAPIs(data.apis || []);
      setStats(data.stats || {});
    } catch (error) {
      console.error("Error fetching discovered APIs:", error);
    }
  };

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target || !scanType) return;
    setLoading(true);
    try {
      const response = await fetch("/api/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, scanType, depth: depth || "shallow" }),
      });
      if (response.ok) {
        await fetchDiscoveredAPIs();
      }
    } catch (error) {
      console.error("Discovery scan error:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: "Total APIs", value: stats.totalAPIs || 0, color: "text-cyan-400", icon: GlobeAltIcon },
    { label: "Active APIs", value: stats.activeAPIs || 0, color: "text-emerald-400", icon: ServerIcon },
    { label: "Public APIs", value: stats.publicAPIs || 0, color: "text-amber-400", icon: MagnifyingGlassIcon },
    { label: "Private APIs", value: stats.privateAPIs || 0, color: "text-violet-400", icon: LockClosedIcon },
  ];

  const selectClass = "bg-slate-800/50 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer";

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-5 text-center"
            >
              <Icon className={`w-6 h-6 mx-auto mb-2 ${s.color}`} />
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-slate-400 mt-1">{s.label}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Scan Form */}
      <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Start API Discovery Scan</h3>
        <form onSubmit={handleStartScan} className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Target Domain</label>
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Enter target domain or IP"
              required
              className="w-52 px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Scan Type</label>
            <select value={scanType} onChange={(e) => setScanType(e.target.value)} required className={selectClass}>
              <option value="" className="bg-slate-800">Select scan type</option>
              <option value="shallow" className="bg-slate-800">Shallow Scan</option>
              <option value="deep" className="bg-slate-800">Deep Scan</option>
              <option value="comprehensive" className="bg-slate-800">Comprehensive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1.5">Depth</label>
            <select value={depth} onChange={(e) => setDepth(e.target.value)} className={selectClass}>
              <option value="" className="bg-slate-800">Default</option>
              <option value="1" className="bg-slate-800">Level 1</option>
              <option value="2" className="bg-slate-800">Level 2</option>
              <option value="3" className="bg-slate-800">Level 3</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold text-sm transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />}
            Start Scan
          </button>
        </form>
      </div>

      {/* API Table */}
      <div className="bg-slate-800/30 backdrop-blur border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Discovered APIs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {["URL", "Method", "Type", "Status", "Response Time", "Last Seen", "Version", "Auth"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discoveredAPIs.length > 0 ? discoveredAPIs.map((api) => (
                <tr key={api.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <a href={api.url} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 text-sm font-mono">
                      {api.url}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${methodColors[api.method] || "bg-slate-500/15 text-slate-400"}`}>
                      {api.method}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${typeColors[api.type] || "bg-slate-500/15 text-slate-400"}`}>
                      {api.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColors[api.status] || "bg-slate-500/15 text-slate-400"}`}>
                      {api.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{api.responseTime ? `${api.responseTime}ms` : "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{api.lastSeen ? new Date(api.lastSeen).toLocaleDateString() : "N/A"}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{api.version || "Unknown"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${api.authentication ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                      {api.authentication || "None"}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">No APIs discovered yet. Start a scan above.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
