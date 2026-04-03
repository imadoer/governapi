import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { database } from '@/infrastructure/database';
import { PLANS } from '@/config/plans';

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe inside handler to avoid build-time errors
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
    });

    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planKey } = await request.json();

    // Validate plan
    if (!planKey || !['growth', 'pro'].includes(planKey)) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose growth or pro.' },
        { status: 400 }
      );
    }

    const plan = PLANS[planKey as keyof typeof PLANS];

    if (!plan.priceId) {
      return NextResponse.json(
        { error: 'This plan requires contacting sales' },
        { status: 400 }
      );
    }

    // Get user's company
    const company = await database.queryOne(
      `SELECT c.id, c.company_name, c.stripe_customer_id, c.billing_email
       FROM companies c
       JOIN users u ON u.company_id = c.id
       WHERE u.email = $1`,
      [session.user.email]
    );

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    let customerId = company.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: company.billing_email || session.user.email,
        name: company.company_name,
        metadata: {
          company_id: company.id.toString()
        }
      });

      customerId = customer.id;

      await database.query(
        'UPDATE companies SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, company.id]
      );
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/customer/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/pricing?canceled=true`,
      metadata: {
        company_id: company.id.toString(),
        plan_key: planKey
      }
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
