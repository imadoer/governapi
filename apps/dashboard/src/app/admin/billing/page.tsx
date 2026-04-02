'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  CreditCardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

interface Invoice {
  id: string
  customer: string
  amount: number
  status: 'paid' | 'pending' | 'failed'
  date: string
  plan: string
}

export default function AdminBilling() {
  const [loading, setLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    mrr: 0,
    outstanding: 0,
    successRate: 0
  })

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      // Load revenue data
      const revenueResponse = await fetch('/api/admin/revenue')
      if (revenueResponse.ok) {
        const revenueData = await revenueResponse.json()
        setStats({
          totalRevenue: revenueData.year || 0,
          mrr: revenueData.mrr || 0,
          outstanding: 0, // Would need failed payments tracking
          successRate: 100 // Would calculate from actual data
        })
      }

      // Mock invoices (would come from Stripe)
      setInvoices([
        // No invoices yet - would be fetched from Stripe
      ])
    } catch (error) {
      console.error('Failed to load billing data:', error)
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Billing Overview</h1>
        <p className="text-slate-400">Track revenue, invoices, and payment status</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Revenue',
            value: `$${stats.totalRevenue.toLocaleString()}`,
            icon: CreditCardIcon,
            color: 'green',
            change: '+23%'
          },
          {
            label: 'Monthly Recurring',
            value: `$${stats.mrr.toLocaleString()}`,
            icon: ArrowTrendingUpIcon,
            color: 'blue',
            change: '+12%'
          },
          {
            label: 'Outstanding',
            value: `$${stats.outstanding.toLocaleString()}`,
            icon: XCircleIcon,
            color: 'red',
            change: '0'
          },
          {
            label: 'Success Rate',
            value: `${stats.successRate}%`,
            icon: CheckCircleIcon,
            color: 'emerald',
            change: 'Stable'
          }
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
                <span className="text-sm text-green-400">{stat.change}</span>
              </div>
              <p className="text-slate-400 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Recent Invoices */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Recent Invoices</h2>
        </div>

        {invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700/50 rounded-2xl mb-4">
              <DocumentTextIcon className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-400 mb-2">No invoices found</p>
            <p className="text-slate-500 text-sm">Invoice system not yet configured with Stripe</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-900/50 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Plan</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 text-white">{invoice.customer}</td>
                    <td className="px-6 py-4 text-slate-300">{invoice.plan}</td>
                    <td className="px-6 py-4 text-white font-medium">${invoice.amount}</td>
                    <td className="px-6 py-4">
                      {invoice.status === 'paid' ? (
                        <span className="flex items-center gap-2 text-green-400">
                          <CheckCircleIcon className="w-4 h-4" />
                          Paid
                        </span>
                      ) : invoice.status === 'pending' ? (
                        <span className="text-yellow-400">Pending</span>
                      ) : (
                        <span className="flex items-center gap-2 text-red-400">
                          <XCircleIcon className="w-4 h-4" />
                          Failed
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{invoice.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 p-6 bg-blue-500/10 border border-blue-500/30 rounded-2xl"
      >
        <p className="text-blue-400 text-sm">
          <strong>Note:</strong> Invoice data will be automatically synced from Stripe once webhooks are fully configured. 
          To view complete billing history, visit your{' '}
          <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
            Stripe Dashboard
          </a>
        </p>
      </motion.div>
    </div>
  )
}
