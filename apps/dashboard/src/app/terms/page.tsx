'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { DocumentTextIcon } from '@heroicons/react/24/outline'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-2xl font-bold text-white hover:text-cyan-400 transition">
            GovernAPI
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-4 mb-8">
            <DocumentTextIcon className="w-12 h-12 text-cyan-400" />
            <div>
              <h1 className="text-4xl font-bold text-white">Terms of Service</h1>
              <p className="text-slate-400 mt-1">Last updated: October 20, 2025</p>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 space-y-8">
            
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                By accessing or using GovernAPI ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                GovernAPI provides API security, governance, and monitoring services including:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Automated security scanning and vulnerability detection</li>
                <li>API traffic monitoring and threat intelligence</li>
                <li>Compliance reporting and governance tools</li>
                <li>Performance analytics and observability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Account Registration</h2>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>You must provide accurate, complete, and current information</li>
                <li>You are responsible for maintaining account security</li>
                <li>You must be 18 years or older to use the Service</li>
                <li>One account per organization unless otherwise agreed</li>
                <li>You must notify us immediately of any unauthorized access</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Acceptable Use Policy</h2>
              <p className="text-slate-300 leading-relaxed mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Use the Service for illegal purposes or to violate any laws</li>
                <li>Attempt to gain unauthorized access to any part of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Transmit malware, viruses, or malicious code</li>
                <li>Reverse engineer, decompile, or disassemble the Service</li>
                <li>Resell or redistribute the Service without authorization</li>
                <li>Exceed rate limits or abuse API quotas</li>
                <li>Use the Service to attack or scan third-party systems without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. API Keys and Security</h2>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>API keys are confidential and must not be shared publicly</li>
                <li>You are responsible for all activity under your API keys</li>
                <li>Rotate API keys regularly (recommended every 90 days)</li>
                <li>Report compromised keys immediately</li>
                <li>We may revoke keys if suspicious activity is detected</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Billing and Payment</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Pricing</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                Pricing is based on your selected plan (Developer, Professional, or Enterprise). Current pricing is available at <Link href="/pricing" className="text-blue-400 hover:underline">governapi.com/pricing</Link>.
              </p>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Payment Terms</h3>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Paid plans are billed monthly or annually in advance</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>You authorize us to charge your payment method automatically</li>
                <li>Failed payments may result in service suspension</li>
                <li>Prices may change with 30 days notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Overage Charges</h3>
              <p className="text-slate-300 leading-relaxed">
                Exceeding plan limits may result in additional charges or throttling. We will notify you before applying overage charges.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Free Trial</h2>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Free trials are 14 days unless otherwise stated</li>
                <li>No credit card required for free tier</li>
                <li>Trial converts to paid plan unless cancelled</li>
                <li>One free trial per organization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Cancellation and Termination</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">By You</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                You may cancel at any time from your dashboard. Access continues until the end of your billing period. No refunds for partial months.
              </p>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">By Us</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                We may suspend or terminate your account for:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Violation of these Terms</li>
                <li>Non-payment</li>
                <li>Illegal activity or security threats</li>
                <li>Extended inactivity (180+ days on free plan)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Service Level Agreement (SLA)</h2>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li><strong className="text-white">Target Uptime:</strong> 99.9% (Professional and Enterprise plans)</li>
                <li><strong className="text-white">Scheduled Maintenance:</strong> Announced 48 hours in advance</li>
                <li><strong className="text-white">SLA Credits:</strong> Available for paid plans with uptime below 99.9%</li>
                <li><strong className="text-white">Support:</strong> Email support (24-48hr response), Priority support for Enterprise</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Data and Privacy</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Your use of the Service is also governed by our <Link href="/privacy" className="text-blue-400 hover:underline">Privacy Policy</Link>. Key points:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>We do not sell your data</li>
                <li>You retain ownership of your data</li>
                <li>We may use aggregated, anonymized data for service improvement</li>
                <li>Data is encrypted in transit and at rest</li>
                <li>You can export your data at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Our IP</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                The Service, including all software, algorithms, designs, and content, is owned by GovernAPI and protected by copyright, trademark, and other laws.
              </p>

              <h3 className="text-xl font-semibold text-white mt-4 mb-2">Your IP</h3>
              <p className="text-slate-300 leading-relaxed">
                You retain ownership of your APIs, code, and data. You grant us a limited license to process your data to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Warranties and Disclaimers</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE</li>
                <li>UNINTERRUPTED OR ERROR-FREE OPERATION</li>
                <li>COMPLETE SECURITY (no system is 100% secure)</li>
                <li>DETECTION OF ALL VULNERABILITIES</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Limitation of Liability</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>Our liability is limited to the amount you paid in the 12 months prior</li>
                <li>We are not liable for indirect, incidental, or consequential damages</li>
                <li>We are not liable for data breaches resulting from your negligence</li>
                <li>We are not liable for third-party actions or services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">14. Indemnification</h2>
              <p className="text-slate-300 leading-relaxed">
                You agree to indemnify and hold harmless GovernAPI from claims arising from your use of the Service, violation of these Terms, or infringement of third-party rights.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">15. Compliance</h2>
              <ul className="list-disc list-inside text-slate-300 space-y-2 ml-4">
                <li>You are responsible for compliance with applicable laws (GDPR, CCPA, HIPAA, etc.)</li>
                <li>The Service helps with compliance but does not guarantee it</li>
                <li>You must obtain appropriate consent for data processing</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">16. Modifications to Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                We may update these Terms at any time. Material changes will be notified via email 30 days in advance. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">17. Governing Law and Disputes</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                These Terms are governed by the laws of Delaware, USA, excluding conflict of law provisions.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Disputes will be resolved through binding arbitration (JAMS rules) in Delaware. You waive the right to class action lawsuits.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">18. Contact Information</h2>
              <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
                <p className="text-white font-semibold">Email: <a href="mailto:legal@governapi.com" className="text-blue-400 hover:underline">legal@governapi.com</a></p>
                <p className="text-white font-semibold mt-2">Support: <a href="mailto:support@governapi.com" className="text-blue-400 hover:underline">support@governapi.com</a></p>
              </div>
            </section>

          </div>

          <div className="mt-8 text-center space-x-6">
            <Link href="/privacy" className="text-blue-400 hover:text-blue-300 transition">
              Privacy Policy
            </Link>
            <Link href="/" className="text-blue-400 hover:text-blue-300 transition">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
