"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  BoltIcon,
  CheckIcon,
} from "@heroicons/react/24/outline"

const products = [
  {
    name: "API Discovery",
    description: "Automatically discover and catalog all APIs",
    features: ["Real-time detection", "Shadow API identification", "Automated inventory"],
    Icon: MagnifyingGlassIcon,
  },
  {
    name: "Security Scanning",
    description: "Continuous security testing",
    features: ["OWASP Top 10", "Authentication testing", "Vulnerability scanning"],
    Icon: ShieldCheckIcon,
  },
  {
    name: "Threat Intelligence",
    description: "Real-time threat detection",
    features: ["Bot detection", "DDoS protection", "Anomaly detection"],
    Icon: BoltIcon,
  },
]

export default function ProductsPage() {
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
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
              <ShieldCheckIcon className="w-4 h-4" />
              Our Products
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Enterprise API{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                Security Solutions
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Comprehensive tools to discover, secure, and monitor your APIs
            </p>
          </div>

          {/* Product cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product, i) => (
              <motion.div
                key={product.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
                className="group relative backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 hover:border-cyan-500/30 transition-all duration-300"
              >
                {/* Hover glow */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/0 to-emerald-500/0 group-hover:from-cyan-500/10 group-hover:to-emerald-500/10 transition-all duration-500 blur-xl opacity-0 group-hover:opacity-100" />

                <div className="relative">
                  <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 w-fit mb-6">
                    <product.Icon className="w-8 h-8 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{product.name}</h3>
                  <p className="text-slate-400 mb-6">{product.description}</p>
                  <ul className="space-y-3">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3 text-slate-300">
                        <CheckIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
