export const PLANS = {
  starter: {
    key: 'starter',
    name: 'Starter',
    priceId: null, // Free plan
    price: 0,
    limits: {
      endpoints: 10,
      apiCalls: 50_000,
      scansPerMonth: 4, // Weekly
      users: 1,
      dataRetention: 7 // days
    },
    features: [
      '10 APIs monitored',
      '50,000 API calls/month',
      'Weekly security scans',
      'Email alerts',
      '7-day data retention',
      '1 user seat',
      'Community support'
    ]
  },
  growth: {
    key: 'growth',
    name: 'Growth',
    priceId: 'price_1SITABRNg6lRSwWthYLgffLm', // Will replace after seeding
    price: 49,
    limits: {
      endpoints: 100,
      apiCalls: 250_000,
      scansPerMonth: 30, // Daily
      users: 3,
      dataRetention: 30
    },
    features: [
      '100 APIs monitored',
      '250,000 API calls/month',
      'Daily security scans',
      'Basic AI insights',
      'Email + Slack alerts',
      '30-day data retention',
      '3 user seats',
      'Email support (48h response)'
    ]
  },
  pro: {
    key: 'pro',
    name: 'Professional',
    priceId: 'price_1SITABRNg6lRSwWtX1tDD8lt', // Will replace after seeding
    price: 199,
    limits: {
      endpoints: 1000,
      apiCalls: 1_000_000,
      scansPerMonth: 1000, // Real-time
      users: 10,
      dataRetention: 90
    },
    features: [
      '1,000 APIs monitored',
      '1M API calls/month',
      'Real-time threat detection',
      'Full AI Security Assistant',
      'Advanced bot protection',
      'Compliance automation (SOC2, GDPR, HIPAA)',
      'Slack/Teams/Webhook integration',
      'Custom reporting',
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
      'Custom SLA',
      'Annual security review'
    ]
  }
} as const;

export type PlanKey = keyof typeof PLANS;
