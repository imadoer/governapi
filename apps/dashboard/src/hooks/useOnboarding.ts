'use client'

import { useEffect, useState } from 'react'

export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    const hasCompleted = localStorage.getItem('onboarding-completed')
    const isFirstLogin = localStorage.getItem('first-login')
    
    if (!hasCompleted && isFirstLogin !== 'false') {
      setShouldShow(true)
    }
  }, [])

  const markComplete = () => {
    localStorage.setItem('onboarding-completed', 'true')
    setShouldShow(false)
  }

  const resetOnboarding = () => {
    localStorage.removeItem('onboarding-completed')
    localStorage.removeItem('first-login')
    setShouldShow(true)
  }

  return {
    shouldShow,
    markComplete,
    resetOnboarding
  }
}
