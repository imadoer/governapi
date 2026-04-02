'use client'

import { motion } from 'framer-motion'

export default function AdminSettings() {
  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Settings</h1>
        <p className="text-slate-400">System configuration and preferences</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8"
      >
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-300 mb-2">Site Name</label>
                <input
                  type="text"
                  defaultValue="GovernAPI"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-2">Support Email</label>
                <input
                  type="email"
                  defaultValue="support@governapi.com"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <span className="text-slate-300">Enable two-factor authentication</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5" defaultChecked />
                <span className="text-slate-300">Require password reset every 90 days</span>
              </label>
            </div>
          </div>

          <div className="pt-6">
            <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
