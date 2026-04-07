import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { database } from '@/infrastructure/database';
import { PLANS } from '@/config/plans';

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2025-08-27.basil',
    });

    // Support both session-based and header-based auth
    const session = await getServerSession();
    const tenantId = request.headers.get('x-tenant-id');

    let email: string | null = session?.user?.email || null;
    let company: any = null;

    if (tenantId) {
      company = await database.queryOne(
        `SELECT c.id, c.company_name, c.stripe_customer_id, c.billing_email
         FROM companies c WHERE c.id = $1`,
        [tenantId]
      );
      if (company && !email) {
        const user = await database.queryOne(
          'SELECT email FROM users WHERE company_id = $1 LIMIT 1',
          [company.id]
        );
        email = user?.email || company.billing_email;
      }
    } else if (email) {
      company = await database.queryOne(
        `SELECT c.id, c.company_name, c.stripe_customer_id, c.billing_email
         FROM companies c
         JOIN users u ON u.company_id = c.id
         WHERE u.email = $1`,
        [email]
      );
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const body = await request.json();
    const planKey = body.planKey || body.planType;

    // Accept starter and professional plans
    if (!planKey || !['starter', 'professional'].includes(planKey)) {
      return NextResponse.json(
        { error: 'Invalid plan. Choose starter or professional.' },
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

    let customerId = company.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || company.billing_email,
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
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?billing=success`,
      cancel_url: `${baseUrl}/dashboard?billing=canceled`,
      metadata: {
        company_id: company.id.toString(),
        plan_key: planKey
      }
    });

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      checkout: { url: checkoutSession.url },
    });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
