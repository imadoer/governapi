import Stripe from 'stripe';
import type { Stripe as StripeType } from 'stripe';
import { database } from '@/infrastructure/database';

// Lazy initialization - only create when needed
function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY environment variable is required");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
  });
}

export class StripeService {
  static async handleWebhook(rawBody: string, signature: string) {
    const stripe = getStripeClient();
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET environment variable is required");
    }
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    console.log(`Processing webhook: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutComplete(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private static async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const companyId = session.metadata?.company_id;
    const planKey = session.metadata?.plan_key;

    if (!companyId) return;

    await database.query(
      `UPDATE companies
       SET subscription_plan = $1,
           subscription_status = 'active',
           stripe_subscription_id = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [planKey, session.subscription, companyId]
    );

    console.log(`Checkout complete for company ${companyId}, plan: ${planKey}`);
  }

  private static async handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const companyId = subscription.metadata?.company_id;

    if (!companyId) {
      // Find company by customer ID
      const company = await database.queryOne(
        'SELECT id FROM companies WHERE stripe_customer_id = $1',
        [subscription.customer]
      );

      if (!company) return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    let planKey = 'starter';

    // Map price ID to plan
    if (priceId === 'price_1SITABRNg6lRSwWthYLgffLm') planKey = 'growth';
    if (priceId === 'price_1SITABRNg6lRSwWtX1tDD8lt') planKey = 'pro';

    await database.query(
      `UPDATE companies
       SET subscription_plan = $1,
           subscription_status = $2,
           stripe_subscription_id = $3,
           current_period_end = $4,
           cancel_at_period_end = $5,
           updated_at = NOW()
       WHERE stripe_customer_id = $6`,
      [
        planKey,
        subscription.status,
        subscription.id,
        new Date(((subscription as any).current_period_end ?? Date.now() / 1000) * 1000),
        subscription.cancel_at_period_end,
        subscription.customer
      ]
    );

    console.log(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    await database.query(
      `UPDATE companies
       SET subscription_plan = 'starter',
           subscription_status = 'canceled',
           updated_at = NOW()
       WHERE stripe_subscription_id = $1`,
      [subscription.id]
    );

    console.log(`Subscription canceled: ${subscription.id}`);
  }

  private static async handlePaymentSuccess(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded for invoice: ${invoice.id}`);
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    await database.query(
      `UPDATE companies
       SET subscription_status = 'past_due'
       WHERE stripe_customer_id = $1`,
      [invoice.customer]
    );

    console.log(`Payment failed for invoice: ${invoice.id}`);
  }
}
