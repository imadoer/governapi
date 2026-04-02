'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { KeyIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function AdminAPIKeys() {
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">API Key Management</h1>
        <p className="text-slate-400">Monitor and manage customer API keys</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6"
      >
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search API keys by customer or key..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>
      </motion.div>

      {/* Keys Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700/50 rounded-2xl mb-4">
            <KeyIcon className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-400 mb-2">API Keys Management</p>
          <p className="text-slate-500 text-sm">API keys will be displayed here when customers generate them</p>
        </div>
      </motion.div>
    </div>
  )
}
