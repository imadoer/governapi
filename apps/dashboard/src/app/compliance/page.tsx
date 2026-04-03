"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  DocumentDuplicateIcon,
} from "@heroicons/react/24/outline"

export default function CompliancePage() {
  const [exporting, setExporting] = useState(false)

  const handleExportPDF = () => {
    setExporting(true)
    setTimeout(() => {
      alert(
        "PDF export feature coming soon. This would generate a comprehensive compliance summary report."
      )
      setExporting(false)
    }, 1000)
  }

  const frameworks = [
    {
      icon: ShieldCheckIcon,
      name: "Compliance Tracking",
      status: "Available",
      progress: 92,
      description:
        "Track your compliance posture against 30+ industry frameworks",
      details: [
        "SOC 2, ISO 27001, NIST CSF, CIS Controls",
        "GDPR, CCPA, PIPEDA, LGPD (privacy frameworks)",
        "HIPAA, HITECH, FDA 21 CFR Part 11 (healthcare)",
        "PCI DSS, GLBA, FFIEC (financial services)",
        "FedRAMP, FISMA, NIST 800-53 (government)",
      ],
      note: "GovernAPI tracks your compliance status against these frameworks. GovernAPI itself is not formally certified or audited against these standards. Compliance dashboards show your assessed posture based on monitored controls.",
    },
    {
      icon: GlobeAltIcon,
      name: "Data Handling",
      status: "Documented",
      progress: 100,
      description: "How GovernAPI handles your data",
      details: [
        "Passwords hashed with bcrypt (12 salt rounds)",
        "API keys hashed with SHA-256 before storage",
        "Session tokens with configurable expiration",
        "Data export available in JSON format",
        "Account deletion available on request",
      ],
      note: "We store account data, API metadata, threat events, and compliance assessment results. We do not currently store or process payment card data directly (handled by Stripe).",
    },
    {
      icon: ExclamationTriangleIcon,
      name: "Threat Detection",
      status: "Active",
      progress: 88,
      description: "Built-in security monitoring capabilities",
      details: [
        "SQL injection and XSS pattern detection",
        "Brute force and credential stuffing detection",
        "Bot detection with headless browser fingerprinting",
        "Behavioral anomaly detection with baseline analysis",
        "IP blocking with configurable duration and audit trail",
        "Rate limiting per endpoint and per key",
      ],
      note: "Threat detection uses pattern matching and behavioral analysis. It is not a replacement for a dedicated WAF, penetration testing, or external vulnerability scanner.",
    },
  ]

  const statusColors: Record<string, string> = {
    Available: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
    Documented: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5",
    Active: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
  }

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
      <div className="pointer-events-none fixed top-0 right-1/4 w-[800px] h-[500px] bg-gradient-to-bl from-emerald-500/8 via-cyan-500/5 to-transparent rounded-full blur-3xl z-0" />

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
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center">
              <DocumentTextIcon className="w-7 h-7 text-black" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                Compliance
              </h1>
              <p className="text-white/40 mt-1">
                Industry standards and regulatory alignment
              </p>
            </div>
          </div>

          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-black rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            {exporting ? "Exporting..." : "Export Compliance Summary (PDF)"}
          </button>
        </motion.div>
      </div>

      {/* Framework Cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 space-y-8">
        {frameworks.map((framework, index) => (
          <motion.div
            key={framework.name}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + index * 0.12, duration: 0.5 }}
            className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden hover:border-white/[0.12] transition-all duration-300"
          >
            {/* Card header */}
            <div className="p-8 border-b border-white/[0.05]">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <framework.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-1">
                      {framework.name}
                    </h2>
                    <p className="text-white/40 text-sm">
                      {framework.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-shrink-0">
                  {/* Progress indicator */}
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${framework.progress}%` }}
                        transition={{ delay: 0.4 + index * 0.12, duration: 0.8, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                      />
                    </div>
                    <span className="text-white/50 text-sm font-mono">
                      {framework.progress}%
                    </span>
                  </div>

                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${statusColors[framework.status]}`}>
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                    {framework.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="p-8">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">
                Controls & Requirements
              </h3>
              <ul className="space-y-3 mb-6">
                {framework.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400/60 flex-shrink-0 mt-0.5" />
                    <span className="text-white/50 text-sm">{detail}</span>
                  </li>
                ))}
              </ul>

              <div className="flex items-start gap-3 p-4 bg-cyan-500/[0.03] border border-cyan-500/10 rounded-xl">
                <InformationCircleIcon className="w-5 h-5 text-cyan-400/60 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-white/35 leading-relaxed">
                  <strong className="text-cyan-400/70">Note:</strong>{" "}
                  {framework.note}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Info Cards */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <DocumentDuplicateIcon className="w-6 h-6 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">
                Audit Reports
              </h3>
            </div>
            <p className="text-white/35 text-sm mb-5 leading-relaxed">
              Enterprise customers can request detailed compliance documentation
              and audit reports.
            </p>
            <a
              href="mailto:compliance@governapi.com"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
            >
              <EnvelopeIcon className="w-4 h-4" />
              Request Audit Documentation
            </a>
          </div>

          <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 hover:border-white/[0.12] transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <DocumentTextIcon className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">
                Data Processing Agreements
              </h3>
            </div>
            <p className="text-white/35 text-sm mb-5 leading-relaxed">
              Need a DPA or BAA for your organization? We provide customized
              agreements for enterprise customers.
            </p>
            <a
              href="mailto:legal@governapi.com"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
            >
              <EnvelopeIcon className="w-4 h-4" />
              Request Legal Documentation
            </a>
          </div>
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
