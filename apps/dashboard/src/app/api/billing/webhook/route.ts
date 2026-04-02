import { NextRequest, NextResponse } from 'next/server'
import { StripeService } from '@/services/stripe-service'
import { NotificationService } from '@/lib/notifications'
import { database } from '@/infrastructure/database'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    // Process webhook through Stripe service
    await StripeService.handleWebhook(body, signature)

    // Additional notification handling
    const event = JSON.parse(body)
    
    if (event.type === 'invoice.payment_failed') {
      const invoice = event.data.object
      const customerId = invoice.customer

      // Get company and user details
      const company = await database.queryOne(
        `SELECT c.id, c.company_name, u.email, u.full_name
         FROM companies c
         JOIN users u ON u.company_id = c.id
         WHERE c.stripe_customer_id = $1
         LIMIT 1`,
        [customerId]
      )

      if (company) {
        await NotificationService.notifyPaymentFailed(
          company.email,
          company.full_name || company.company_name,
          invoice.hosted_invoice_url
        )
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
