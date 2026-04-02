import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-08-27.basil'
})

export async function POST(request: NextRequest) {
  try {
    const { customerName, customerEmail, priceId } = await request.json()
    console.log("Stripe API received priceId:", priceId)
    
    const customer = await stripe.customers.create({
      name: customerName,
      email: customerEmail
    })
    
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }]
    })
    
    console.log("Customer created:", customer.id)
    console.log("Subscription created:", subscription.id)
    
    return NextResponse.json({
      success: true,
      customerId: customer.id,
      subscriptionId: subscription.id
    })
    
  } catch (error) {
    console.error('Stripe error:', error)
    return NextResponse.json({ 
      error: 'Billing setup failed' 
    }, { status: 500 })
  }
}
