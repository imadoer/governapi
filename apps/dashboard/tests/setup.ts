import { database } from '../src/infrastructure/database'

beforeAll(async () => {
  // process.env.NODE_ENV = 'test'
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL
  process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret'
  process.env.NEXTAUTH_SECRET = 'test_nextauth_secret'
})

afterAll(async () => {
  // Database cleanup handled by process exit
})
