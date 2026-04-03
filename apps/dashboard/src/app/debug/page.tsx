"use client";

import React, { useState } from "react";
import { KeyIcon } from "@heroicons/react/24/outline";

export default function DebugLogin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [apiKey, setApiKey] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/customer/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login_with_key",
          apiKey,
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult("Error: " + (error as Error)?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-8">
      <h2 className="text-2xl font-bold text-white mb-6">Customer Auth Debug</h2>

      <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-6">
        <form onSubmit={handleLogin} className="flex items-end gap-4">
          <div className="flex-1 max-w-md">
            <label className="block text-sm font-medium text-slate-300 mb-2">API Key</label>
            <div className="relative">
              <KeyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="gapi_hx6zmpncm6j"
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            )}
            Test Login API
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">API Response</h3>
          <pre className="bg-slate-900/50 rounded-xl p-4 text-sm text-cyan-400 font-mono overflow-auto max-h-96">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}
