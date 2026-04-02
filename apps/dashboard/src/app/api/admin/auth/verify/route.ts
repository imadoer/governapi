import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentAdmin()

    if (!user) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: user.email,
        name: `${user.firstName} ${user.lastName}`
      }
    })
  } catch (error) {
    return NextResponse.json(
      { authenticated: false },
      { status: 401 }
    )
  }
}
