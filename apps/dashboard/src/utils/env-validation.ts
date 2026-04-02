/**
 * Environment variable validation
 */

const requiredEnvVars = {
  server: [
    'DATABASE_URL',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
  ],
  client: []
}

// Export ENV object for other files
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
}

export function validateEnvironment() {
  if (typeof window !== 'undefined') {
    return // Skip on client
  }

  const missing: string[] = []

  for (const key of requiredEnvVars.server) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing environment variables: ${missing.join(", ")}`
    )
  }
}

// Auto-validate
if (typeof window === 'undefined') {
  validateEnvironment()
}
