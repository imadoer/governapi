'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircleIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  GlobeAltIcon,
  HeartIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export default function CompliancePage() {
  const [exporting, setExporting] = useState(false)

  const handleExportPDF = () => {
    setExporting(true)
    // Placeholder - would generate PDF in production
    setTimeout(() => {
      alert('PDF export feature coming soon. This would generate a comprehensive compliance summary report.')
      setExporting(false)
    }, 1000)
  }

  const frameworks = [
    {
      icon: ShieldCheckIcon,
      name: 'SOC 2 Type II',
      status: 'Aligned',
      description: 'System and Organization Controls for service organizations',
      details: [
        'Security: Access controls, encryption, monitoring',
        'Availability: 99.9% uptime SLA, redundancy',
        'Processing Integrity: Error handling, data validation',
        'Confidentiality: Data classification, NDA enforcement',
        'Privacy: Data retention, consent management'
      ],
      note: 'GovernAPI follows SOC 2 Type II framework requirements. We are not formally audited but implement all control objectives.'
    },
    {
      icon: GlobeAltIcon,
      name: 'GDPR',
      status: 'Compliant',
      description: 'General Data Protection Regulation for EU data privacy',
      details: [
        'Right to Access: Users can export their data',
        'Right to Erasure: Account deletion removes all data',
        'Data Portability: Export data in JSON format',
        'Consent Management: Clear opt-ins for data processing',
        'Data Processing Agreements: Available for enterprise',
        'Breach Notification: 72-hour notification protocol'
      ],
      note: 'Full GDPR compliance for EU users with data processing agreements available.'
    },
    {
      icon: HeartIcon,
      name: 'HIPAA',
      status: 'Guidance',
      description: 'Health Insurance Portability and Accountability Act',
      details: [
        'Technical Safeguards: Encryption, access controls',
        'Physical Safeguards: Secure data center facilities',
        'Administrative Safeguards: Security policies, training',
        'Business Associate Agreements: Available on request',
        'Audit Controls: Comprehensive activity logging'
      ],
      note: 'For healthcare organizations: GovernAPI can be configured to meet HIPAA requirements. BAA available for enterprise customers handling PHI.'
    },
    {
      icon: ExclamationTriangleIcon,
      name: 'OWASP API Security',
      status: 'Implemented',
      description: 'OWASP API Security Top 10 protection',
      details: [
        'API1: Broken Object Level Authorization - RBAC enforced',
        'API2: Broken Authentication - JWT + MFA available',
        'API3: Broken Object Property Level Authorization - Field-level security',
        'API4: Unrestricted Resource Consumption - Rate limiting',
        'API5: Broken Function Level Authorization - Endpoint protection',
        'API6: Unrestricted Access to Sensitive Business Flows - Monitoring',
        'API7: Server Side Request Forgery - Input validation',
        'API8: Security Misconfiguration - Hardened defaults',
        'API9: Improper Inventory Management - Auto-discovery',
        'API10: Unsafe Consumption of APIs - Validation'
      ],
      note: 'GovernAPI protects against all OWASP API Security Top 10 threats by design.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
                  <DocumentTextIcon className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white">Compliance</h1>
                  <p className="text-slate-400 mt-1">Industry standards and regulatory alignment</p>
                </div>
              </div>
              
              <button
                onClick={handleExportPDF}
                disabled={exporting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                {exporting ? 'Exporting...' : 'Export Compliance Summary (PDF)'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="space-y-8">
          {frameworks.map((framework, index) => (
            <motion.div
              key={framework.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            >
              {/* Framework Header */}
              <div className="p-8 border-b border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <framework.icon className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-2">{framework.name}</h2>
                      <p className="text-slate-400 mb-4">{framework.description}</p>
                    </div>
                  </div>
                  <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <span className="text-green-400 text-sm font-medium flex items-center gap-2">
                      <CheckCircleIcon className="w-4 h-4" />
                      {framework.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Framework Details */}
              <div className="p-8">
                <h3 className="text-lg font-semibold text-white mb-4">Controls & Requirements</h3>
                <ul className="space-y-3 mb-6">
                  {framework.details.map((detail, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-300">{detail}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                  <p className="text-sm text-slate-300 leading-relaxed">
                    <strong className="text-blue-400">Note:</strong> {framework.note}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Additional Information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="p-6 bg-slate-800/30 border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-3">Audit Reports</h3>
            <p className="text-slate-400 text-sm mb-4">
              Enterprise customers can request detailed compliance documentation and audit reports.
            </p>
            <a 
              href="mailto:compliance@governapi.com" 
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
            >
              Request Audit Documentation →
            </a>
          </div>

          <div className="p-6 bg-slate-800/30 border border-white/10 rounded-2xl">
            <h3 className="text-lg font-semibold text-white mb-3">Data Processing Agreements</h3>
            <p className="text-slate-400 text-sm mb-4">
              Need a DPA or BAA for your organization? We provide customized agreements for enterprise customers.
            </p>
            <a 
              href="mailto:legal@governapi.com" 
              className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
            >
              Request Legal Documentation →
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
