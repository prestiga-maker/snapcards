import Stripe from 'stripe';

let _stripeInstance: Stripe | undefined;

function getStripeInstance(): Stripe {
  if (!_stripeInstance) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY environment variable');
    _stripeInstance = new Stripe(key, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    });
  }
  return _stripeInstance;
}

// Lazy proxy — Stripe client is only instantiated on first access, not at build time
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    return (getStripeInstance() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      businessPages: 1,
      customDomain: false,
      chatbot: false,
      analytics: false,
      leadsExport: false,
    },
  },
  pro: {
    name: 'Pro',
    price: 2000,
    limits: {
      businessPages: 10,
      customDomain: true,
      chatbot: true,
      analytics: true,
      leadsExport: true,
    },
  },
} as const;

export type PlanId = keyof typeof PLANS;

export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
