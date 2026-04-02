'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChartBarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState({
    apiCallsToday: 0,
    apiCallsWeek: 0,
    apiCallsMonth: 0,
    averageResponseTime: 0,
    errorRate: 0,
    topEndpoints: []
  })

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics')
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Failed to load analytics:', error)
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
        <h1 className="text-4xl font-bold text-white mb-2">Analytics</h1>
        <p className="text-slate-400">API usage and performance metrics</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'API Calls Today', value: analytics.apiCallsToday.toLocaleString(), change: '+12%', up: true },
          { label: 'This Week', value: analytics.apiCallsWeek.toLocaleString(), change: '+8%', up: true },
          { label: 'This Month', value: analytics.apiCallsMonth.toLocaleString(), change: '+23%', up: true }
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-slate-400 text-sm">{stat.label}</p>
              <span className={`flex items-center gap-1 text-xs ${stat.up ? 'text-green-400' : 'text-red-400'}`}>
                {stat.up ? <ArrowTrendingUpIcon className="w-4 h-4" /> : <ArrowTrendingDownIcon className="w-4 h-4" />}
                {stat.change}
              </span>
            </div>
            <p className="text-3xl font-bold text-white">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Top Endpoints</h2>
        <div className="space-y-4">
          {[
            { endpoint: '/api/security-scans', calls: 12453, percentage: 35 },
            { endpoint: '/api/customer/verify', calls: 8932, percentage: 25 },
            { endpoint: '/api/threat-detection', calls: 7123, percentage: 20 },
            { endpoint: '/api/compliance', calls: 4567, percentage: 13 },
            { endpoint: '/api/webhooks', calls: 2435, percentage: 7 }
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-white font-mono text-sm mb-1">{item.endpoint}</p>
                <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">{item.calls.toLocaleString()}</p>
                <p className="text-slate-400 text-xs">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
