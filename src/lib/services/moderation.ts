import { prisma } from '@/lib/db';

/**
 * Trust score thresholds:
 *  - score >= 50: posts auto-approved
 *  - score 10-49: posts go to pending moderation
 *  - score < 10: posts go to pending moderation with stricter review
 *
 * Trust score is incremented by:
 *  +5 per confirmed scan
 *  +2 per accepted connection
 *  +1 per approved post
 *  -10 per rejected/reported post
 */

const AUTO_APPROVE_THRESHOLD = 50;

export async function moderatePost(userId: bigint): Promise<'approved' | 'pending'> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustScore: true },
  });

  if (!user) return 'pending';

  return user.trustScore >= AUTO_APPROVE_THRESHOLD ? 'approved' : 'pending';
}

export async function incrementTrustScore(userId: bigint, amount: number) {
  await prisma.user.update({
    where: { id: userId },
    data: { trustScore: { increment: amount } },
  });
}

export async function decrementTrustScore(userId: bigint, amount: number) {
  // Don't go below 0
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trustScore: true },
  });
  if (!user) return;

  const newScore = Math.max(0, user.trustScore - amount);
  await prisma.user.update({
    where: { id: userId },
    data: { trustScore: newScore },
  });
}

/**
 * Basic content filter — checks for obvious spam/harmful patterns.
 * Returns true if content should be flagged.
 */
export function flagContent(content: string): boolean {
  const lowerContent = content.toLowerCase();

  // Very basic spam detection
  const spamPatterns = [
    /(.)\1{10,}/, // repeated characters
    /https?:\/\/\S+/gi, // excessive URLs (count them)
  ];

  // Check for excessive repeated characters
  if (spamPatterns[0].test(content)) return true;

  // Check for too many URLs (likely spam)
  const urlCount = (lowerContent.match(/https?:\/\//g) || []).length;
  if (urlCount > 5) return true;

  return false;
}
