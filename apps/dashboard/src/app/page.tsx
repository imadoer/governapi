"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import {
  ShieldCheckIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
  CheckCircleIcon,
  Bars3Icon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

/* ─────────────────────────────────────────────
   Animated Security Gauge — gradient ring + glow
   ───────────────────────────────────────────── */
function SecurityGauge({ score, animating }: { score: number; animating: boolean }) {
  const r = 58;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const gradId = "gauge-grad";
  const glowColor = score >= 80 ? "rgba(16,185,129,.45)" : score >= 50 ? "rgba(245,158,11,.4)" : "rgba(239,68,68,.4)";

  return (
    <div className="relative w-44 h-44">
      {/* Glow */}
      {animating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-full"
          style={{ boxShadow: `0 0 50px ${glowColor}, 0 0 100px ${glowColor}` }}
        />
      )}
      <svg className="w-44 h-44 -rotate-90" viewBox="0 0 128 128">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="7" />
        {/* Fill */}
        <motion.circle
          cx="64" cy="64" r={r} fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: animating ? offset : circ }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {animating ? (
          <>
            <motion.span
              className="text-4xl font-bold text-white tabular-nums"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {score}
            </motion.span>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">/ 100</span>
          </>
        ) : (
          <span className="text-sm text-slate-600">—</span>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Scan Result Rows
   ───────────────────────────────────────────── */
interface Finding { label: string; status: "pass" | "warn" | "fail" }

function ScanResults({ findings, visible }: { findings: Finding[]; visible: boolean }) {
  if (!visible) return null;
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 space-y-2.5 w-full">
      {findings.map((f, i) => (
        <motion.div
          key={f.label}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 + i * 0.12 }}
          className="flex items-center justify-between text-sm"
        >
          <span className="text-slate-400">{f.label}</span>
          {f.status === "pass" ? (
            <span className="text-emerald-400 flex items-center gap-1 font-medium"><CheckCircleIcon className="w-4 h-4" /> Pass</span>
          ) : f.status === "warn" ? (
            <span className="text-amber-400 flex items-center gap-1 font-medium"><ExclamationTriangleIcon className="w-4 h-4" /> Warn</span>
          ) : (
            <span className="text-red-400 flex items-center gap-1 font-medium"><XMarkIcon className="w-4 h-4" /> Fail</span>
          )}
        </motion.div>
      ))}
    </motion.div>
  );
}

/* ═════════════════════════════════════════════
   PAGE
   ═════════════════════════════════════════════ */
export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [scanUrl, setScanUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanScore, setScanScore] = useState(0);
  const [findings, setFindings] = useState<Finding[]>([]);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  /* ── Real scan via /api/public/scan ── */
  const runScan = useCallback(async () => {
    const raw = scanUrl.trim();
    if (!raw) return;
    // Prepend https:// if missing protocol
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    setScanUrl(url);
    setScanning(true);
    setScanDone(false);
    setFindings([]);

    try {
      const res = await fetch("/api/public/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (data.success) {
        const r = data.results;
        setFindings([
          { label: "HTTPS / TLS", status: r.https ? "pass" : "fail" },
          { label: "Security Headers", status: r.securityHeaders.score >= 60 ? "pass" : r.securityHeaders.score >= 30 ? "warn" : "fail" },
          { label: "CORS Policy", status: r.cors.safe ? "pass" : "warn" },
          { label: "Server Info Leak", status: r.serverInfo.exposed ? "fail" : "pass" },
          { label: "Response Time", status: (r.responseTime ?? 9999) < 500 ? "pass" : (r.responseTime ?? 9999) < 2000 ? "warn" : "fail" },
        ]);
        setScanScore(r.overallScore);
      } else {
        // Endpoint error — give a basic fallback
        setFindings([
          { label: "HTTPS / TLS", status: url.startsWith("https") ? "pass" : "fail" },
          { label: "Reachability", status: "fail" },
        ]);
        setScanScore(url.startsWith("https") ? 25 : 0);
      }
    } catch {
      setFindings([
        { label: "HTTPS / TLS", status: scanUrl.startsWith("https") ? "pass" : "fail" },
        { label: "Reachability", status: "fail" },
      ]);
      setScanScore(scanUrl.startsWith("https") ? 25 : 0);
    } finally {
      setScanning(false);
      setScanDone(true);
    }
  }, [scanUrl]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white selection:bg-cyan-500/30">

      {/* ── CSS Keyframes ── */}
      <style jsx global>{`
        @keyframes border-pulse {
          0%, 100% { border-color: rgba(6,182,212,0.25); box-shadow: 0 0 0 0 rgba(6,182,212,0); }
          50%       { border-color: rgba(6,182,212,0.55); box-shadow: 0 0 18px -4px rgba(6,182,212,0.25); }
        }
        .input-glow { animation: border-pulse 2.5s ease-in-out infinite; }
        .input-glow:focus { animation: none; border-color: rgba(6,182,212,0.7); box-shadow: 0 0 20px -4px rgba(6,182,212,0.35); }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "backdrop-blur-xl bg-[#0a0a0f]/80 border-b border-white/5" : ""}`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <ShieldCheckIcon className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">GovernAPI</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/pricing" className="text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-sm text-slate-400 hover:text-white transition-colors">Docs</Link>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">Login</Link>
            <Link href="/login?mode=register">
              <button className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-lg hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
                Sign Up Free
              </button>
            </Link>
          </nav>

          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2">
            {menuOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 px-6 py-6 space-y-4">
              <Link href="/pricing" className="block text-slate-300 py-2">Pricing</Link>
              <Link href="/docs" className="block text-slate-300 py-2">Docs</Link>
              <Link href="/login" className="block text-slate-300 py-2">Login</Link>
              <Link href="/login?mode=register" className="block">
                <button className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-lg font-semibold">Sign Up Free</button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        {/* ── Background layers ── */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-cyan-500/[0.08] rounded-full blur-[160px]" />
          <div className="absolute bottom-[-5%] left-[15%] w-[500px] h-[500px] bg-emerald-500/[0.06] rounded-full blur-[120px]" />
          <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] bg-violet-500/[0.04] rounded-full blur-[100px]" />
          {/* Dot grid */}
          <div className="absolute inset-0" style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }} />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

            {/* ── Left: Copy + Input ── */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] tracking-tight mb-5">
                Is your API secure?{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                  Find out in 60&nbsp;seconds.
                </span>
              </h1>

              <p className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
                Paste your API URL below for a free security scan. No signup, no credit card.
              </p>

              {/* Input + Button */}
              <div className="flex gap-3 max-w-lg">
                <input
                  type="url"
                  value={scanUrl}
                  onChange={(e) => setScanUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && runScan()}
                  placeholder="https://api.yourcompany.com"
                  className="input-glow flex-1 px-4 py-3.5 bg-white/[0.04] border border-cyan-500/25 rounded-xl text-white placeholder-slate-500 focus:outline-none transition-all text-sm"
                />
                <motion.button
                  onClick={runScan}
                  disabled={scanning || !scanUrl.trim()}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white rounded-xl font-semibold text-sm shadow-[0_0_24px_rgba(6,182,212,0.35)] hover:shadow-[0_0_36px_rgba(6,182,212,0.5)] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 whitespace-nowrap"
                >
                  {scanning ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white rounded-full" />
                      Scanning…
                    </>
                  ) : (
                    <>
                      <MagnifyingGlassIcon className="w-4 h-4" />
                      Scan Now
                    </>
                  )}
                </motion.button>
              </div>

              <p className="text-xs text-slate-600 mt-3.5">
                Checks HTTPS, security headers, CORS, server info leaks, and response time.
              </p>
            </motion.div>

            {/* ── Right: Gauge Card ── */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-sm backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 shadow-[0_8px_60px_rgba(0,0,0,0.5)]">
                <div className="flex flex-col items-center">
                  <SecurityGauge score={scanScore} animating={scanDone} />

                  <div className="mt-5 text-center">
                    {scanning ? (
                      <span className="flex items-center gap-2 text-cyan-400 text-sm"><ClockIcon className="w-4 h-4 animate-pulse" /> Scanning endpoint…</span>
                    ) : scanDone ? (
                      <span className={`text-sm font-semibold ${scanScore >= 80 ? "text-emerald-400" : scanScore >= 50 ? "text-amber-400" : "text-red-400"}`}>
                        {scanScore >= 80 ? "Looking good" : scanScore >= 50 ? "Needs attention" : "Critical issues found"}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-600">Enter a URL to start</span>
                    )}
                  </div>

                  <ScanResults findings={findings} visible={scanDone} />

                  {scanDone && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="mt-7 w-full">
                      <Link href="/login?mode=register">
                        <button className="w-full py-2.5 text-sm font-medium border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/10 transition-all">
                          Sign up for daily monitoring →
                        </button>
                      </Link>
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section className="py-28 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">How it works</h2>
            <p className="text-slate-400">Three steps to a more secure API.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: MagnifyingGlassIcon,
                title: "Instant Scanning",
                desc: "Run a security scan on any public API endpoint in seconds. We check headers, TLS, CORS, and common misconfigurations.",
                gradient: "from-cyan-500/20 to-cyan-500/5",
                border: "hover:border-cyan-500/30",
                iconBg: "bg-cyan-500/10",
                iconColor: "text-cyan-400",
              },
              {
                icon: BoltIcon,
                title: "Daily Monitoring",
                desc: "We re-scan your endpoints every day and alert you if anything changes — a new vulnerability, an expired cert, a misconfigured header.",
                gradient: "from-emerald-500/20 to-emerald-500/5",
                border: "hover:border-emerald-500/30",
                iconBg: "bg-emerald-500/10",
                iconColor: "text-emerald-400",
              },
              {
                icon: WrenchScrewdriverIcon,
                title: "Fix Suggestions",
                desc: "Every finding comes with a clear, actionable fix. Copy-paste header configs, code snippets, and deployment tips.",
                gradient: "from-violet-500/20 to-violet-500/5",
                border: "hover:border-violet-500/30",
                iconBg: "bg-violet-500/10",
                iconColor: "text-violet-400",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className={`relative overflow-hidden backdrop-blur-lg bg-white/[0.03] border border-white/[0.06] rounded-2xl p-7 ${f.border} transition-colors group`}
                >
                  {/* Subtle gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-b ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${f.iconBg}`}>
                      <Icon className={`w-5 h-5 ${f.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-3">Simple pricing</h2>
            <p className="text-slate-400">Start free. Upgrade when you need more.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: "Free Scan",
                price: "$0",
                period: "",
                desc: "One-time security check",
                features: ["1 endpoint scan", "5 security checks", "Instant results", "No account required"],
                cta: "Scan Now",
                href: "#",
                scroll: true,
                popular: false,
              },
              {
                name: "Starter",
                price: "$29",
                period: "/mo",
                desc: "For solo developers & small APIs",
                features: ["10 endpoints", "Daily monitoring", "Email alerts", "Fix suggestions", "7-day history"],
                cta: "Start Free Trial",
                href: "/login?mode=register&plan=starter",
                popular: true,
              },
              {
                name: "Growth",
                price: "$79",
                period: "/mo",
                desc: "For teams shipping fast",
                features: ["100 endpoints", "Hourly monitoring", "Slack + email alerts", "Team dashboard", "90-day history", "Priority support"],
                cta: "Start Free Trial",
                href: "/login?mode=register&plan=growth",
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-7 flex flex-col ${
                  plan.popular
                    ? "bg-gradient-to-b from-cyan-500/[0.08] to-transparent border-2 border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.12)]"
                    : "bg-white/[0.02] border border-white/[0.06]"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white text-xs font-semibold rounded-full shadow-lg">
                    POPULAR
                  </span>
                )}

                <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                <p className="text-xs text-slate-500 mb-4">{plan.desc}</p>

                <div className="mb-5">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-slate-500 text-sm">{plan.period}</span>}
                </div>

                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300">
                      <CheckCircleIcon className="w-4 h-4 text-cyan-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.scroll ? (
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    className="w-full py-2.5 rounded-lg text-sm font-medium bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08] transition-colors"
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link href={plan.href}>
                    <button className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all ${
                      plan.popular
                        ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_28px_rgba(6,182,212,0.45)]"
                        : "bg-white/[0.05] border border-white/10 text-white hover:bg-white/[0.08]"
                    }`}>
                      {plan.cta}
                    </button>
                  </Link>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-cyan-500 to-emerald-500 rounded-md flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">GovernAPI</span>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
            <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          </div>

          <p className="text-xs text-slate-600">© 2025 GovernAPI</p>
        </div>
      </footer>
    </div>
  );
}
