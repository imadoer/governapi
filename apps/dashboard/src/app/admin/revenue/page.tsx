'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CurrencyDollarIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline'

export default function AdminRevenue() {
  const [loading, setLoading] = useState(true)
  const [revenue, setRevenue] = useState({
    today: 0,
    week: 0,
    month: 0,
    year: 0,
    mrr: 0,
    arr: 0
  })

  useEffect(() => {
    loadRevenue()
  }, [])

  const loadRevenue = async () => {
    try {
      const response = await fetch('/api/admin/revenue')
      if (response.ok) {
        const data = await response.json()
        setRevenue(data)
      }
    } catch (error) {
      console.error('Failed to load revenue:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <h1 className="text-4xl font-bold text-white mb-2">Revenue</h1>
        <p className="text-slate-400">Track subscription revenue and growth</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Monthly Recurring Revenue', value: `$${revenue.mrr.toLocaleString()}`, icon: CurrencyDollarIcon, color: 'green' },
          { label: 'Annual Recurring Revenue', value: `$${revenue.arr.toLocaleString()}`, icon: ArrowTrendingUpIcon, color: 'blue' },
          { label: 'This Month', value: `$${revenue.month.toLocaleString()}`, icon: CurrencyDollarIcon, color: 'cyan' },
          { label: 'This Week', value: `$${revenue.week.toLocaleString()}`, icon: CurrencyDollarIcon, color: 'purple' },
          { label: 'Today', value: `$${revenue.today.toLocaleString()}`, icon: CurrencyDollarIcon, color: 'pink' },
          { label: 'This Year', value: `$${revenue.year.toLocaleString()}`, icon: CurrencyDollarIcon, color: 'orange' }
        ].map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-500/20 border border-${stat.color}-500/30 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
