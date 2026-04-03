"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { useState } from "react"
import {
  RocketLaunchIcon,
  BookOpenIcon,
  AcademicCapIcon,
  CommandLineIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline"

const sectionIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "getting-started": RocketLaunchIcon,
  "api-reference": BookOpenIcon,
  guides: AcademicCapIcon,
}

const sectionAccentColors: Record<string, string> = {
  "getting-started": "from-cyan-400 to-cyan-500",
  "api-reference": "from-emerald-400 to-emerald-500",
  guides: "from-teal-400 to-teal-500",
}

const sectionBorderColors: Record<string, string> = {
  "getting-started": "border-l-cyan-400",
  "api-reference": "border-l-emerald-400",
  guides: "border-l-teal-400",
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started")

  const sections = [
    {
      id: "getting-started",
      title: "Getting Started",
      content: [
        {
          title: "Quick Start Guide",
          description: "Get up and running with GovernAPI in 5 minutes",
          steps: [
            "Sign up for a GovernAPI account",
            "Generate your first API key",
            "Install our SDK or use the REST API",
            "Run your first security scan",
            "View results in the dashboard",
          ],
        },
      ],
    },
    {
      id: "api-reference",
      title: "API Reference",
      content: [
        {
          title: "Authentication",
          description:
            "All API requests require authentication using API keys",
          code: "Authorization: Bearer YOUR_API_KEY",
        },
      ],
    },
    {
      id: "guides",
      title: "Guides",
      content: [
        {
          title: "Best Practices",
          description: "Security best practices for API protection",
          items: [
            "Always use HTTPS for API endpoints",
            "Implement rate limiting",
            "Rotate API keys regularly",
          ],
        },
      ],
    },
  ]

  const currentSection = sections.find((s) => s.id === activeSection)
  const CurrentIcon = sectionIcons[activeSection]

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
      <div className="pointer-events-none fixed top-0 right-0 w-[700px] h-[500px] bg-gradient-to-bl from-cyan-500/8 via-emerald-500/5 to-transparent rounded-full blur-3xl z-0" />

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
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block mb-5 px-4 py-1.5 text-xs font-medium tracking-wider uppercase rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400">
            Documentation
          </span>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Everything You Need
            </span>
          </h1>
          <p className="text-lg text-white/40 max-w-xl leading-relaxed">
            Integrate and use GovernAPI with comprehensive guides, references,
            and best practices
          </p>
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="md:col-span-1"
          >
            <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4 sticky top-6">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const SIcon = sectionIcons[section.id]
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        activeSection === section.id
                          ? "bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 text-white"
                          : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
                      }`}
                    >
                      <SIcon className={`w-5 h-5 ${activeSection === section.id ? "text-cyan-400" : ""}`} />
                      <span className="font-medium text-sm">{section.title}</span>
                    </button>
                  )
                })}
              </nav>
            </div>
          </motion.div>

          {/* Main content */}
          <div className="md:col-span-3">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {currentSection?.content.map((item, index) => (
                <div
                  key={index}
                  className={`backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 border-l-4 ${sectionBorderColors[activeSection]}`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <CurrentIcon className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-2xl font-bold text-white">
                      {item.title}
                    </h3>
                  </div>
                  {item.description && (
                    <p className="text-white/40 mb-6 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Steps */}
                  {item.steps && (
                    <ol className="space-y-4">
                      {item.steps.map((step: string, i: number) => (
                        <li key={i} className="flex items-start gap-4">
                          <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-xs font-bold text-black">
                            {i + 1}
                          </span>
                          <span className="text-white/60 pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {/* Code */}
                  {item.code && (
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-8 bg-white/[0.03] border-b border-white/[0.07] flex items-center px-4">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        </div>
                        <CommandLineIcon className="w-3.5 h-3.5 text-white/20 ml-3" />
                      </div>
                      <pre className="bg-[#060610] border border-white/[0.07] rounded-xl pt-12 px-5 pb-5 overflow-x-auto">
                        <code className="text-emerald-400 text-sm font-mono">
                          {item.code}
                        </code>
                      </pre>
                    </div>
                  )}

                  {/* List items */}
                  {item.items && (
                    <ul className="space-y-3">
                      {item.items.map((listItem: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-white/50">
                          <CheckCircleIcon className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                          <span>{listItem}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </motion.div>
          </div>
        </div>

        {/* Help CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-16 backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-10 text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-3">Need Help?</h2>
          <p className="text-white/40 mb-8">
            Our team is here to help you get the most out of GovernAPI
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/company"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-black px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
              Contact Support
            </Link>
            <a
              href="mailto:support@governapi.com"
              className="inline-flex items-center gap-2 backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/[0.08] transition-colors"
            >
              <EnvelopeIcon className="w-5 h-5" />
              Email Us
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
