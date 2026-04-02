import { NextRequest, NextResponse } from 'next/server'
import { callGovernAI } from '@/lib/governai'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const reply = await callGovernAI(message)

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('AI query error:', error)
    return NextResponse.json(
      { error: 'Failed to process AI query' },
      { status: 500 }
    )
  }
}
