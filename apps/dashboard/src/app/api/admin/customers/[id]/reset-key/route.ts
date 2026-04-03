import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/infrastructure/database'
import crypto from 'crypto'
import { requireAdmin, isAuthError } from '@/lib/auth/require-admin'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin(request);
  if (isAuthError(authResult)) return authResult;

  try {
    const { id } = await context.params
    const newApiKey = 'sk_live_' + crypto.randomBytes(32).toString('hex')
    
    await database.queryOne(
      'UPDATE companies SET api_key = $1 WHERE id = $2',
      [newApiKey, id]
    )

    return NextResponse.json({ success: true, apiKey: newApiKey })
  } catch (error) {
    console.error('Reset key error:', error)
    return NextResponse.json({ error: 'Failed to reset key' }, { status: 500 })
  }
}
