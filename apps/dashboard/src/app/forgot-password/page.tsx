"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheckIcon,
  EnvelopeIcon,
  ArrowLeftIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || "Failed to send reset email");
      }
    } catch {
      setError("Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-cyan-500/[0.06] rounded-full blur-[160px]" />
        <div className="absolute inset-0" style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
      </div>

      <Link href="/login" className="absolute top-6 left-6 z-10 flex items-center gap-2 text-sm text-slate-500 hover:text-white transition-colors">
        <ArrowLeftIcon className="w-4 h-4" /> Back to Login
      </Link>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 shadow-[0_8px_60px_rgba(0,0,0,0.5)]">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-xl mb-4 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              <ShieldCheckIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">Reset Password</h1>
            <p className="text-sm text-slate-500">
              {success ? "Check your email for reset instructions" : "Enter your email to receive a reset link"}
            </p>
          </div>

          {success ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-emerald-400 font-medium text-sm mb-1">Email sent!</p>
                  <p className="text-slate-400 text-xs">
                    We sent reset instructions to <strong className="text-white">{email}</strong>. Check your inbox and spam folder.
                  </p>
                </div>
              </div>
              <Link href="/login">
                <button className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all text-sm">
                  Return to Login
                </button>
              </Link>
            </motion.div>
          ) : (
            <>
              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2">
                  <ExclamationCircleIcon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-red-400 text-sm">{error}</span>
                </motion.div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email Address</label>
                  <div className="relative">
                    <EnvelopeIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com"
                      className="w-full pl-11 pr-4 py-3 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all text-sm" />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.45)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2">
                  {loading && <div className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />}
                  {loading ? "Sending…" : "Send Reset Link"}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
