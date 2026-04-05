"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlobeAltIcon, MagnifyingGlassIcon, PlusIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import { PageSkeleton } from "./PageSkeleton";

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-slate-800/50 border border-white/[0.06] rounded-2xl ${className}`}>{children}</div>;
}

export default function ApiDiscoveryPage({ companyId }: { companyId: string }) {
  const [domain, setDomain] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);
  const [addingPaths, setAddingPaths] = useState<Set<string>>(new Set());

  const flash = (text: string, ok = true) => { setToast({ text, ok }); setTimeout(() => setToast(null), 2500); };

  const runDiscovery = async () => {
    if (!domain.trim()) return;
    setScanning(true);
    setResults(null);
    try {
      const res = await fetch("/api/customer/api-discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ domain: domain.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data);
      } else {
        flash(data.error || "Discovery failed", false);
      }
    } catch {
      flash("Discovery failed", false);
    }
    setScanning(false);
  };

  const addToMonitoring = async (endpoint: any) => {
    setAddingPaths((s) => new Set(s).add(endpoint.path));
    try {
      const res = await fetch("/api/customer/api-discovery", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-tenant-id": companyId },
        body: JSON.stringify({ endpoints: [{ ...endpoint, domain: results?.domain, fullUrl: `https://${results?.domain}${endpoint.path}` }] }),
      });
      const data = await res.json();
      if (data.success) flash(`Added ${endpoint.path} to monitoring`);
      else flash("Failed to add", false);
    } catch { flash("Failed to add", false); }
  };

  const riskIcon = (risk: string) => {
    if (risk === "exposed") return "🔴";
    if (risk === "public") return "🟡";
    if (risk === "redirect") return "↗️";
    if (risk === "rate_limited") return "⏳";
    return "🟢";
  };

  const riskLabel = (risk: string) => {
    if (risk === "exposed") return "Exposed";
    if (risk === "public") return "Public";
    if (risk === "redirect") return "Redirect";
    if (risk === "rate_limited") return "Rate Limited";
    return "Protected";
  };

  const riskColor = (risk: string) => {
    if (risk === "exposed") return "text-red-400";
    if (risk === "public") return "text-amber-400";
    if (risk === "redirect") return "text-gray-500";
    if (risk === "rate_limited") return "text-gray-600";
    return "text-emerald-400";
  };

  return (
    <div>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className={`fixed top-5 right-5 z-[200] px-4 py-2 rounded-lg text-[13px] font-medium shadow-xl border border-white/[0.06] ${toast.ok ? "bg-emerald-600/90 text-white" : "bg-red-600/90 text-white"}`}>
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-white tracking-tight">API Discovery</h1>
        <p className="text-sm text-gray-500 mt-1">Find all API endpoints on your domain — including ones you didn&apos;t know were public</p>
      </div>

      {/* Domain input */}
      <Card className="p-6 mb-8">
        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text" value={domain}
              onChange={(e) => setDomain(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runDiscovery()}
              placeholder="yourcompany.com"
              className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-lg text-[14px] text-white placeholder-gray-600 focus:outline-none focus:border-white/[0.12] transition-colors"
            />
            <p className="text-[11px] text-gray-600 mt-1.5">We&apos;ll probe {PROBE_COUNT} common paths for APIs, admin panels, exposed files, and debug endpoints</p>
          </div>
          <button onClick={runDiscovery} disabled={scanning || !domain.trim()}
            className="px-5 py-2.5 rounded-lg text-[13px] font-medium bg-white text-black hover:bg-gray-200 transition-colors disabled:opacity-40 flex items-center gap-2 shrink-0 h-fit">
            {scanning ? (
              <><div className="animate-spin w-4 h-4 border-2 border-black/30 border-t-black rounded-full" /> Scanning...</>
            ) : (
              <><MagnifyingGlassIcon className="w-4 h-4" /> Discover APIs</>
            )}
          </button>
        </div>
      </Card>

      {/* Scanning animation */}
      {scanning && (
        <div className="space-y-3 mb-8">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse bg-slate-700/20 rounded-xl h-12" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
          <p className="text-[12px] text-gray-600 text-center">Probing endpoints... this takes about 20 seconds</p>
        </div>
      )}

      {/* Results */}
      {results && !scanning && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Verdict */}
          {results.verdict && (
            <div className={`p-4 rounded-xl mb-6 text-[13px] ${
              results.criticalFindings > 0 ? "bg-red-500/[0.06] border border-red-500/15 text-red-300" : "bg-emerald-500/[0.06] border border-emerald-500/15 text-emerald-300"
            }`}>
              {results.verdict}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-5">
              <div className="text-[12px] text-gray-500 mb-2">Endpoints Found</div>
              <div className="text-2xl font-semibold text-white">{results.endpointsFound}</div>
            </Card>
            <Card className="p-5">
              <div className="text-[12px] text-gray-500 mb-2">Critical</div>
              <div className="text-2xl font-semibold text-red-400">{results.criticalFindings}</div>
            </Card>
            <Card className="p-5">
              <div className="text-[12px] text-gray-500 mb-2">Protected</div>
              <div className="text-2xl font-semibold text-emerald-400">{results.protectedEndpoints}</div>
            </Card>
            <Card className="p-5">
              <div className="text-[12px] text-gray-500 mb-2">Paths Probed</div>
              <div className="text-2xl font-semibold text-white">{results.totalProbed}</div>
            </Card>
          </div>

          {/* Critical alert */}
          {results.criticalFindings > 0 && (
            <Card className="p-5 mb-6 border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <ShieldExclamationIcon className="w-5 h-5 text-red-400" />
                <h3 className="text-[14px] font-medium text-red-400">Critical: Exposed Endpoints</h3>
              </div>
              <div className="space-y-1">
                {results.endpoints.filter((e: any) => e.risk === "exposed").map((e: any) => (
                  <div key={e.path} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-red-500/[0.05] border border-red-500/10">
                    <span className="font-mono text-[13px] text-red-400">{e.path}</span>
                    <span className="text-[11px] text-gray-500">HTTP {e.status}</span>
                    {e.findings?.map((f: string) => (
                      <span key={f} className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">{f}</span>
                    ))}
                    {e.responseTime && <span className="text-[10px] text-gray-600">{e.responseTime}ms</span>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All endpoints */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.04]">
              <h3 className="text-[13px] font-medium text-white">All Discovered Endpoints</h3>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {results.endpoints.map((ep: any) => (
                <div key={ep.path} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[14px] shrink-0">{riskIcon(ep.risk)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[13px] text-white">{ep.path}</span>
                        <span className="text-[10px] text-gray-600">HTTP {ep.status}</span>
                        {ep.contentType && <span className="text-[10px] text-gray-700">{ep.contentType}</span>}
                        {ep.responseTime && <span className="text-[10px] text-gray-700">{ep.responseTime}ms</span>}
                        {ep.size != null && <span className="text-[10px] text-gray-700">{ep.size > 1024 ? `${Math.round(ep.size/1024)}KB` : `${ep.size}B`}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className={`text-[11px] font-medium ${riskColor(ep.risk)}`}>{riskLabel(ep.risk)}</span>
                        {ep.redirectsTo && <span className="text-[10px] text-gray-600">→ {ep.redirectsTo.substring(0, 50)}</span>}
                        {ep.notableHeaders?.map((h: string) => (
                          <span key={h} className="text-[10px] text-gray-600">{h}</span>
                        ))}
                        {ep.findings?.map((f: string) => (
                          <span key={f} className="text-[10px] bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded">{f}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => addToMonitoring(ep)}
                    disabled={addingPaths.has(ep.path)}
                    className="shrink-0 ml-2 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white/5 text-gray-400 border border-white/[0.06] hover:bg-white/10 hover:text-white transition-colors disabled:opacity-40"
                  >
                    {addingPaths.has(ep.path) ? "Added" : "+ Monitor"}
                  </button>
                </div>
              ))}
              {results.endpoints.length === 0 && (
                <div className="px-5 py-12 text-center text-gray-600 text-[13px]">
                  No endpoints found. The domain may not have public APIs.
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Empty state */}
      {!results && !scanning && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <GlobeAltIcon className="w-10 h-10 text-gray-700 mb-4" />
          <p className="text-[15px] text-gray-400 mb-1">Enter a domain to discover API endpoints</p>
          <p className="text-[13px] text-gray-600">We&apos;ll find APIs, admin panels, exposed files, and more</p>
        </div>
      )}
    </div>
  );
}

const PROBE_COUNT = 120;
