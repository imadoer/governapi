export const PLANS = {
  free: {
    key: 'free',
    name: 'Free',
    priceId: null,
    price: 0,
    limits: {
      endpoints: 3,
      apiCalls: 10_000,
      scansPerMonth: 2,
      users: 1,
      dataRetention: 3 // days
    },
    features: [
      '3 APIs monitored',
      '10,000 API calls/month',
      '2 scans/month',
      'Basic vulnerability alerts',
      '3-day data retention',
      '1 user seat'
    ]
  },
  starter: {
    key: 'starter',
    name: 'Starter',
    priceId: process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || 'price_starter',
    price: 19,
    limits: {
      endpoints: 25,
      apiCalls: 100_000,
      scansPerMonth: 30, // Daily
      users: 2,
      dataRetention: 30
    },
    features: [
      '25 APIs monitored',
      '100,000 API calls/month',
      'Daily security scans',
      'Email alerts',
      '30-day data retention',
      '2 user seats',
      'Email support'
    ]
  },
  professional: {
    key: 'professional',
    name: 'Professional',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_professional',
    price: 49,
    limits: {
      endpoints: 200,
      apiCalls: 500_000,
      scansPerMonth: 1000, // Real-time
      users: 10,
      dataRetention: 90
    },
    features: [
      '200 APIs monitored',
      '500,000 API calls/month',
      'Real-time threat detection',
      'AI Security Assistant',
      'Slack/Teams/Webhook integration',
      'Compliance reports (SOC2, GDPR, HIPAA)',
      '90-day data retention',
      '10 user seats',
      'Priority support (24h response)'
    ]
  },
  enterprise: {
    key: 'enterprise',
    name: 'Enterprise',
    priceId: null, // Contact sales
    price: 0,
    limits: {
      endpoints: Infinity,
      apiCalls: Infinity,
      scansPerMonth: Infinity,
      users: Infinity,
      dataRetention: 730 // 2 years
    },
    features: [
      'Unlimited APIs',
      'Unlimited API calls',
      'AI-powered threat intelligence',
      'Custom policy engine',
      'Advanced analytics & reporting',
      'Full SIEM integration',
      'SSO / SAML authentication',
      'Dedicated customer success manager',
      '24x7 premium support',
      '2-year data retention',
      'On-premise deployment option',
      'Custom SLA'
    ]
  }
} as const;

export type PlanKey = keyof typeof PLANS;
