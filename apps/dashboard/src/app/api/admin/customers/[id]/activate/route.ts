import { NextRequest, NextResponse } from 'next/server'
import { database } from '@/infrastructure/database'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    
    await database.queryOne(
      'UPDATE companies SET subscription_status = $1 WHERE id = $2',
      ['active', id]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Activate error:', error)
    return NextResponse.json({ error: 'Failed to activate' }, { status: 500 })
  }
}
