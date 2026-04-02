'use client'

import { motion } from 'framer-motion'
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  ServerIcon,
  BellAlertIcon,
  CloudArrowUpIcon,
  KeyIcon
} from '@heroicons/react/24/outline'

export default function SecurityPage() {
  const sections = [
    {
      icon: LockClosedIcon,
      title: 'Data Encryption',
      items: [
        'AES-256 encryption for data at rest',
        'TLS 1.3 for data in transit',
        'End-to-end encryption for API communications',
        'Encrypted database backups',
        'Hardware security modules (HSM) for key management'
      ]
    },
    {
      icon: KeyIcon,
      title: 'Access Control',
      items: [
        'Role-Based Access Control (RBAC)',
        'Multi-Factor Authentication (MFA)',
        'Single Sign-On (SSO) support via SAML',
        'API key rotation and expiration policies',
        'IP whitelisting and geo-blocking',
        'Least-privilege principle enforcement'
      ]
    },
    {
      icon: CloudArrowUpIcon,
      title: 'Backups & Recovery',
      items: [
        'Automated daily snapshots',
        '30-day backup retention',
        'Point-in-time recovery capability',
        'Geo-redundant backup storage',
        'Regular disaster recovery drills',
        'RTO: 4 hours, RPO: 1 hour'
      ]
    },
    {
      icon: BellAlertIcon,
      title: 'Incident Response',
      items: [
        'Real-time threat detection and alerting',
        '24/7 security monitoring',
        'Automated incident escalation',
        'Security Operations Center (SOC) integration',
        'Post-incident analysis and reporting',
        'Breach notification procedures'
      ]
    },
    {
      icon: ServerIcon,
      title: 'Infrastructure Security',
      items: [
        'Enterprise-grade cloud infrastructure',
        'Network segmentation and isolation',
        'DDoS protection and mitigation',
        'Regular security audits and penetration testing',
        'Vulnerability scanning and patch management',
        'Infrastructure as Code (IaC) security'
      ]
    },
    {
      icon: ShieldCheckIcon,
      title: 'Security Practices',
      items: [
        'Secure software development lifecycle (SSDLC)',
        'Regular employee security training',
        'Third-party security assessments',
        'Bug bounty program',
        'Responsible disclosure policy',
        'Annual third-party audits'
      ]
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
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
                <ShieldCheckIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Security</h1>
                <p className="text-slate-400 mt-1">Enterprise-grade security practices and infrastructure</p>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-6">
              <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <span className="text-green-400 text-sm font-medium">ISO 27001 Aligned</span>
              </div>
              <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <span className="text-blue-400 text-sm font-medium">SOC 2 Type II Aligned</span>
              </div>
              <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                <span className="text-purple-400 text-sm font-medium">GDPR Compliant</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl flex items-center justify-center flex-shrink-0">
                  <section.icon className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{section.title}</h3>
                </div>
              </div>
              <ul className="space-y-3">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300">
                    <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 p-6 bg-slate-800/30 border border-white/10 rounded-2xl"
        >
          <p className="text-slate-400 text-sm leading-relaxed">
            <strong className="text-white">Security Disclosure:</strong> GovernAPI implements security practices aligned with industry standards including SOC 2 Type II, ISO 27001, and GDPR. 
            We are not formally certified but follow the framework requirements. For security concerns or vulnerability reports, contact{' '}
            <a href="mailto:security@governapi.com" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              security@governapi.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
