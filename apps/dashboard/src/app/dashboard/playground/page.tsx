'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  PlayIcon,
  ClipboardDocumentIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CodeBracketIcon
} from '@heroicons/react/24/outline'

interface RequestHistory {
  id: string
  endpoint: string
  method: string
  timestamp: number
  status?: number
}

export default function PlaygroundPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/customer/security-scans')
  const [method, setMethod] = useState('GET')
  const [requestBody, setRequestBody] = useState('{\n  \n}')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<number | null>(null)
  const [history, setHistory] = useState<RequestHistory[]>([])
  const [copied, setCopied] = useState(false)
  const [apiKey] = useState('sk_test_demo_key_1234567890') // Would come from session

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('playground-history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load history:', e)
      }
    }
  }, [])

  // Save history to localStorage
  const saveToHistory = (endpoint: string, method: string, status?: number) => {
    const newHistory: RequestHistory[] = [
      {
        id: Date.now().toString(),
        endpoint,
        method,
        timestamp: Date.now(),
        status
      },
      ...history.slice(0, 4)
    ]
    setHistory(newHistory)
    localStorage.setItem('playground-history', JSON.stringify(newHistory))
  }

  const endpoints = [
    { path: '/api/customer/security-scans', method: 'GET', description: 'Get security scans' },
    { path: '/api/customer/security-scans', method: 'POST', description: 'Create security scan' },
    { path: '/api/customer/threat-detection', method: 'GET', description: 'Get threat detection data' },
    { path: '/api/customer/api-endpoints', method: 'GET', description: 'List API endpoints' },
    { path: '/api/customer/compliance', method: 'GET', description: 'Get compliance status' },
    { path: '/api/customer/api-keys', method: 'GET', description: 'List API keys' },
    { path: '/api/customer/api-keys', method: 'POST', description: 'Create API key' },
    { path: '/api/customer/webhooks', method: 'GET', description: 'List webhooks' },
    { path: '/api/customer/rate-limits', method: 'GET', description: 'Get rate limits' },
  ]

  const handleExecute = async () => {
    setLoading(true)
    setResponse('')
    setStatus(null)

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      }

      if (method !== 'GET' && requestBody.trim()) {
        options.body = requestBody
      }

      const res = await fetch(selectedEndpoint, options)
      const data = await res.json()
      
      setStatus(res.status)
      setResponse(JSON.stringify(data, null, 2))
      saveToHistory(selectedEndpoint, method, res.status)
    } catch (error) {
      setStatus(500)
      setResponse(JSON.stringify({ 
        error: 'Request failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      }, null, 2))
      saveToHistory(selectedEndpoint, method, 500)
    } finally {
      setLoading(false)
    }
  }

  const generateCurl = () => {
    let curl = `curl -X ${method} \\\n`
    curl += `  '${window.location.origin}${selectedEndpoint}' \\\n`
    curl += `  -H 'Content-Type: application/json' \\\n`
    curl += `  -H 'x-api-key: ${apiKey}'`
    
    if (method !== 'GET' && requestBody.trim()) {
      curl += ` \\\n  -d '${requestBody.replace(/\n/g, '').replace(/\s+/g, ' ')}'`
    }
    
    return curl
  }

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurl())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const loadFromHistory = (item: RequestHistory) => {
    setSelectedEndpoint(item.endpoint)
    setMethod(item.method)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <CodeBracketIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">API Playground</h1>
              <p className="text-slate-400">Test your API endpoints interactively</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* History Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <ClockIcon className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-white">Recent Requests</h3>
              </div>
              
              {history.length === 0 ? (
                <p className="text-slate-500 text-sm">No requests yet</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      className="w-full p-3 bg-slate-900/50 border border-white/5 rounded-lg hover:border-white/10 transition-all text-left"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono text-purple-400">{item.method}</span>
                        {item.status && (
                          <span className={`text-xs ${
                            item.status < 300 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 truncate">{item.endpoint}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Main Panel */}
          <div className="lg:col-span-3 space-y-6">
            {/* Request Configuration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
            >
              <h3 className="font-semibold text-white mb-4">Request Configuration</h3>
              
              {/* Endpoint Selector */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="col-span-1">
                  <label className="block text-sm text-slate-400 mb-2">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="block text-sm text-slate-400 mb-2">Endpoint</label>
                  <select
                    value={selectedEndpoint}
                    onChange={(e) => setSelectedEndpoint(e.target.value)}
                    className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {endpoints.map((ep) => (
                      <option key={`${ep.method}-${ep.path}`} value={ep.path}>
                        {ep.method} {ep.path} - {ep.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Request Body */}
              {method !== 'GET' && (
                <div className="mb-4">
                  <label className="block text-sm text-slate-400 mb-2">Request Body (JSON)</label>
                  <textarea
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    className="w-full h-32 bg-slate-900/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder='{\n  "key": "value"\n}'
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button
                  onClick={handleExecute}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50"
                >
                  <PlayIcon className="w-5 h-5" />
                  {loading ? 'Executing...' : 'Execute Request'}
                </button>

                <button
                  onClick={copyCurl}
                  className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white rounded-xl font-semibold hover:bg-white/5 transition-all"
                >
                  {copied ? (
                    <>
                      <CheckCircleIcon className="w-5 h-5 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <ClipboardDocumentIcon className="w-5 h-5" />
                      Copy as cURL
                    </>
                  )}
                </button>
              </div>
            </motion.div>

            {/* Response Panel */}
            <AnimatePresence>
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-white">Response</h3>
                    {status && (
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${
                        status < 300 
                          ? 'bg-green-500/20 border border-green-500/30' 
                          : 'bg-red-500/20 border border-red-500/30'
                      }`}>
                        {status < 300 ? (
                          <CheckCircleIcon className="w-4 h-4 text-green-400" />
                        ) : (
                          <XCircleIcon className="w-4 h-4 text-red-400" />
                        )}
                        <span className={status < 300 ? 'text-green-400' : 'text-red-400'}>
                          {status}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <pre className="bg-slate-900/50 border border-white/10 rounded-lg p-4 text-sm text-slate-300 font-mono overflow-x-auto max-h-96 overflow-y-auto">
                    {response}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
