'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

export default function SolutionsPage() {
  const solutions = [
    {
      industry: 'Financial Services',
      description: 'Meet strict regulatory requirements while maintaining high-performance APIs',
      challenges: [
        'PCI-DSS compliance',
        'Real-time fraud detection',
        'Secure payment processing',
        'Audit trail requirements'
      ],
      benefits: [
        'Automated compliance reporting',
        'Enhanced fraud protection',
        'Risk scoring and monitoring',
        'Regulatory change tracking'
      ],
      icon: '🏦'
    },
    {
      industry: 'Healthcare',
      description: 'Protect patient data and maintain HIPAA compliance across all API endpoints',
      challenges: [
        'HIPAA compliance',
        'PHI data protection',
        'Multi-system integration',
        'Access control requirements'
      ],
      benefits: [
        'HIPAA-compliant infrastructure',
        'Encrypted data transmission',
        'Role-based access control',
        'Comprehensive audit logs'
      ],
      icon: '🏥'
    },
    {
      industry: 'E-Commerce',
      description: 'Scale securely with protection against bots, fraud, and DDoS attacks',
      challenges: [
        'High traffic volumes',
        'Bot and scraper attacks',
        'Payment fraud',
        'API abuse and rate limiting'
      ],
      benefits: [
        'Advanced bot detection',
        'Real-time threat blocking',
        'Scalable infrastructure',
        'Performance optimization'
      ],
      icon: '🛒'
    },
    {
      industry: 'SaaS & Technology',
      description: 'Secure your platform APIs and partner integrations at scale',
      challenges: [
        'Multi-tenant security',
        'Third-party integrations',
        'API versioning',
        'Developer experience'
      ],
      benefits: [
        'Isolated tenant environments',
        'Partner API monitoring',
        'Version management',
        'Developer portal and docs'
      ],
      icon: '💻'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/50 border-b border-slate-700"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white">
            GovernAPI
          </Link>
          <nav className="flex gap-6">
            <Link href="/products" className="text-slate-300 hover:text-white transition">
              Products
            </Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">
              Pricing
            </Link>
            <Link href="/customer/login" className="text-slate-300 hover:text-white transition">
              Login
            </Link>
          </nav>
        </div>
      </motion.div>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl font-bold text-white mb-6">
            Industry-Specific Solutions
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Tailored API security solutions designed for your industry's unique challenges and compliance requirements
          </p>
        </motion.div>

        {/* Solutions Grid */}
        <div className="space-y-12">
          {solutions.map((solution, index) => (
            <motion.div
              key={solution.industry}
              initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-blue-500/50 transition-all"
            >
              <div className="grid md:grid-cols-3 gap-8">
                {/* Industry Info */}
                <div>
                  <div className="text-6xl mb-4">{solution.icon}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {solution.industry}
                  </h3>
                  <p className="text-slate-300">
                    {solution.description}
                  </p>
                </div>

                {/* Challenges */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Common Challenges</h4>
                  <ul className="space-y-2">
                    {solution.challenges.map((challenge) => (
                      <li key={challenge} className="flex items-start text-slate-400">
                        <span className="text-red-500 mr-2 mt-1">⚠</span>
                        <span>{challenge}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Benefits */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Our Solutions</h4>
                  <ul className="space-y-2">
                    {solution.benefits.map((benefit) => (
                      <li key={benefit} className="flex items-start text-slate-400">
                        <span className="text-green-500 mr-2 mt-1">✓</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center mt-20"
        >
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready for a Custom Solution?
          </h2>
          <p className="text-white/90 mb-8 text-lg">
            Let's discuss how GovernAPI can address your specific industry needs
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/pricing"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-slate-100 transition"
            >
              View Pricing
            </Link>
            <Link
              href="/company"
              className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition border border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-slate-400">
            © 2025 GovernAPI. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
