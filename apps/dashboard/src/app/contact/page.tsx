"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  EnvelopeIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
} from "@heroicons/react/24/outline"

const contactMethods = [
  {
    title: "General Inquiries",
    description: "Have questions? We'd love to hear from you.",
    email: "support@governapi.com",
    icon: EnvelopeIcon,
  },
  {
    title: "Sales & Demos",
    description: "Interested in a demo or enterprise pricing?",
    email: "sales@governapi.com",
    icon: PhoneIcon,
  },
  {
    title: "Technical Support",
    description: "Need help? Check our docs or email support.",
    email: "support@governapi.com",
    icon: ChatBubbleLeftRightIcon,
    docLink: true,
  },
]

export default function ContactPage() {
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm mb-6">
              <EnvelopeIcon className="w-4 h-4" />
              Get in Touch
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Contact{" "}
              <span className="bg-gradient-to-r from-cyan-500 to-emerald-500 bg-clip-text text-transparent">
                Us
              </span>
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Have questions? We'd love to hear from you.
            </p>
          </div>

          {/* Contact cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {contactMethods.map((method, i) => (
              <motion.div
                key={method.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 hover:border-cyan-500/30 transition-colors group"
              >
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-500/15 to-emerald-500/15 w-fit mb-5">
                  <method.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <h3 className="text-xl font-bold mb-2">{method.title}</h3>
                <p className="text-slate-400 mb-5 text-sm">{method.description}</p>
                {method.docLink && (
                  <p className="text-sm text-slate-500 mb-3">
                    Check our{" "}
                    <Link href="/docs" className="text-cyan-400 hover:text-cyan-300 transition underline underline-offset-2">
                      documentation
                    </Link>{" "}
                    or email support
                  </p>
                )}
                <a
                  href={`mailto:${method.email}`}
                  className="text-cyan-400 hover:text-cyan-300 transition font-medium text-sm inline-flex items-center gap-1.5 group-hover:gap-2.5"
                >
                  {method.email}
                  <span className="transition-all">&rarr;</span>
                </a>
              </motion.div>
            ))}
          </div>

          {/* Response time banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="backdrop-blur-xl bg-white/[0.03] border border-cyan-500/20 rounded-2xl p-6 flex items-center gap-4"
          >
            <div className="p-2.5 rounded-xl bg-cyan-500/10 shrink-0">
              <ClockIcon className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-slate-300">
              <span className="font-semibold text-white">Response Time:</span>{" "}
              We typically respond within 24 hours on weekdays
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
