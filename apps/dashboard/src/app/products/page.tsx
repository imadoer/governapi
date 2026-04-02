'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function ProductsPage() {
  const products = [
    {
      name: 'API Discovery',
      description: 'Automatically discover and catalog all APIs',
      features: ['Real-time detection', 'Shadow API identification', 'Automated inventory'],
      icon: '🔍'
    },
    {
      name: 'Security Scanning',
      description: 'Continuous security testing',
      features: ['OWASP Top 10', 'Authentication testing', 'Vulnerability scanning'],
      icon: '🛡️'
    },
    {
      name: 'Threat Intelligence',
      description: 'Real-time threat detection',
      features: ['Bot detection', 'DDoS protection', 'Anomaly detection'],
      icon: '⚡'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-8 inline-block">← Back to Home</Link>
        <h1 className="text-5xl font-bold mb-6">Our Products</h1>
        <p className="text-xl text-slate-300 mb-12">Enterprise API Security Solutions</p>
        
        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product) => (
            <div key={product.name} className="bg-slate-800 border border-slate-700 rounded-xl p-8">
              <div className="text-5xl mb-4">{product.icon}</div>
              <h3 className="text-2xl font-bold mb-3">{product.name}</h3>
              <p className="text-slate-300 mb-6">{product.description}</p>
              <ul className="space-y-2">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-center text-slate-400">
                    <span className="text-green-500 mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
