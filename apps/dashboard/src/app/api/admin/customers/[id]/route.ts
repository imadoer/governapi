import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/infrastructure/database'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const { id } = await params
    
    const customer = await database.queryOne(
      `SELECT 
        c.id,
        c.company_name as company,
        c.email as email,
        c.subscription_plan as plan,
        c.subscription_status as status,
        c.created_at as "joinDate",
        c.created_at as "lastActive",
        c.api_key as "apiKey",
        c.stripe_customer_id as "stripeCustomerId",
        CASE 
          WHEN c.subscription_plan = 'growth' THEN 49
          WHEN c.subscription_plan = 'pro' OR c.subscription_plan = 'professional' THEN 199
          ELSE 0
        END as "monthlyRevenue",
        (SELECT COUNT(*) FROM api_usage WHERE tenant_id = c.id AND timestamp >= date_trunc('month', CURRENT_DATE)) as "apiUsage"
       FROM companies c
       WHERE c.id = $1`,
      [id]
    )

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ customer })
  } catch (error) {
    console.error('Customer detail error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer' },
      { status: 500 }
    )
  }
}
