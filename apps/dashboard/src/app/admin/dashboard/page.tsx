'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  UsersIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalApiCalls: 0,
    monthlyRevenue: 0,
    systemUptime: 99.97,
    activeThreats: 0
  })

  useEffect(() => {
    loadStats()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data.systemStats || stats)
      }
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: UsersIcon,
      color: 'cyan',
      change: '+12.5%'
    },
    {
      title: 'Active Customers',
      value: stats.activeCustomers,
      icon: CheckCircleIcon,
      color: 'green',
      change: '+8.2%'
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats.monthlyRevenue / 1000).toFixed(1)}k`,
      icon: CurrencyDollarIcon,
      color: 'blue',
      change: '+23.1%'
    },
    {
      title: 'API Calls',
      value: `${(stats.totalApiCalls / 1000000).toFixed(1)}M`,
      icon: ChartBarIcon,
      color: 'purple',
      change: '+45.3%'
    },
    {
      title: 'System Uptime',
      value: `${stats.systemUptime}%`,
      icon: ShieldCheckIcon,
      color: 'emerald',
      change: 'Stable'
    },
    {
      title: 'Security Findings',
      value: stats.activeThreats,
      icon: ExclamationTriangleIcon,
      color: 'red',
      change: '-5 from yesterday'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">Monitor system performance and customer activity</p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 bg-${stat.color}-500/20 border border-${stat.color}-500/30 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 text-${stat.color}-400`} />
                </div>
                <span className="text-sm text-green-400">{stat.change}</span>
              </div>
              <h3 className="text-sm text-slate-400 mb-1">{stat.title}</h3>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[
            { type: 'customer', message: 'New customer signup: Acme Corp', time: '5 min ago' },
            { type: 'upgrade', message: 'TechStart upgraded to Professional', time: '15 min ago' },
            { type: 'threat', message: 'Blocked 3 malicious requests from 192.168.1.1', time: '1 hour ago' },
            { type: 'payment', message: 'Payment received: $199 from DataFlow Inc', time: '2 hours ago' }
          ].map((activity, index) => (
            <div key={index} className="flex items-start gap-4 p-4 bg-slate-900/50 rounded-xl border border-white/5">
              <div className="w-2 h-2 bg-cyan-400 rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-white">{activity.message}</p>
                <p className="text-sm text-slate-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
