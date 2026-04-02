import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/infrastructure/database';
import { withinLimit } from '@/lib/limits';
import { PLANS } from '@/config/plans';

export async function enforceUsageLimits(
  request: NextRequest,
  companyId: number,
  subscriptionPlan: string
) {
  try {
    // Get current month usage
    const usage = await database.queryOne(
      `SELECT 
        COUNT(*) as api_calls,
        COUNT(DISTINCT endpoint) as endpoints_count
       FROM api_usage
       WHERE tenant_id = $1 
       AND timestamp >= date_trunc('month', CURRENT_DATE)`,
      [companyId]
    );

    const currentUsage = {
      apiCalls: parseInt(usage?.api_calls || '0'),
      endpointsCount: parseInt(usage?.endpoints_count || '0')
    };

    const limits = withinLimit(subscriptionPlan as any, currentUsage);

    // Check if limits exceeded
    if (!limits.apiCalls) {
      return NextResponse.json(
        {
          error: 'API call limit exceeded',
          message: `You've reached your monthly limit. Upgrade to ${subscriptionPlan === 'starter' ? 'Growth' : 'Professional'} plan.`,
          upgrade_url: '/pricing'
        },
        { status: 429 }
      );
    }

    if (!limits.endpoints) {
      return NextResponse.json(
        {
          error: 'Endpoint limit exceeded',
          message: `You've reached your API endpoint limit. Upgrade to get more.`,
          upgrade_url: '/pricing'
        },
        { status: 429 }
      );
    }

    // Add usage headers
    const response = NextResponse.next();
    const plan = PLANS[subscriptionPlan as keyof typeof PLANS] || PLANS.starter;
    
    response.headers.set('X-RateLimit-Limit', plan.limits.apiCalls.toString());
    response.headers.set('X-RateLimit-Remaining', (plan.limits.apiCalls - currentUsage.apiCalls).toString());
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

    return response;
  } catch (error) {
    console.error('Usage enforcement error:', error);
    // Fail open - don't block on errors
    return NextResponse.next();
  }
}
