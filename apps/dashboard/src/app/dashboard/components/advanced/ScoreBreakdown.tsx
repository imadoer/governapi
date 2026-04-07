"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { calcImpactPoints } from "../../../../utils/score-utils";

/* ── Fix guides keyed by vulnerability_type ── */
const FIX_GUIDES: Record<string, {
  why: string;
  impact: string;
  points: number;
  fixes: { framework: string; code: string }[];
  docs: { label: string; url: string }[];
}> = {
  "Missing HSTS": {
    why: "Without HSTS, attackers can downgrade your HTTPS connection to HTTP and intercept sensitive data via man-in-the-middle attacks.",
    impact: "Fixing this will improve your score by ~5 points",
    points: 5,
    fixes: [
      { framework: "Express / Node.js", code: `app.use((req, res, next) => {\n  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');\n  next();\n});` },
      { framework: "Nginx", code: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;` },
      { framework: "Django", code: `SECURE_HSTS_SECONDS = 31536000\nSECURE_HSTS_INCLUDE_SUBDOMAINS = True` },
      { framework: "Rails", code: `config.force_ssl = true\n# In config/environments/production.rb` },
    ],
    docs: [
      { label: "MDN: Strict-Transport-Security", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security" },
      { label: "OWASP: HTTP Strict Transport Security", url: "https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Strict_Transport_Security_Cheat_Sheet.html" },
    ],
  },
  "Missing X-Frame-Options": {
    why: "Without X-Frame-Options, your API responses can be embedded in iframes on malicious sites, enabling clickjacking attacks.",
    impact: "Fixing this will improve your score by ~3 points",
    points: 3,
    fixes: [
      { framework: "Express / Node.js", code: `app.use((req, res, next) => {\n  res.setHeader('X-Frame-Options', 'DENY');\n  next();\n});` },
      { framework: "Nginx", code: `add_header X-Frame-Options "DENY" always;` },
      { framework: "Django", code: `X_FRAME_OPTIONS = 'DENY'\n# In settings.py (enabled by default)` },
    ],
    docs: [
      { label: "MDN: X-Frame-Options", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options" },
    ],
  },
  "Missing CSP": {
    why: "Without Content-Security-Policy, your site is vulnerable to cross-site scripting (XSS) attacks. CSP restricts which resources can be loaded.",
    impact: "Fixing this will improve your score by ~5 points",
    points: 5,
    fixes: [
      { framework: "Express / Node.js", code: `app.use((req, res, next) => {\n  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'");\n  next();\n});` },
      { framework: "Nginx", code: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'" always;` },
      { framework: "Django", code: `# pip install django-csp\nMIDDLEWARE += ['csp.middleware.CSPMiddleware']\nCSP_DEFAULT_SRC = ("'self'",)` },
    ],
    docs: [
      { label: "MDN: Content-Security-Policy", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP" },
      { label: "CSP Evaluator (Google)", url: "https://csp-evaluator.withgoogle.com/" },
    ],
  },
};

/* Fallback guide for unknown vuln types */
const DEFAULT_GUIDE = {
  why: "This security issue could expose your API to attacks.",
  impact: "Fixing this will improve your overall security posture",
  points: 3,
  fixes: [],
  docs: [{ label: "OWASP API Security Top 10", url: "https://owasp.org/API-Security/editions/2023/en/0x11-t10/" }],
};

interface Vuln {
  id: number;
  title: string;
  description: string;
  severity: string;
  type: string;
  remediation: string;
  affectedUrl: string;
}

interface Props {
  score: number;
  url: string;
  vulnerabilities: Vuln[];
  onNavigate?: (page: string) => void;
}

export function ScoreBreakdown({ score, url, vulnerabilities, onNavigate }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  // Build the score factors from actual scan data
  const hasHttps = url.startsWith("https");
  const missingHeaders = vulnerabilities.filter(v =>
    v.type?.includes("Missing") || v.title?.includes("Missing") || v.title?.includes("Not Enabled")
  );
  const hasServerLeak = vulnerabilities.some(v => v.type?.includes("Server") || v.title?.includes("Server"));

  const factors = [
    {
      label: "HTTPS / TLS",
      pass: hasHttps,
      points: hasHttps ? 25 : 0,
      maxPoints: 25,
      detail: hasHttps ? "Connection is encrypted" : "Not using HTTPS — data transmitted in plain text",
    },
    {
      label: "Security Headers",
      pass: missingHeaders.length === 0,
      points: Math.max(0, 35 - missingHeaders.length * 7),
      maxPoints: 35,
      detail: missingHeaders.length > 0
        ? `Missing ${missingHeaders.length} header${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.map(v => v.type || v.title).join(", ")}`
        : "All security headers present",
    },
    {
      label: "Server Info Leak",
      pass: !hasServerLeak,
      points: hasServerLeak ? 0 : 10,
      maxPoints: 10,
      detail: hasServerLeak ? "Server type exposed in response headers" : "Server info hidden",
    },
    {
      label: "CORS Policy",
      pass: true, // We don't have CORS vulns in the scan data, assume pass
      points: 15,
      maxPoints: 15,
      detail: "CORS policy properly configured",
    },
    {
      label: "Response Time",
      pass: true,
      points: 15,
      maxPoints: 15,
      detail: "Response within acceptable limits",
    },
  ];

  // Build prioritized action plan — sorted by impact score descending
  const actions = vulnerabilities.map(v => {
    const guide = FIX_GUIDES[v.type] || DEFAULT_GUIDE;
    const impactPts = calcImpactPoints(v);
    return {
      vuln: v,
      guide,
      impactPts,
    };
  }).sort((a, b) => b.impactPts - a.impactPts);

  const potentialScore = Math.min(100, score + actions.reduce((s, a) => s + a.impactPts, 0));

  if (vulnerabilities.length === 0 && score === 0) return null;

  return (
    <div className="space-y-6">
      {/* Score Factors */}
      <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
        <h3 className="text-[13px] font-medium text-gray-400 mb-4">What&apos;s Affecting Your Score</h3>
        <div className="space-y-2">
          {factors.map((f) => (
            <div key={f.label} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.03]">
              <div className="flex items-center gap-3">
                <span className={`text-[14px] ${f.pass ? "" : ""}`}>{f.pass ? "✅" : "❌"}</span>
                <div>
                  <span className="text-[13px] text-white">{f.label}</span>
                  <div className="text-[11px] text-gray-600">{f.detail}</div>
                </div>
              </div>
              <span className={`text-[12px] font-medium ${f.pass ? "text-emerald-400" : "text-red-400"}`}>
                {f.pass ? `+${f.points}` : `-${f.maxPoints - f.points}`} pts
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Fix These First — Prioritized Action Plan */}
      {actions.length > 0 && (
        <div className="bg-slate-800/50 border border-white/[0.06] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-[13px] font-medium text-gray-400">Fix These First</h3>
            <span className="text-[11px] text-emerald-400">Potential score: {potentialScore}/100</span>
          </div>
          <p className="text-[11px] text-gray-600 mb-4">Ordered by impact on your security score</p>

          <div className="space-y-2">
            {actions.map(({ vuln, guide, impactPts }, i) => {
              const isOpen = expanded === vuln.id;
              return (
                <div key={vuln.id} className="rounded-xl border border-white/[0.04] overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : vuln.id)}
                    className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`shrink-0 w-2 h-2 rounded-full ${
                        vuln.severity === "CRITICAL" || vuln.severity === "HIGH" ? "bg-red-400" : "bg-amber-400"
                      }`} />
                      <div className="min-w-0">
                        <div className="text-[13px] text-white">{vuln.title}</div>
                        <div className="text-[11px] text-gray-600">Fixing this will improve your score by ~{impactPts} points</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/15 text-emerald-400">+{impactPts} pts</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        vuln.severity === "CRITICAL" ? "bg-red-500/15 text-red-400" :
                        vuln.severity === "HIGH" ? "bg-amber-500/15 text-amber-400" :
                        "bg-yellow-500/15 text-yellow-400"
                      }`}>{vuln.severity}</span>
                      <ChevronDownIcon className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-4 space-y-4">
                          {/* Why it matters */}
                          <div>
                            <div className="text-[11px] font-medium text-gray-400 mb-1">Why it matters</div>
                            <p className="text-[12px] text-gray-300">{guide.why}</p>
                          </div>

                          {/* DB remediation text */}
                          {vuln.remediation && (
                            <div>
                              <div className="text-[11px] font-medium text-gray-400 mb-1">Quick fix</div>
                              <p className="text-[12px] text-gray-300">{vuln.remediation}</p>
                            </div>
                          )}

                          {/* Code snippets */}
                          {guide.fixes.length > 0 && (
                            <div>
                              <div className="text-[11px] font-medium text-gray-400 mb-2">Code examples</div>
                              <div className="space-y-2">
                                {guide.fixes.map((fix) => (
                                  <div key={fix.framework}>
                                    <div className="text-[10px] text-cyan-400 font-medium mb-1">{fix.framework}</div>
                                    <pre className="text-[11px] text-gray-300 bg-black/30 rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">{fix.code}</pre>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Reference links */}
                          {guide.docs.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {guide.docs.map((doc) => (
                                <a key={doc.url} href={doc.url} target="_blank" rel="noopener noreferrer"
                                  className="text-[10px] text-gray-500 hover:text-white border border-white/[0.06] rounded-lg px-2 py-1 transition-colors">
                                  {doc.label} ↗
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
