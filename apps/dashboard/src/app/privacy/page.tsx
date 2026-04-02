'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-white hover:text-blue-400 transition">
            GovernAPI
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <ShieldCheckIcon className="w-12 h-12 text-cyan-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
              <p className="text-slate-400 mt-1">Last updated: October 20, 2025</p>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
              <p className="text-slate-300 leading-relaxed">
                GovernAPI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our API security and governance platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Account Information</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Name, email address, and company information</li>
                <li>Billing information (processed securely through Stripe)</li>
                <li>Account credentials (passwords are encrypted)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Usage Data</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>API endpoints and request patterns</li>
                <li>Security scan results and vulnerability data</li>
                <li>Performance metrics and analytics</li>
                <li>Log data (IP addresses, browser type, timestamps)</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Technical Information</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Device and browser information</li>
                <li>Cookies and similar tracking technologies</li>
                <li>API keys and authentication tokens</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send billing notifications</li>
                <li>Detect and prevent security threats</li>
                <li>Communicate with you about updates and features</li>
                <li>Comply with legal obligations</li>
                <li>Analyze usage patterns to improve performance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing and Disclosure</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-white">Service Providers:</strong> Stripe for payment processing, AWS for hosting</li>
                <li><strong className="text-white">Legal Requirements:</strong> When required by law or to protect rights and safety</li>
                <li><strong className="text-white">Business Transfers:</strong> In connection with a merger or acquisition</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication requirements</li>
                <li>SOC 2 Type II compliance (in progress)</li>
                <li>Regular backups and disaster recovery plans</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Retention</h2>
              <p className="text-slate-300 leading-relaxed">
                We retain your information for as long as your account is active or as needed to provide services. You can request deletion of your data at any time. We may retain certain information for legal compliance (7 years for financial records).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights (GDPR & CCPA)</h2>
              <p className="text-slate-300 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-white">Access:</strong> Request a copy of your personal data</li>
                <li><strong className="text-white">Correction:</strong> Update inaccurate information</li>
                <li><strong className="text-white">Deletion:</strong> Request deletion of your data</li>
                <li><strong className="text-white">Portability:</strong> Receive your data in a structured format</li>
                <li><strong className="text-white">Opt-Out:</strong> Unsubscribe from marketing communications</li>
                <li><strong className="text-white">Object:</strong> Object to certain data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies and Tracking</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We use cookies for authentication, preferences, and analytics. You can control cookies through your browser settings.
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-white">Essential:</strong> Required for login and security</li>
                <li><strong className="text-white">Analytics:</strong> Help us understand usage patterns (anonymized)</li>
                <li><strong className="text-white">Preferences:</strong> Remember your settings</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. International Data Transfers</h2>
              <p className="text-slate-300 leading-relaxed">
                Your data may be transferred to and processed in the United States. We comply with EU-US Privacy Shield principles and use Standard Contractual Clauses for GDPR compliance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Children's Privacy</h2>
              <p className="text-slate-300 leading-relaxed">
                Our service is not intended for children under 18. We do not knowingly collect information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Changes to This Policy</h2>
              <p className="text-slate-300 leading-relaxed">
                We may update this policy periodically. We will notify you of material changes via email or dashboard notification. Continued use of the service constitutes acceptance of changes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                For privacy-related questions or to exercise your rights, contact us:
              </p>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                <p className="text-white font-semibold">Email: <a href="mailto:privacy@governapi.com" className="text-blue-400 hover:underline">privacy@governapi.com</a></p>
                <p className="text-white font-semibold mt-2">Data Protection Officer: <a href="mailto:dpo@governapi.com" className="text-blue-400 hover:underline">dpo@governapi.com</a></p>
              </div>
            </section>

          </div>

          <div className="mt-8 text-center">
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition">
              ← Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
