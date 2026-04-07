import { prisma } from '@/lib/db';
import { PLANS, type PlanId } from '@/lib/stripe/config';

export type Feature = 'chatbot' | 'customDomain' | 'analytics' | 'leadsExport';

/**
 * Check whether a user's current plan allows a feature.
 */
export function canUseFeature(tier: string, feature: Feature): boolean {
  const plan = PLANS[tier as PlanId] ?? PLANS.free;
  return plan.limits[feature] === true;
}

/**
 * Check whether a user can create another business page.
 */
export async function canCreatePage(userId: bigint, tier: string): Promise<boolean> {
  const plan = PLANS[tier as PlanId] ?? PLANS.free;
  const count = await prisma.businessPage.count({ where: { userId } });
  return count < plan.limits.businessPages;
}

/**
 * Get user's subscription status for API/UI consumption.
 */
export async function getSubscriptionStatus(userId: bigint) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  const tier = (user?.subscriptionTier || 'free') as PlanId;
  const plan = PLANS[tier];

  const activeSub = await prisma.subscription.findFirst({
    where: { userId, status: { in: ['active', 'past_due'] } },
    orderBy: { createdAt: 'desc' },
  });

  return {
    tier,
    plan,
    subscription: activeSub
      ? {
          status: activeSub.status,
          currentPeriodEnd: activeSub.currentPeriodEnd,
          canceledAt: activeSub.canceledAt,
        }
      : null,
  };
}

/**
 * Require a specific feature — returns 403 response if not allowed.
 * Use in API routes: if (!requireFeature(user, 'chatbot')) return featureGatedResponse('chatbot');
 */
export function featureGatedResponse(feature: Feature) {
  return new Response(
    JSON.stringify({
      error: 'Feature requires Pro plan',
      feature,
      upgrade: true,
    }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}
