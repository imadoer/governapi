import { validateEnvironment } from '../src/utils/env-validation'

describe('Environment Validation', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
  })

  afterEach(() => {
    process.env = originalEnv
  })

  test('validates required environment variables', () => {
    // process.env.NODE_ENV = 'test'
    process.env.STRIPE_WEBHOOK_SECRET = 'test-secret'
    process.env.DATABASE_URL = 'test-db-url'
    process.env.NEXTAUTH_SECRET = 'test-auth-secret'

    expect(() => validateEnvironment()).not.toThrow()
  })

  test('throws error for missing variables', () => {
    delete process.env.STRIPE_WEBHOOK_SECRET

    expect(() => validateEnvironment()).toThrow('Missing required environment variables')
  })
})
