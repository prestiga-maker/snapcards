import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// POST: Create a Stripe Customer Portal session for managing subscription
export async function POST() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const sub = await prisma.subscription.findFirst({
    where: { userId: user.id, paymentProvider: 'stripe', status: { in: ['active', 'canceled'] } },
    orderBy: { createdAt: 'desc' },
  });

  if (!sub) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const stripeSub = await stripe.subscriptions.retrieve(sub.externalSubscriptionId);
  const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer.id;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://snap.cards';

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/en/settings`,
  });

  return NextResponse.json({ url: session.url });
}
