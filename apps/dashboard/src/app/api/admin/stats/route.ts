import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/infrastructure/database'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    // Get total customers
    const customersResult = await database.queryOne(
      'SELECT COUNT(*) as total FROM companies'
    )
    
    // Get active customers (with active subscriptions)
    const activeCustomersResult = await database.queryOne(
      `SELECT COUNT(*) as total FROM companies 
       WHERE subscription_status = 'active'`
    )
    
    // Get total API calls this month
    const apiCallsResult = await database.queryOne(
      `SELECT COUNT(*) as total FROM api_usage 
       WHERE timestamp >= date_trunc('month', CURRENT_DATE)`
    )
    
    // Calculate monthly revenue (sum of subscription values)
    const revenueResult = await database.queryOne(
      `SELECT 
        SUM(CASE 
          WHEN subscription_plan = 'growth' THEN 49
          WHEN subscription_plan = 'pro' OR subscription_plan = 'professional' THEN 199
          ELSE 0
        END) as total
       FROM companies 
       WHERE subscription_status = 'active'`
    )
    
    // Get active threats count
    const threatsResult = await database.queryOne(
      `SELECT COUNT(*) as total FROM api_usage 
       WHERE status_code >= 400 
       AND timestamp >= NOW() - INTERVAL '24 hours'`
    )

    return NextResponse.json({
      systemStats: {
        totalCustomers: parseInt(customersResult?.total || '0'),
        activeCustomers: parseInt(activeCustomersResult?.total || '0'),
        totalApiCalls: parseInt(apiCallsResult?.total || '0'),
        monthlyRevenue: parseFloat(revenueResult?.total || '0'),
        systemUptime: 99.97, // This would come from monitoring service
        activeThreats: parseInt(threatsResult?.total || '0')
      }
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
