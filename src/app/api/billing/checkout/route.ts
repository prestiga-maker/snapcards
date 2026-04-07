import { NextResponse } from 'next/server';
import { stripe, STRIPE_PRO_PRICE_ID } from '@/lib/stripe/config';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// POST: Create a Stripe Checkout Session for Pro upgrade
export async function POST() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  if (user.subscriptionTier === 'pro') {
    return NextResponse.json({ error: 'Already on Pro plan' }, { status: 400 });
  }

  // Find or create Stripe customer
  const existingSub = await prisma.subscription.findFirst({
    where: { userId: user.id, paymentProvider: 'stripe' },
  });

  let customerId: string | undefined;

  if (existingSub) {
    // Retrieve customer from existing subscription
    const stripeSub = await stripe.subscriptions.retrieve(existingSub.externalSubscriptionId);
    customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snap.cards';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    ...(customerId ? { customer: customerId } : { customer_email: user.email }),
    line_items: [{ price: STRIPE_PRO_PRICE_ID, quantity: 1 }],
    success_url: `${appUrl}/en/settings?billing=success`,
    cancel_url: `${appUrl}/en/settings?billing=canceled`,
    metadata: {
      userId: user.id.toString(),
    },
    subscription_data: {
      metadata: {
        userId: user.id.toString(),
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
