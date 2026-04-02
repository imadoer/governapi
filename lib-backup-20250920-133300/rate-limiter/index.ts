import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
  blocked: boolean
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map()
  private config = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // requests per window
    blockDuration: 5 * 60 * 1000, // 5 minutes block
    skipSuccessfulRequests: false
  }

  getKey(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
    return `${ip}:${req.nextUrl.pathname}`
  }

  isRateLimited(req: NextRequest): { limited: boolean; resetTime?: number; remaining?: number } {
    const key = this.getKey(req)
    const now = Date.now()
    
    let entry = this.limits.get(key)
    
    // Clean up old entries
    if (entry && now > entry.resetTime) {
      entry = undefined
    }
    
    if (!entry) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
        blocked: false
      }
      this.limits.set(key, entry)
      return { limited: false, remaining: this.config.maxRequests - 1 }
    }
    
    // Check if currently blocked
    if (entry.blocked && now < entry.resetTime) {
      return { limited: true, resetTime: entry.resetTime }
    }
    
    // Increment counter
    entry.count++
    
    // Check if limit exceeded
    if (entry.count > this.config.maxRequests) {
      entry.blocked = true
      entry.resetTime = now + this.config.blockDuration
      
      // Log the rate limit event
      this.logRateLimit(req, entry)
      
      return { limited: true, resetTime: entry.resetTime }
    }
    
    return { limited: false, remaining: this.config.maxRequests - entry.count }
  }

  private async logRateLimit(req: NextRequest, entry: RateLimitEntry) {
    try {
      const { saveTrafficLog } = await import('@/lib/storage/filedb')
      const forwarded = req.headers.get('x-forwarded-for')
      const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
      
      await saveTrafficLog({
        ip,
        user_agent: req.headers.get('user-agent') || '',
        target_url: req.nextUrl.toString(),
        is_bot: true, // Rate limited requests are likely bots
        bot_confidence: 90,
        blocked: true,
        timestamp: new Date().toISOString(),
        rate_limited: true,
        request_count: entry.count
      })
    } catch (error) {
      console.error('Failed to log rate limit event:', error)
    }
  }

  updateConfig(newConfig: Partial<typeof this.config>) {
    this.config = { ...this.config, ...newConfig }
  }

  getStats() {
    const now = Date.now()
    const activeEntries = Array.from(this.limits.entries())
      .filter(([_, entry]) => now < entry.resetTime)
    
    return {
      totalActiveKeys: activeEntries.length,
      blockedKeys: activeEntries.filter(([_, entry]) => entry.blocked).length,
      config: this.config
    }
  }
}

export const rateLimiter = new RateLimiter()
