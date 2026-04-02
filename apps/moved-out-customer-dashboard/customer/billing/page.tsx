'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCardIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { PLANS } from '@/config/plans'

export default function BillingPage() {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [usage, setUsage] = useState<any>(null)

  useEffect(() => {
    fetchBillingData()
  }, [])

  async function fetchBillingData() {
    try {
      const response = await fetch('/api/customer/billing')
      const data = await response.json()
      setSubscription(data.subscription)
      setUsage(data.usage)
    } catch (error) {
      console.error('Failed to fetch billing data:', error)
    }
  }

  async function handleManageBilling() {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to open portal:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(planKey: string) {
    setLoading(true)
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planKey })
      })
      const data = await response.json()
      
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Failed to start checkout:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = subscription?.plan || 'starter'
  const plan = PLANS[currentPlan as keyof typeof PLANS]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Billing & Usage</h1>
          <p className="text-slate-400">Manage your subscription and track usage</p>
        </div>

        {/* Current Plan Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Current Plan: {plan?.name}</h2>
              <p className="text-slate-400">
                {subscription?.status === 'active' ? (
                  <span className="flex items-center gap-2">
                    <CheckCircleIcon className="w-5 h-5 text-green-400" />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 text-red-400" />
                    {subscription?.status || 'Free'}
                  </span>
                )}
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-white">${plan?.price}</p>
              <p className="text-slate-400">/month</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-1">API Calls</p>
              <p className="text-2xl font-bold text-white">
                {usage?.apiCalls?.toLocaleString() || 0}
              </p>
              <p className="text-xs text-slate-500">
                of {plan?.limits.apiCalls === Infinity ? '∞' : plan?.limits.apiCalls.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-1">APIs Monitored</p>
              <p className="text-2xl font-bold text-white">
                {usage?.endpoints || 0}
              </p>
              <p className="text-xs text-slate-500">
                of {plan?.limits.endpoints === Infinity ? '∞' : plan?.limits.endpoints}
              </p>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4">
              <p className="text-slate-400 text-sm mb-1">Users</p>
              <p className="text-2xl font-bold text-white">
                {usage?.users || 1}
              </p>
              <p className="text-xs text-slate-500">
                of {plan?.limits.users === Infinity ? '∞' : plan?.limits.users}
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            {currentPlan === 'starter' && (
              <>
                <button
                  onClick={() => handleUpgrade('growth')}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50"
                >
                  Upgrade to Growth - $49/mo
                </button>
                <button
                  onClick={() => handleUpgrade('pro')}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-600 hover:to-purple-600 transition-all disabled:opacity-50"
                >
                  Upgrade to Pro - $199/mo
                </button>
              </>
            )}

            {currentPlan === 'growth' && (
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white px-6 py-3 rounded-xl font-semibold hover:from-violet-600 hover:to-purple-600 transition-all disabled:opacity-50"
              >
                Upgrade to Professional - $199/mo
              </button>
            )}

            {['growth', 'pro'].includes(currentPlan) && (
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="px-6 py-3 border border-white/20 text-white rounded-xl font-semibold hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <CreditCardIcon className="w-5 h-5 inline mr-2" />
                Manage Billing
              </button>
            )}
          </div>
        </motion.div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
        >
          <h3 className="text-xl font-bold text-white mb-4">Your Plan Includes</h3>
          <div className="grid grid-cols-2 gap-4">
            {plan?.features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
