import { NextRequest, NextResponse } from 'next/server'
import { deleteAdminSession } from '@/lib/auth/admin-auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('admin_session')?.value

    if (token) {
      await deleteAdminSession(token)
    }

    cookieStore.delete('admin_session')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    )
  }
}
