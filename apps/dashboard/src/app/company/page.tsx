'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="bg-slate-900/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">GovernAPI</Link>
          <nav className="flex gap-6">
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">Pricing</Link>
            <Link href="/docs" className="text-slate-300 hover:text-white transition">Docs</Link>
            <Link href="/login" className="text-slate-300 hover:text-white transition">Login</Link>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-20">
            <h1 className="text-5xl font-bold text-white mb-6">About GovernAPI</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              We're on a mission to make API security accessible, automated, and effective for every organization
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-2xl p-12 mb-20">
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Our Mission</h2>
            <p className="text-lg text-slate-200 text-center max-w-4xl mx-auto leading-relaxed">
              In today's API-driven world, security can't be an afterthought. We built GovernAPI to provide 
              enterprise-grade API security that's powerful enough for Fortune 500 companies yet simple enough for startups.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="text-center">
              <div className="text-4xl mb-3">📧</div>
              <h3 className="text-white font-semibold mb-2">Email</h3>
              <a href="mailto:contact@governapi.com" className="text-blue-400 hover:text-blue-300">
                contact@governapi.com
              </a>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💼</div>
              <h3 className="text-white font-semibold mb-2">Sales</h3>
              <a href="mailto:sales@governapi.com" className="text-blue-400 hover:text-blue-300">
                sales@governapi.com
              </a>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">🛟</div>
              <h3 className="text-white font-semibold mb-2">Support</h3>
              <a href="mailto:support@governapi.com" className="text-blue-400 hover:text-blue-300">
                support@governapi.com
              </a>
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Secure Your APIs?</h2>
            <p className="text-white/90 mb-8 text-lg">
              Join hundreds of companies trusting GovernAPI with their API security
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/pricing" className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition">
                View Pricing
              </Link>
              <Link href="/login" className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition border border-white/20">
                Get Started
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
