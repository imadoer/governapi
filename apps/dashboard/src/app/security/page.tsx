"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  ShieldCheckIcon,
  LockClosedIcon,
  ServerIcon,
  BellAlertIcon,
  KeyIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline"

export default function SecurityPage() {
  const sections = [
    {
      icon: LockClosedIcon,
      title: "Data Protection",
      items: [
        "API keys hashed with SHA-256 before storage",
        "Passwords hashed with bcrypt (12 salt rounds)",
        "TLS encryption for data in transit",
        "Parameterized queries to prevent SQL injection",
        "Session tokens with configurable expiration",
      ],
    },
    {
      icon: KeyIcon,
      title: "Access Control",
      items: [
        "Role-Based Access Control (admin, user, viewer)",
        "Cookie-based admin session authentication",
        "API key scoping with granular permissions",
        "IP whitelisting per API key",
        "API key rotation with audit trail",
      ],
    },
    {
      icon: BellAlertIcon,
      title: "Threat Detection",
      items: [
        "Real-time SQL injection and XSS pattern detection",
        "Brute force detection via failed auth tracking",
        "Bot detection (user agent, headless browser, velocity)",
        "Behavioral anomaly detection with baseline deviation",
        "IP blocking with configurable duration",
      ],
    },
    {
      icon: ServerIcon,
      title: "Platform Security",
      items: [
        "Security headers (X-Content-Type-Options, X-Frame-Options, XSS-Protection)",
        "CORS configuration",
        "Request size validation (10MB limit)",
        "Rate limiting on API endpoints",
        "Request logging and audit trail",
      ],
    },
    {
      icon: ShieldCheckIcon,
      title: "Compliance Tracking",
      items: [
        "Support for 30+ compliance frameworks (SOC 2, HIPAA, PCI DSS, GDPR, etc.)",
        "Compliance control tracking and evidence management",
        "Automated compliance scoring for monitored controls",
        "Audit readiness reporting",
        "Policy violation detection and remediation tracking",
      ],
    },
  ]

  return (
    <div className="relative min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Dot grid background */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Gradient glow */}
      <div className="pointer-events-none fixed top-0 left-1/3 w-[800px] h-[500px] bg-gradient-to-br from-cyan-500/8 via-emerald-500/5 to-transparent rounded-full blur-3xl z-0" />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/[0.07] backdrop-blur-xl bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            GovernAPI
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link href="/pricing" className="text-white/50 hover:text-white transition-colors">Pricing</Link>
            <Link href="/docs" className="text-white/50 hover:text-white transition-colors">Docs</Link>
            <Link href="/customer/login" className="text-white/50 hover:text-white transition-colors">Login</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        >
          <div>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
                <ShieldCheckIcon className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  Security
                </h1>
                <p className="text-white/40 mt-1">
                  Enterprise-grade security practices and infrastructure
                </p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 text-sm font-medium">
              <CheckBadgeIcon className="w-4 h-4" />
              30+ Compliance Frameworks Tracked
            </span>
          </div>
        </motion.div>
      </div>

      {/* Timeline-style security cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        {/* Vertical timeline line */}
        <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-500/20 via-emerald-500/10 to-transparent" />

        <div className="space-y-8 md:space-y-0">
          {sections.map((section, index) => {
            const isLeft = index % 2 === 0
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.1, duration: 0.5 }}
                className={`relative md:flex ${isLeft ? "md:justify-start" : "md:justify-end"} md:py-4`}
              >
                {/* Timeline dot */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 z-10 ring-4 ring-[#0a0a0f]" />

                <div className={`md:w-[46%] backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 hover:border-cyan-500/20 hover:bg-white/[0.05] transition-all duration-300 group`}>
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0 group-hover:from-cyan-500/20 group-hover:to-emerald-500/20 transition-all">
                      <section.icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white pt-2">
                      {section.title}
                    </h3>
                  </div>

                  <ul className="space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 mt-2 flex-shrink-0" />
                        <span className="text-white/45 text-sm leading-relaxed">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Security Disclosure */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8"
        >
          <p className="text-white/35 text-sm leading-relaxed">
            <strong className="text-white/70">Security Disclosure:</strong>{" "}
            GovernAPI helps you track compliance against industry frameworks
            including SOC 2, ISO 27001, GDPR, HIPAA, and PCI DSS. GovernAPI
            itself is not formally certified against these frameworks. For
            security concerns or vulnerability reports, contact{" "}
            <a
              href="mailto:security@governapi.com"
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              security@governapi.com
            </a>
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-white/20 text-sm">
            &copy; 2025 GovernAPI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
