import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Stripe from 'stripe';
import { database } from '@/infrastructure/database';

export async function POST(request: NextRequest) {
  try {
    // Initialize Stripe inside handler to avoid build-time errors
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder", {
      apiVersion: '2025-08-27.basil',
    });

    const session = await getServerSession();
    const tenantId = request.headers.get('x-tenant-id');

    let company: any = null;

    if (tenantId) {
      company = await database.queryOne(
        `SELECT c.stripe_customer_id, c.id, c.company_name
         FROM companies c WHERE c.id = $1`,
        [tenantId]
      );
    } else if (session?.user?.email) {
      company = await database.queryOne(
        `SELECT c.stripe_customer_id, c.id, c.company_name
         FROM companies c
         JOIN users u ON u.company_id = c.id
         WHERE u.email = $1`,
        [session.user.email]
      );
    }

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const email = session?.user?.email || (await database.queryOne(
      'SELECT email FROM users WHERE company_id = $1 LIMIT 1', [company.id]
    ))?.email;

    let customerId = company.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: email || 'unknown@governapi.com',
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
      return_url: `${process.env.NEXTAUTH_URL || 'https://governapi.com'}/dashboard`,
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
