import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    // For now, return empty data
    // In production, this would fetch from Stripe
    return NextResponse.json({
      invoices: [],
      totalRevenue: 0,
      mrr: 0,
      outstanding: 0
    })
  } catch (error) {
    console.error('Billing error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch billing data' },
      { status: 500 }
    )
  }
}
