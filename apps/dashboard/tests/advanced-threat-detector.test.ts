import { AdvancedThreatDetector } from '../src/services/advanced-threat-detector'
import { cleanupTestData } from './test-helpers'

describe('AdvancedThreatDetector', () => {
  afterEach(async () => {
    await cleanupTestData()
  })

  test('service exists', () => {
    expect(typeof AdvancedThreatDetector.detectThreats).toBe('function')
  })
})
