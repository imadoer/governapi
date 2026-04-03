"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeftIcon,
  UserIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export default function BlogPost() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-cyan-500/3 rounded-full blur-[120px]" />
      </div>

      <nav className="relative border-b border-white/5">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <button
            onClick={() => router.push("/blog")}
            className="text-slate-400 hover:text-white flex items-center gap-2 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Blog
          </button>
        </div>
      </nav>

      <div className="relative max-w-4xl mx-auto px-8 py-12">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <header className="mb-10">
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/15 text-blue-400">
                API Security
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/15 text-emerald-400">
                Trends
              </span>
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-violet-500/15 text-violet-400">
                Enterprise
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
              API Security Trends 2025: What Enterprises Need to Know
            </h1>

            <div className="flex items-center gap-6 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <UserIcon className="w-4 h-4" />
                GovernAPI Team
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4" />
                September 13, 2025
              </span>
              <span className="flex items-center gap-1.5">
                <ClockIcon className="w-4 h-4" />
                8 min read
              </span>
            </div>
          </header>

          <div className="prose prose-invert prose-lg max-w-none">
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              The API security landscape is evolving rapidly as enterprises
              adopt API-first architectures. With 91% of organizations
              experiencing API-related security incidents in 2024, understanding
              emerging trends is critical for security leaders planning 2025
              strategies.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
              Key Trends Reshaping API Security
            </h2>

            <h3 className="text-xl font-semibold text-white mt-8 mb-3">
              1. AI-Powered Bot Sophistication
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Traditional rate limiting is no longer sufficient. Modern bots use
              machine learning to mimic human behavior patterns, making
              detection increasingly difficult. Organizations need behavioral
              analysis and real-time threat intelligence to stay ahead.
            </p>

            <h3 className="text-xl font-semibold text-white mt-8 mb-3">
              2. Shadow API Proliferation
            </h3>
            <p className="text-slate-400 leading-relaxed">
              The average enterprise now manages 15,000+ APIs, with 67% being
              &quot;shadow APIs&quot; unknown to security teams. Automated discovery has
              become essential as manual inventory management becomes impossible
              at scale.
            </p>

            <h3 className="text-xl font-semibold text-white mt-8 mb-3">
              3. Compliance Automation Mandate
            </h3>
            <p className="text-slate-400 leading-relaxed">
              With SOC2, GDPR, and PCI-DSS requirements becoming more stringent,
              manual compliance processes are creating significant business
              risk. Organizations spending $500K+ annually on audit preparation
              are seeking automated solutions.
            </p>

            <h3 className="text-xl font-semibold text-white mt-8 mb-3">
              4. Real-Time Protection Requirements
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Static API testing tools can no longer meet enterprise security
              needs. Organizations require real-time threat detection and
              automatic policy enforcement to prevent breaches before they
              occur.
            </p>

            <h3 className="text-xl font-semibold text-white mt-8 mb-3">
              5. Business Context Integration
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Security teams are under pressure to demonstrate business value.
              API security platforms must provide executive-level reporting
              showing ROI, risk reduction, and business impact metrics.
            </p>

            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
              Predictions for 2025
            </h2>
            <ul className="list-disc pl-6 space-y-2 text-slate-400">
              <li>
                <strong className="text-white">API-first compliance frameworks</strong> will emerge
                from major standards bodies
              </li>
              <li>
                <strong className="text-white">Zero-trust API architectures</strong> will become
                standard for enterprise deployments
              </li>
              <li>
                <strong className="text-white">Business-context security platforms</strong> will
                replace purely technical solutions
              </li>
              <li>
                <strong className="text-white">Automated threat response</strong> will eliminate the
                need for manual incident management
              </li>
            </ul>

            <h2 className="text-2xl font-semibold text-white mt-12 mb-4">
              Strategic Recommendations
            </h2>
            <ol className="list-decimal pl-6 space-y-2 text-slate-400">
              <li>
                <strong className="text-white">Invest in unified platforms</strong> rather than point
                solutions to reduce complexity
              </li>
              <li>
                <strong className="text-white">Prioritize automated discovery</strong> to eliminate
                shadow API risks
              </li>
              <li>
                <strong className="text-white">Implement real-time protection</strong> to prevent
                rather than detect breaches
              </li>
              <li>
                <strong className="text-white">Demand business context</strong> from security tools for
                executive visibility
              </li>
            </ol>
          </div>

          <div className="border-t border-white/10 my-12" />

          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Ready to Future-Proof Your API Security?
            </h3>
            <p className="text-lg text-slate-400 mb-8">
              GovernAPI provides the unified platform and real-time protection
              enterprises need for 2025 and beyond.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-3.5 bg-white/5 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/10 transition-all"
              >
                View Live Demo
              </button>
              <button
                onClick={() => router.push("/login")}
                className="px-8 py-3.5 bg-gradient-to-r from-cyan-500 to-violet-500 text-white rounded-xl font-semibold hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-[1.02]"
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </motion.article>
      </div>
    </div>
  );
}
