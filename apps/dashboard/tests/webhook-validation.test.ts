import { validateStripeSignature } from '../src/utils/webhook-validation'
import * as crypto from 'crypto'

describe('Webhook Validation', () => {
  test('validates correct Stripe signatures', () => {
    const payload = '{"test": "data"}'
    const secret = 'test_webhook_secret'
    const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')

    const isValid = validateStripeSignature(payload, signature, secret)
    expect(isValid).toBe(true)
  })

  test('rejects invalid signatures', () => {
    const payload = '{"test": "data"}'
    const secret = 'test_webhook_secret'
    const invalidSignature = 'sha256=invalid_signature_here'

    const isValid = validateStripeSignature(payload, invalidSignature, secret)
    expect(isValid).toBe(false)
  })
})
