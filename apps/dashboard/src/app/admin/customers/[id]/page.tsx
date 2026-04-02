'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

interface CustomerDetail {
  id: string
  company: string
  email: string
  plan: string
  status: string
  monthlyRevenue: number
  joinDate: string
  lastActive: string
  apiUsage: number
  apiKey?: string
  stripeCustomerId?: string
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [id, setId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [customer, setCustomer] = useState<CustomerDetail | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    console.log('1. Getting params...')
    params.then(p => {
      console.log('2. Params resolved:', p)
      setId(p.id)
    })
  }, [params])

  useEffect(() => {
    console.log('3. ID changed to:', id)
    if (id) {
      console.log('4. ID is valid, loading customer...')
      loadCustomer()
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadCustomer = async () => {
    console.log('5. loadCustomer called with id:', id)
    try {
      const url = `/api/admin/customers/${id}`
      console.log('6. Fetching from:', url)
      const response = await fetch(url)
      console.log('7. Response status:', response.status, response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('8. Received data:', data)
        console.log('9. Customer object:', data.customer)
        setCustomer(data.customer)
        console.log('10. Customer state set!')
      } else {
        console.error('Response not ok:', response.status)
      }
    } catch (error) {
      console.error('11. ERROR loading customer:', error)
    } finally {
      console.log('12. Setting loading to false')
      setLoading(false)
    }
  }

  const handleSuspend = async () => {
    if (!confirm('Are you sure you want to suspend this account?')) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/customers/${id}/suspend`, {
        method: 'POST'
      })
      if (response.ok) {
        alert('Account suspended successfully')
        loadCustomer()
      }
    } catch {
      alert('Failed to suspend account')
    } finally {
      setActionLoading(false)
    }
  }

  const handleActivate = async () => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/customers/${id}/activate`, {
        method: 'POST'
      })
      if (response.ok) {
        alert('Account activated successfully')
        loadCustomer()
      }
    } catch {
      alert('Failed to activate account')
    } finally {
      setActionLoading(false)
    }
  }

  const handleResetApiKey = async () => {
    if (!confirm('Are you sure you want to reset the API key?')) return
    
    setActionLoading(true)
    try {
      const response = await fetch(`/api/admin/customers/${id}/reset-key`, {
        method: 'POST'
      })
      if (response.ok) {
        alert('API key reset successfully')
        loadCustomer()
      }
    } catch {
      alert('Failed to reset API key')
    } finally {
      setActionLoading(false)
    }
  }

  console.log('RENDER - loading:', loading, 'customer:', customer ? 'HAS DATA' : 'NULL')

  if (loading) {
    console.log('Showing loading spinner')
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400" />
      </div>
    )
  }

  if (!customer) {
    console.log('Showing not found message')
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Customer not found</p>
        <Link href="/admin/customers" className="text-cyan-400 hover:text-cyan-300 mt-4 inline-block">
          ← Back to customers
        </Link>
      </div>
    )
  }

  console.log('Showing customer detail')

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <Link href="/admin/customers" className="flex items-center gap-2 text-slate-400 hover:text-white mb-4">
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Customers
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">{customer.company}</h1>
        <p className="text-slate-400">{customer.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Account Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Status</span>
              {customer.status === 'active' ? (
                <span className="flex items-center gap-2 text-green-400">
                  <CheckCircleIcon className="w-5 h-5" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-2 text-red-400">
                  <XCircleIcon className="w-5 h-5" />
                  Suspended
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Plan</span>
              <span className="text-white font-semibold capitalize">{customer.plan}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Monthly Revenue</span>
              <span className="text-white font-semibold">${customer.monthlyRevenue}</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>
          <div className="space-y-3">
            {customer.status === 'active' ? (
              <button
                onClick={handleSuspend}
                disabled={actionLoading}
                className="w-full px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-all disabled:opacity-50"
              >
                Suspend Account
              </button>
            ) : (
              <button
                onClick={handleActivate}
                disabled={actionLoading}
                className="w-full px-4 py-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl hover:bg-green-500/20 transition-all disabled:opacity-50"
              >
                Activate Account
              </button>
            )}
            <button
              onClick={handleResetApiKey}
              disabled={actionLoading}
              className="w-full px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 rounded-xl hover:bg-cyan-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Reset API Key
            </button>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8"
      >
        <h2 className="text-lg font-semibold text-white mb-4">Usage Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-slate-400 text-sm mb-1">API Calls This Month</p>
            <p className="text-2xl font-bold text-white">{customer.apiUsage?.toLocaleString() || 0}</p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Member Since</p>
            <p className="text-2xl font-bold text-white">
              {new Date(customer.joinDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-slate-400 text-sm mb-1">Last Active</p>
            <p className="text-2xl font-bold text-white">
              {new Date(customer.lastActive).toLocaleDateString()}
            </p>
          </div>
        </div>
      </motion.div>

      {customer.apiKey && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">API Credentials</h2>
          <div className="bg-slate-900/50 rounded-xl p-4 font-mono text-sm text-cyan-400 break-all">
            {customer.apiKey}
          </div>
        </motion.div>
      )}
    </div>
  )
}
