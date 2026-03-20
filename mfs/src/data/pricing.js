export const ANNUAL_DISCOUNT = 0.2;

export const PRICING_PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 19000,
    description: 'For small teams getting started',
    features: [
      '5 seats included',
      'NGN 4,000 per extra seat',
      'Work orders, assets, vendors',
      'Basic reporting',
      'Email support',
    ],
    seatsIncluded: 5,
    extraSeatPrice: 4000,
    popular: false,
  },
  {
    id: 'pro',
    name: 'Professional',
    monthly: 39000,
    description: 'Best for growing teams',
    features: [
      '10 seats included',
      'NGN 4,000 per extra seat',
      'Advanced reporting',
      'PM scheduling',
      'Notifications automation',
      'API access',
      'Priority support',
    ],
    seatsIncluded: 10,
    extraSeatPrice: 4000,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthly: 0,
    description: 'For large-scale operations',
    features: [
      'SSO & audit logs',
      'Advanced security controls',
      'Custom integrations',
      'Dedicated onboarding',
      'SLA support',
    ],
    seatsIncluded: 0,
    extraSeatPrice: 0,
    popular: false,
  },
];

export const getPlanById = (planId) =>
  PRICING_PLANS.find((plan) => plan.id === planId);

export const formatNgn = (amount) =>
  `NGN ${Number(amount || 0).toLocaleString('en-NG')}`;
