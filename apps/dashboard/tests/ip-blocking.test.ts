import { isIPBlocked, blockIP } from '../src/utils/ip-blocking'
import { cleanupTestData } from './test-helpers'

describe('IP Blocking', () => {
  const testTenantId = 1
  const testIP = '192.168.1.201'

  afterEach(async () => {
    await cleanupTestData()
  })

  test('blocks and checks IPs correctly', async () => {
    let blocked = await isIPBlocked(testTenantId, testIP)
    expect(blocked).toBe(false)

    await blockIP(testTenantId, testIP, 'Test block', 10)
    
    blocked = await isIPBlocked(testTenantId, testIP)
    expect(blocked).toBe(true)
  })
})
