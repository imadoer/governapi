import Stripe from 'stripe';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env.local') });

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found in .env.local');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
});

async function seedPlans() {
  console.log('🌱 Seeding 4-Tier Stripe products...\n');

  try {
    // 1. Starter (Free) - No price needed
    console.log('📦 Creating Starter product (FREE)...');
    const starterProduct = await stripe.products.create({
      name: 'Starter',
      description: 'Perfect for indie developers and side projects',
      metadata: {
        plan_key: 'starter',
        endpoints: '10',
        api_calls: '50000',
        users: '1'
      }
    });
    console.log(`✅ Starter Product ID: ${starterProduct.id}\n`);

    // 2. Growth ($49/month)
    console.log('📦 Creating Growth product...');
    const growthProduct = await stripe.products.create({
      name: 'Growth',
      description: 'Ideal for growing startups and small teams',
      metadata: {
        plan_key: 'growth',
        endpoints: '100',
        api_calls: '250000',
        users: '3'
      }
    });

    const growthPrice = await stripe.prices.create({
      product: growthProduct.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_key: 'growth'
      }
    });
    console.log(`✅ Growth Product ID: ${growthProduct.id}`);
    console.log(`✅ Growth Price ID: ${growthPrice.id}`);
    console.log(`💡 Add to plans.ts: growth: { priceId: '${growthPrice.id}' }\n`);

    // 3. Professional ($199/month)
    console.log('📦 Creating Professional product...');
    const proProduct = await stripe.products.create({
      name: 'Professional',
      description: 'For scale-ups and mid-market companies',
      metadata: {
        plan_key: 'pro',
        endpoints: '1000',
        api_calls: '1000000',
        users: '10'
      }
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 19900, // $199.00
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_key: 'pro'
      }
    });
    console.log(`✅ Professional Product ID: ${proProduct.id}`);
    console.log(`✅ Professional Price ID: ${proPrice.id}`);
    console.log(`💡 Add to plans.ts: pro: { priceId: '${proPrice.id}' }\n`);

    // 4. Enterprise (Contact Sales) - No price
    console.log('📦 Creating Enterprise product (Contact Sales)...');
    const entProduct = await stripe.products.create({
      name: 'Enterprise',
      description: 'For Fortune 500 and regulated industries',
      metadata: {
        plan_key: 'enterprise',
        endpoints: 'unlimited',
        api_calls: 'unlimited',
        users: 'unlimited'
      }
    });
    console.log(`✅ Enterprise Product ID: ${entProduct.id}\n`);

    console.log('🎉 4-Tier Structure Complete!\n');
    console.log('📋 NEXT STEPS:');
    console.log('1. Update src/config/plans.ts with these price IDs:');
    console.log(`   growth: { priceId: '${growthPrice.id}' }`);
    console.log(`   pro: { priceId: '${proPrice.id}' }`);
    console.log('2. Update src/app/api/customer/verify/route.ts with new tiers');
    console.log('3. Test checkout: http://localhost:3000/pricing');
    console.log('4. Test card: 4242 4242 4242 4242\n');

  } catch (error) {
    console.error('❌ Error seeding plans:', error);
    process.exit(1);
  }
}

seedPlans();
