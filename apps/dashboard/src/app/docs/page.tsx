'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      content: [
        {
          title: 'Quick Start Guide',
          description: 'Get up and running with GovernAPI in 5 minutes',
          steps: [
            'Sign up for a GovernAPI account',
            'Generate your first API key',
            'Install our SDK or use the REST API',
            'Run your first security scan',
            'View results in the dashboard'
          ]
        }
      ]
    },
    {
      id: 'api-reference',
      title: 'API Reference',
      icon: '📚',
      content: [
        {
          title: 'Authentication',
          description: 'All API requests require authentication using API keys',
          code: 'Authorization: Bearer YOUR_API_KEY'
        }
      ]
    },
    {
      id: 'guides',
      title: 'Guides',
      icon: '📖',
      content: [
        {
          title: 'Best Practices',
          description: 'Security best practices for API protection',
          items: [
            'Always use HTTPS for API endpoints',
            'Implement rate limiting',
            'Rotate API keys regularly'
          ]
        }
      ]
    }
  ]

  const currentSection = sections.find(s => s.id === activeSection)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
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
            <Link href="/products" className="text-slate-300 hover:text-white transition">Products</Link>
            <Link href="/solutions" className="text-slate-300 hover:text-white transition">Solutions</Link>
            <Link href="/pricing" className="text-slate-300 hover:text-white transition">Pricing</Link>
            <Link href="/customer/login" className="text-slate-300 hover:text-white transition">Login</Link>
          </nav>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Documentation</h1>
          <p className="text-xl text-slate-300">Everything you need to integrate and use GovernAPI</p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-4 sticky top-6">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition flex items-center gap-3 ${
                      activeSection === section.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <span className="text-2xl">{section.icon}</span>
                    <span className="font-medium">{section.title}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="md:col-span-3">
            <motion.div key={activeSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
              {currentSection?.content.map((item, index) => (
                <div key={index} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  {item.description && <p className="text-slate-300 mb-6">{item.description}</p>}
                  {item.steps && (
                    <ol className="space-y-3">
                      {item.steps.map((step, i) => (
                        <li key={i} className="flex items-start text-slate-300">
                          <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 mt-0.5 flex-shrink-0 text-sm">{i + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                  {item.code && (
                    <pre className="bg-slate-900 border border-slate-700 rounded-lg p-4 overflow-x-auto">
                      <code className="text-green-400 text-sm">{item.code}</code>
                    </pre>
                  )}
                  {item.items && (
                    <ul className="space-y-2">
                      {item.items.map((listItem, i) => (
                        <li key={i} className="flex items-start text-slate-300">
                          <span className="text-blue-500 mr-2 mt-1">•</span>
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

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 mt-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need Help?</h2>
          <p className="text-slate-300 mb-6">Our team is here to help</p>
          <div className="flex gap-4 justify-center">
            <Link href="/company" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition">Contact Support</Link>
            <a href="mailto:support@governapi.com" className="bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition">Email Us</a>
          </div>
        </motion.div>
      </div>

      <div className="border-t border-slate-700 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <p className="text-center text-slate-400">© 2025 GovernAPI. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
