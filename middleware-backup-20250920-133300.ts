import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimiter } from '@/lib/rate-limiter'

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return NextResponse.next()
  }

  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
  const userAgent = request.headers.get('user-agent') || ''
  const isAPIRoute = request.nextUrl.pathname.startsWith('/api/')

  // Internal system endpoints - always bypass
  const internalEndpoints = [
    '/api/threat-monitoring',
    '/api/threat-monitoring/save', 
    '/api/threat-monitoring/unblock',
    '/api/middleware/threat-check',
    '/api/security-events'
  ]
  
  if (internalEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
    return NextResponse.next()
  }

  // Rate limiting for API routes
  if (isAPIRoute) {
    const rateLimitResult = rateLimiter.isRateLimited(request)
    if (rateLimitResult.limited) {
      return NextResponse.json(
        { 
          error: 'Rate Limit Exceeded',
          message: `Too many requests. Try again in ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds.`
        },
        { status: 429 }
      )
    }
  }

  // Threat detection for API routes (except dashboard APIs)
  if (isAPIRoute) {
    const dashboardApis = [
      '/api/bot-detection',
      '/api/discovery', 
      '/api/analytics',
      '/api/rate-limit-config',
      '/api/security-scan',
      '/api/compliance',
      '/api/security-events',
      '/api/integrations',
      '/api/trends',
      '/api/reports',
      '/api/policies',
      '/api/proxy',
      '/api/notifications',
      '/api/alert-config',
      '/api/scheduled-scans',
      '/api/users',
      '/api/webhooks'
    ]
    
    const shouldBypassThreatDetection = dashboardApis.some(endpoint => 
      request.nextUrl.pathname.startsWith(endpoint)
    )
    
    if (!shouldBypassThreatDetection) {
      try {
        const threatResponse = await fetch('https://governapi.com/api/middleware/threat-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: request.nextUrl.toString(),
            userAgent,
            ip
          })
        })
        
        const threatResult = await threatResponse.json()
        
        if (threatResult.blocked) {
          return NextResponse.json(
            {
              error: 'Security Alert',
              message: 'Suspicious activity detected. Access temporarily restricted.',
              threatLevel: threatResult.threatLevel,
              blocked: true
            },
            { status: 403 }
          )
        }
      } catch (error) {
        console.error("SECURITY: Threat detection failed:", error)
      }
    }
  }

  // Authentication - allow dashboard APIs for authenticated users
  const token = await getToken({ req: request })

  if (isAPIRoute && !token) {
    const publicEndpoints = [
      '/api/threat-monitoring',
      '/api/threat-monitoring/save',
      '/api/threat-monitoring/unblock',
      '/api/middleware/threat-check',
      '/api/bot-detection',
      '/api/discovery',
      '/api/analytics',
      '/api/rate-limit-config',
      '/api/security-scan',
      '/api/compliance',
      '/api/security-events',
      '/api/integrations',
      '/api/trends',
      '/api/reports',
      '/api/policies',
      '/api/proxy',
      '/api/notifications',
      '/api/alert-config',
      '/api/scheduled-scans',
      '/api/users',
      '/api/webhooks',
      '/api/security-scan-results'
    ]
    
    if (!publicEndpoints.some(endpoint => request.nextUrl.pathname.startsWith(endpoint))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (request.nextUrl.pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/:path*']
}
