import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/infrastructure/database'

export async function GET(request: NextRequest) {
  try {
    // Calculate MRR (Monthly Recurring Revenue)
    const mrrResult = await database.queryOne(
      `SELECT 
        SUM(CASE 
          WHEN subscription_plan = 'growth' THEN 49
          WHEN subscription_plan = 'pro' OR subscription_plan = 'professional' THEN 199
          ELSE 0
        END) as total
       FROM companies 
       WHERE subscription_status = 'active'`
    )

    const mrr = parseFloat(mrrResult?.total || '0')
    const arr = mrr * 12

    return NextResponse.json({
      today: 0, // Would need payment tracking
      week: 0,
      month: mrr,
      year: arr,
      mrr: mrr,
      arr: arr
    })
  } catch (error) {
    console.error('Admin revenue error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch revenue' },
      { status: 500 }
    )
  }
}
