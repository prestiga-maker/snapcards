import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/config';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// In Stripe v22, current_period fields moved to items.
// The raw webhook payload still includes them at the subscription level,
// so we extract them from the first item or fall back to now/+30d.
function getPeriodDates(subscription: Stripe.Subscription) {
  const item = subscription.items?.data?.[0];
  if (item) {
    return {
      start: new Date(item.current_period_start * 1000),
      end: new Date(item.current_period_end * 1000),
    };
  }
  // Fallback
  return {
    start: new Date(),
    end: new Date(Date.now() + 30 * 86_400_000),
  };
}

async function getUserIdFromSubscription(subscription: Stripe.Subscription): Promise<bigint | null> {
  const metaUserId = subscription.metadata?.userId;
  if (metaUserId) return BigInt(metaUserId);
  return null;
}

async function activateSubscription(subscription: Stripe.Subscription) {
  const userId = await getUserIdFromSubscription(subscription);
  if (!userId) return;

  const { start, end } = getPeriodDates(subscription);

  const existing = await prisma.subscription.findFirst({
    where: { externalSubscriptionId: subscription.id },
  });

  if (existing) {
    await prisma.subscription.update({
      where: { id: existing.id },
      data: {
        status: 'active',
        currentPeriodStart: start,
        currentPeriodEnd: end,
        canceledAt: null,
      },
    });
  } else {
    await prisma.subscription.create({
      data: {
        userId,
        tier: 'pro',
        status: 'active',
        paymentProvider: 'stripe',
        externalSubscriptionId: subscription.id,
        currentPeriodStart: start,
        currentPeriodEnd: end,
      },
    });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { subscriptionTier: 'pro' },
  });
}

async function cancelSubscription(subscription: Stripe.Subscription) {
  const sub = await prisma.subscription.findFirst({
    where: { externalSubscriptionId: subscription.id },
  });
  if (!sub) return;

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: 'canceled',
      canceledAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: sub.userId },
    data: { subscriptionTier: 'free' },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          typeof session.subscription === 'string' ? session.subscription : session.subscription.id,
          { expand: ['items'] }
        );
        await activateSubscription(subscription);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.status === 'active') {
        await activateSubscription(subscription);
      } else if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
        const sub = await prisma.subscription.findFirst({
          where: { externalSubscriptionId: subscription.id },
        });
        if (sub) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: { status: subscription.status },
          });
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await cancelSubscription(subscription);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const parentSub = invoice.parent?.subscription_details;
      const subId = parentSub
        ? (typeof parentSub.subscription === 'string' ? parentSub.subscription : parentSub.subscription?.id)
        : undefined;
      if (subId) {
        const sub = await prisma.subscription.findFirst({
          where: { externalSubscriptionId: subId },
        });
        if (sub) {
          await prisma.notification.create({
            data: {
              userId: sub.userId,
              type: 'payment_failed',
              title: 'Payment Failed',
              body: 'Your Pro subscription payment failed. Please update your payment method to keep your Pro features.',
            },
          });
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
