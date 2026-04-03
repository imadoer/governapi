import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/infrastructure/database'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const result = await database.query(
      `SELECT 
        c.id,
        c.company_name as company,
        c.email as email,
        c.subscription_plan as plan,
        c.subscription_status as status,
        c.created_at as "joinDate",
        c.created_at as "lastActive",
        c.company_name as "contactName",
        CASE 
          WHEN c.subscription_plan = 'growth' THEN 49
          WHEN c.subscription_plan = 'pro' OR c.subscription_plan = 'professional' THEN 199
          ELSE 0
        END as "monthlyRevenue",
        0 as "apiUsage"
       FROM companies c
       ORDER BY c.created_at DESC`
    )

    const customers = Array.isArray(result) ? result : (result.rows || [])

    return NextResponse.json({
      customers: customers.map((c: any) => ({
        ...c,
        joinDate: c.joinDate?.toISOString?.() || c.joinDate,
        lastActive: c.lastActive?.toISOString?.() || c.lastActive
      }))
    })
  } catch (error) {
    console.error('Admin customers error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}
