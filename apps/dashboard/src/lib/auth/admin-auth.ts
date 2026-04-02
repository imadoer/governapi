import { database } from '@/infrastructure/database'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const COOKIE_NAME = 'admin_session'

export interface AdminUser {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
}

// Verify admin credentials
export async function verifyAdminCredentials(email: string, password: string): Promise<AdminUser | null> {
  try {
    const user = await database.queryOne(
      `SELECT id, email, password_hash, first_name, last_name, role
       FROM users
       WHERE email = $1 AND role = 'admin'`,
      [email]
    )

    if (!user) {
      return null
    }

    // ✅ FIXED: Use bcrypt to compare password
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

// Create session token
export async function createAdminSession(userId: number): Promise<string> {
  const token = jwt.sign({ userId, role: 'admin' }, JWT_SECRET, {
    expiresIn: '7d'
  })

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await database.queryOne(
    `INSERT INTO admin_sessions (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (token) DO UPDATE SET expires_at = $3`,
    [userId, token, expiresAt]
  )

  return token
}

// Verify session token
export async function verifyAdminSession(token: string): Promise<AdminUser | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number, role: string }
    
    if (decoded.role !== 'admin') {
      return null
    }

    const session = await database.queryOne(
      `SELECT s.*, u.email, u.first_name, u.last_name, u.role
       FROM admin_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1 AND s.expires_at > NOW()`,
      [token]
    )

    if (!session) {
      return null
    }

    return {
      id: session.user_id,
      email: session.email,
      firstName: session.first_name,
      lastName: session.last_name,
      role: session.role
    }
  } catch (error) {
    return null
  }
}

// Get current admin user from cookies
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  
  if (!token) {
    return null
  }
  
  return verifyAdminSession(token)
}

// Delete session
export async function deleteAdminSession(token: string): Promise<void> {
  await database.queryOne(
    `DELETE FROM admin_sessions WHERE token = $1`,
    [token]
  )
}
