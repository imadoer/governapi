"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  ShieldCheckIcon,
  BoltIcon,
  EyeIcon,
  DocumentCheckIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline"

const whyItems = [
  { icon: BoltIcon, text: "Deploy in minutes, not weeks" },
  { icon: SparklesIcon, text: "AI-powered threat detection" },
  { icon: EyeIcon, text: "Real-time security monitoring" },
  { icon: DocumentCheckIcon, text: "Automated compliance reporting" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white relative overflow-hidden">
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 border-b border-white/[0.07] backdrop-blur-xl bg-white/[0.03]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
            GovernAPI
          </Link>
          <div className="flex gap-6">
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">Pricing</Link>
            <Link href="/docs" className="text-slate-300 hover:text-white transition">Docs</Link>
            <Link href="/login" className="text-slate-300 hover:text-white transition">Login</Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
              <ShieldCheckIcon className="w-4 h-4" />
              About Us
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                GovernAPI
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              GovernAPI provides enterprise-grade API security and governance for modern development teams.
            </p>
          </div>

          {/* Mission */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-10 mb-12"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-emerald-500/20">
                <ShieldCheckIcon className="w-6 h-6 text-cyan-400" />
              </div>
              <h2 className="text-3xl font-bold">Our Mission</h2>
            </div>
            <p className="text-lg text-slate-300 leading-relaxed">
              We believe every company deserves enterprise-grade API security without enterprise complexity.
              Our mission is to make API governance accessible, automated, and actionable.
            </p>
          </motion.div>

          {/* Why GovernAPI */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-3xl font-bold mb-8 text-center">
              Why{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                GovernAPI?
              </span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {whyItems.map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                  className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex items-center gap-4 hover:border-cyan-500/30 transition-colors"
                >
                  <div className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 shrink-0">
                    <item.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span className="text-slate-200 text-lg">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="mt-16 text-center backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8"
          >
            <p className="text-slate-400 mb-3">Want to learn more?</p>
            <a
              href="mailto:support@governapi.com"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition font-medium text-lg"
            >
              support@governapi.com
            </a>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
