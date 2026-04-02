'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldExclamationIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function BlockedUsers() {
  const [blockedUsers, setBlockedUsers] = useState([
    { id: 1, ip: '192.168.1.100', reason: 'Multiple failed login attempts', blockedAt: '2 hours ago' },
    { id: 2, ip: '10.0.0.45', reason: 'Suspicious API activity', blockedAt: '5 hours ago' },
    { id: 3, ip: '172.16.0.23', reason: 'Rate limit exceeded', blockedAt: '1 day ago' }
  ])

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold text-white mb-2">Blocked Users</h1>
        <p className="text-slate-400">Manage blocked IPs and suspicious activity</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">IP Address</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Reason</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Blocked</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {blockedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-mono text-white">{user.ip}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{user.reason}</td>
                  <td className="px-6 py-4 text-slate-400">{user.blockedAt}</td>
                  <td className="px-6 py-4">
                    <button className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/20 transition-all">
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
