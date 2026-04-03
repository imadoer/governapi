import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { database } from '@/infrastructure/database';

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

    // Get user's company and Stripe customer ID
    const company = await database.queryOne(
      `SELECT c.stripe_customer_id, c.id, c.company_name
       FROM companies c
       JOIN users u ON u.company_id = c.id
       WHERE u.email = $1`,
      [session.user.email]
    );

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    let customerId = company.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          company_id: company.id.toString(),
          company_name: company.company_name
        }
      });

      customerId = customer.id;

      // Save to database
      await database.query(
        'UPDATE companies SET stripe_customer_id = $1 WHERE id = $2',
        [customerId, company.id]
      );
    }

    // Create billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.NEXTAUTH_URL}/customer/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
