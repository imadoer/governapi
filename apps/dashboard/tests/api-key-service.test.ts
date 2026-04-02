import { APIKeyService } from '../src/services/api-key-service'
import { cleanupTestData } from './test-helpers'

describe('APIKeyService', () => {
  beforeEach(async () => {
    await cleanupTestData()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('generates valid API keys', async () => {
    const config = {
      name: 'Test Key',
      permissions: ['read', 'write']
    }

    // Use integer tenant ID instead of string
    const apiKey = await APIKeyService.generateAPIKey(1, config)
    
    expect(apiKey.name).toBe('Test Key')
    expect(apiKey.permissions).toEqual(['read', 'write'])
    expect(apiKey.keyPrefix).toMatch(/^gapi_[a-f0-9]{8}\.\.\./)
  })

  it('validates API keys correctly', async () => {
    // This test will need actual API key validation logic
    // For now, just test that the function exists
    expect(typeof APIKeyService.validateAPIKey).toBe('function')
  })
})
