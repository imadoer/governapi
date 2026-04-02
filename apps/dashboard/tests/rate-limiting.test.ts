import { checkRateLimit, logRequest } from '../src/utils/rate-limiting'
import { cleanupTestData } from './test-helpers'

describe('Rate Limiting', () => {
  const testTenantId = 'test-tenant-rate'
  const testIP = '192.168.1.200'

  afterEach(async () => {
    await cleanupTestData()
  })

  test('allows requests under limit', async () => {
    const result = await checkRateLimit(testTenantId, testIP)
    
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBeGreaterThan(0)
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })

  test('logs requests correctly', async () => {
    await expect(
      logRequest(testTenantId, testIP, '/api/test', 'GET')
    ).resolves.not.toThrow()
  })
})
