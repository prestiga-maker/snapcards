import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
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
    price: 2000, // $20.00 in cents
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

/**
 * The Stripe Price ID for the Pro monthly subscription.
 * Set in your Stripe Dashboard → Products → Pro Plan → Pricing.
 */
export const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
