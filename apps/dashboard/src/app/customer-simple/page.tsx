"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { KeyIcon, UserIcon } from "@heroicons/react/24/outline";

export default function SimpleCustomerPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    setLoading(true);
    setError("");
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

      if (data.success) {
        setCustomer(data.tenant);
        setIsLoggedIn(true);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-6">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-[120px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-violet-500 rounded-2xl flex items-center justify-center">
                <KeyIcon className="w-10 h-10 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-white text-center mb-2">GovernAPI Login</h1>
            <p className="text-slate-400 text-center mb-8">Enter your API key to access your dashboard</p>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
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
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                )}
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="border-b border-white/10 backdrop-blur-xl bg-black/20">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
            GovernAPI Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">
              Welcome, <span className="text-white">{customer?.name}</span>
            </span>
            <button
              onClick={() => setIsLoggedIn(false)}
              className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-xl text-sm hover:bg-white/10 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Customer Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Name</p>
              <p className="text-white font-medium">{customer?.name}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-white font-medium">{customer?.email}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">API Key</p>
              <p className="text-cyan-400 font-mono text-sm break-all">{customer?.apiKey}</p>
            </div>
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Customer ID</p>
              <p className="text-white font-medium">{customer?.id}</p>
            </div>
          </div>
          <a
            href="/customer"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
          >
            Go to Full Dashboard
          </a>
        </motion.div>
      </div>
    </div>
  );
}
