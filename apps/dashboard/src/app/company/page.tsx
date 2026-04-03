"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  EnvelopeIcon,
  BriefcaseIcon,
  LifebuoyIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline"

const contactItems = [
  {
    Icon: EnvelopeIcon,
    title: "Email",
    href: "mailto:contact@governapi.com",
    label: "contact@governapi.com",
  },
  {
    Icon: BriefcaseIcon,
    title: "Sales",
    href: "mailto:sales@governapi.com",
    label: "sales@governapi.com",
  },
  {
    Icon: LifebuoyIcon,
    title: "Support",
    href: "mailto:support@governapi.com",
    label: "support@governapi.com",
  },
]

export default function CompanyPage() {
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
              <ShieldCheckIcon className="w-4 h-4" />
              Our Company
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              About{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                GovernAPI
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              We're on a mission to make API security accessible, automated, and effective for every organization
            </p>
          </div>

          {/* Mission card with gradient border */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative mb-20 rounded-2xl p-px bg-gradient-to-r from-cyan-500/40 to-emerald-500/40"
          >
            <div className="backdrop-blur-xl bg-[#0a0a0f]/90 rounded-2xl p-12">
              <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Mission</h2>
              <p className="text-lg text-slate-300 text-center max-w-4xl mx-auto leading-relaxed">
                In today's API-driven world, security can't be an afterthought. We built GovernAPI to provide
                enterprise-grade API security that's powerful enough for Fortune 500 companies yet simple enough for startups.
              </p>
            </div>
          </motion.div>

          {/* Contact grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {contactItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 text-center hover:border-cyan-500/30 transition-colors"
              >
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 w-fit mx-auto mb-4">
                  <item.Icon className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold mb-3 text-lg">{item.title}</h3>
                <a
                  href={item.href}
                  className="text-cyan-400 hover:text-cyan-300 transition text-sm"
                >
                  {item.label}
                </a>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="relative rounded-2xl p-px bg-gradient-to-r from-cyan-500 to-emerald-500"
          >
            <div className="bg-[#0a0a0f]/80 backdrop-blur-xl rounded-2xl p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to Secure Your APIs?</h2>
              <p className="text-slate-300 mb-8 text-lg max-w-2xl mx-auto">
                Join hundreds of companies trusting GovernAPI with their API security
              </p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link
                  href="/pricing"
                  className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  View Pricing
                </Link>
                <Link
                  href="/login"
                  className="px-8 py-3 backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] text-white font-semibold rounded-xl hover:border-cyan-500/30 transition-all"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
