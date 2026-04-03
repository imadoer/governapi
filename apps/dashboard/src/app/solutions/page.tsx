"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import {
  BuildingLibraryIcon,
  HeartIcon,
  ShoppingCartIcon,
  CpuChipIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline"

const solutionIcons: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  "Financial Services": BuildingLibraryIcon,
  Healthcare: HeartIcon,
  "E-Commerce": ShoppingCartIcon,
  "SaaS & Technology": CpuChipIcon,
}

export default function SolutionsPage() {
  const solutions = [
    {
      industry: "Financial Services",
      description:
        "Meet strict regulatory requirements while maintaining high-performance APIs",
      challenges: [
        "PCI-DSS compliance",
        "Real-time fraud detection",
        "Secure payment processing",
        "Audit trail requirements",
      ],
      benefits: [
        "Automated compliance reporting",
        "Enhanced fraud protection",
        "Risk scoring and monitoring",
        "Regulatory change tracking",
      ],
    },
    {
      industry: "Healthcare",
      description:
        "Protect patient data and maintain HIPAA compliance across all API endpoints",
      challenges: [
        "HIPAA compliance",
        "PHI data protection",
        "Multi-system integration",
        "Access control requirements",
      ],
      benefits: [
        "HIPAA-compliant infrastructure",
        "Encrypted data transmission",
        "Role-based access control",
        "Comprehensive audit logs",
      ],
    },
    {
      industry: "E-Commerce",
      description:
        "Scale securely with protection against bots, fraud, and DDoS attacks",
      challenges: [
        "High traffic volumes",
        "Bot and scraper attacks",
        "Payment fraud",
        "API abuse and rate limiting",
      ],
      benefits: [
        "Advanced bot detection",
        "Real-time threat blocking",
        "Scalable infrastructure",
        "Performance optimization",
      ],
    },
    {
      industry: "SaaS & Technology",
      description:
        "Secure your platform APIs and partner integrations at scale",
      challenges: [
        "Multi-tenant security",
        "Third-party integrations",
        "API versioning",
        "Developer experience",
      ],
      benefits: [
        "Isolated tenant environments",
        "Partner API monitoring",
        "Version management",
        "Developer portal and docs",
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
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-cyan-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl z-0" />

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
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-block mb-5 px-4 py-1.5 text-xs font-medium tracking-wider uppercase rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400">
            Industry Solutions
          </span>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Purpose-Built for
            </span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              Your Industry
            </span>
          </h1>
          <p className="text-lg text-white/40 max-w-2xl mx-auto leading-relaxed">
            Tailored API security solutions designed for your industry&apos;s unique
            challenges and compliance requirements
          </p>
        </motion.div>
      </div>

      {/* Solutions */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 space-y-8">
        {solutions.map((solution, index) => {
          const Icon = solutionIcons[solution.industry]
          return (
            <motion.div
              key={solution.industry}
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.1, duration: 0.5 }}
              className="group backdrop-blur-xl bg-white/[0.03] border border-white/[0.07] rounded-2xl p-8 md:p-10 hover:border-cyan-500/20 hover:bg-white/[0.05] transition-all duration-300"
            >
              <div className="grid md:grid-cols-3 gap-8">
                {/* Info */}
                <div>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/20 flex items-center justify-center mb-5">
                    <Icon className="w-7 h-7 text-cyan-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {solution.industry}
                  </h3>
                  <p className="text-white/40 leading-relaxed text-sm">
                    {solution.description}
                  </p>
                </div>

                {/* Challenges */}
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">
                    Common Challenges
                  </h4>
                  <ul className="space-y-3">
                    {solution.challenges.map((challenge) => (
                      <li
                        key={challenge}
                        className="flex items-start gap-3 text-white/50 text-sm"
                      >
                        <ExclamationTriangleIcon className="w-4 h-4 text-amber-400/70 mt-0.5 flex-shrink-0" />
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-white/30 mb-4">
                    Our Solutions
                  </h4>
                  <ul className="space-y-3">
                    {solution.benefits.map((benefit) => (
                      <li
                        key={benefit}
                        className="flex items-start gap-3 text-white/60 text-sm"
                      >
                        <CheckIcon className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="relative rounded-2xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10" />
          <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.03]" />
          <div className="relative border border-white/[0.07] rounded-2xl p-12 md:p-16 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready for a Custom Solution?
            </h2>
            <p className="text-white/40 mb-10 text-lg max-w-xl mx-auto">
              Let&apos;s discuss how GovernAPI can address your specific industry needs
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/pricing"
                className="group inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-emerald-500 text-black px-8 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
              >
                View Pricing
                <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/company"
                className="inline-flex items-center gap-2 backdrop-blur-xl bg-white/[0.05] border border-white/[0.1] text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/[0.08] transition-colors"
              >
                Contact Us
              </Link>
            </div>
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
