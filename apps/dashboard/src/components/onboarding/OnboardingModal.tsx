'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  XMarkIcon,
  KeyIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface OnboardingStep {
  id: number
  title: string
  description: string
  icon: typeof KeyIcon
  action?: string
  completed?: boolean
}

export default function OnboardingModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: 'Generate Your API Key',
      description: 'Create your first API key to authenticate requests. This key will give you secure access to all GovernAPI features.',
      icon: KeyIcon,
      action: 'Go to API Keys'
    },
    {
      id: 2,
      title: 'Run Your First Scan',
      description: 'Launch a security scan to analyze your APIs for vulnerabilities, compliance issues, and potential threats.',
      icon: MagnifyingGlassIcon,
      action: 'Start Security Scan'
    },
    {
      id: 3,
      title: 'Explore Your Dashboard',
      description: 'View real-time insights, threat detection, compliance status, and API performance metrics all in one place.',
      icon: ChartBarIcon,
      action: 'View Dashboard'
    }
  ]

  useEffect(() => {
    // Check if onboarding has been completed
    const hasCompleted = localStorage.getItem('onboarding-completed')
    const isFirstLogin = localStorage.getItem('first-login')
    
    // Show modal on first login only
    if (!hasCompleted && isFirstLogin !== 'false') {
      setIsOpen(true)
      localStorage.setItem('first-login', 'true')
    }
  }, [])

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps([...completedSteps, currentStep])
      setCurrentStep(currentStep + 1)
    }
  }

  const handleComplete = () => {
    setCompletedSteps([...completedSteps, currentStep])
    localStorage.setItem('onboarding-completed', 'true')
    setIsOpen(false)
  }

  const handleSkip = () => {
    localStorage.setItem('onboarding-completed', 'true')
    setIsOpen(false)
  }

  const handleStepAction = () => {
    const step = steps[currentStep]
    
    // Mark step as completed
    setCompletedSteps([...completedSteps, currentStep])
    
    // Navigate based on step
    switch (step.id) {
      case 1:
        window.location.href = '/dashboard/api-keys'
        break
      case 2:
        window.location.href = '/dashboard/security'
        break
      case 3:
        window.location.href = '/dashboard'
        break
    }
    
    localStorage.setItem('onboarding-completed', 'true')
    setIsOpen(false)
  }

  const currentStepData = steps[currentStep]
  const Icon = currentStepData.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleSkip}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div 
              className="bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative p-8 pb-6 border-b border-white/10">
                <button
                  onClick={handleSkip}
                  className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Welcome to GovernAPI!</h2>
                    <p className="text-slate-400">Let's get you started in 3 quick steps</p>
                  </div>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="flex-1">
                        <div className={`h-2 rounded-full transition-all ${
                          index <= currentStep 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600' 
                            : 'bg-slate-700'
                        }`} />
                      </div>
                      {index < steps.length - 1 && (
                        <div className="w-2" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8"
                >
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-10 h-10 text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-white">{currentStepData.title}</h3>
                        {completedSteps.includes(currentStep) && (
                          <CheckCircleIcon className="w-6 h-6 text-green-400" />
                        )}
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {currentStepData.description}
                      </p>
                    </div>
                  </div>

                  {/* Step-specific content */}
                  <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-6 mb-6">
                    {currentStep === 0 && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-cyan-400 text-sm font-bold">1</span>
                          </div>
                          <div>
                            <p className="text-white font-medium mb-1">Navigate to API Keys</p>
                            <p className="text-slate-400 text-sm">Find the API Keys section in your dashboard</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-cyan-400 text-sm font-bold">2</span>
                          </div>
                          <div>
                            <p className="text-white font-medium mb-1">Create New Key</p>
                            <p className="text-slate-400 text-sm">Click "Generate API Key" and set permissions</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-cyan-400 text-sm font-bold">3</span>
                          </div>
                          <div>
                            <p className="text-white font-medium mb-1">Save Securely</p>
                            <p className="text-slate-400 text-sm">Copy and store your key - it won't be shown again</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-cyan-400 text-sm font-bold">1</span>
                          </div>
                          <div>
                            <p className="text-white font-medium mb-1">Go to Security Scans</p>
                            <p className="text-slate-400 text-sm">Access the security scanning dashboard</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-cyan-400 text-sm font-bold">2</span>
                          </div>
                          <div>
                            <p className="text-white font-medium mb-1">Configure Scan</p>
                            <p className="text-slate-400 text-sm">Select your API endpoint and scan depth</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-cyan-400 text-sm font-bold">3</span>
                          </div>
                          <div>
                            <p className="text-white font-medium mb-1">Review Results</p>
                            <p className="text-slate-400 text-sm">Get instant insights on vulnerabilities and compliance</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                            <p className="text-cyan-400 text-2xl font-bold mb-1">Real-time</p>
                            <p className="text-slate-400 text-sm">Threat Detection</p>
                          </div>
                          <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                            <p className="text-green-400 text-2xl font-bold mb-1">99.9%</p>
                            <p className="text-slate-400 text-sm">Uptime SLA</p>
                          </div>
                          <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                            <p className="text-purple-400 text-2xl font-bold mb-1">AI-Powered</p>
                            <p className="text-slate-400 text-sm">Insights</p>
                          </div>
                          <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5">
                            <p className="text-blue-400 text-2xl font-bold mb-1">Compliance</p>
                            <p className="text-slate-400 text-sm">Monitoring</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={handleSkip}
                      className="text-slate-400 hover:text-white transition-colors font-medium"
                    >
                      Skip for now
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 text-sm">
                        Step {currentStep + 1} of {steps.length}
                      </span>
                      
                      {currentStep < steps.length - 1 ? (
                        <button
                          onClick={handleNext}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all"
                        >
                          Next Step
                          <ArrowRightIcon className="w-5 h-5" />
                        </button>
                      ) : (
                        <button
                          onClick={handleComplete}
                          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all"
                        >
                          <CheckCircleIcon className="w-5 h-5" />
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Action Button */}
                  {currentStepData.action && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <button
                        onClick={handleStepAction}
                        className="w-full px-6 py-3 border border-cyan-500/30 text-cyan-400 rounded-xl font-semibold hover:bg-cyan-500/10 transition-all"
                      >
                        {currentStepData.action} →
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
