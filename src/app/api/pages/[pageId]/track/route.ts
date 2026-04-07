import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/services/rate-limit';

// POST: Track a page view (public, no auth)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  const ip = getClientIp(request);

  // Rate limit: 10 tracking calls per minute per IP
  const rl = checkRateLimit(`track:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }); // Silent — don't expose rate limit to trackers
  }

  const { pageId } = await params;
  const id = BigInt(pageId);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Track unique visitor using IP-based dedup (per day)
  const isUnique = checkRateLimit(`unique:${ip}:${pageId}`, 1, 86_400_000);

  await prisma.pageAnalytics.upsert({
    where: { uq_analytics_date: { businessPageId: id, date: today } },
    update: {
      pageViews: { increment: 1 },
      ...(isUnique.allowed ? { uniqueVisitors: { increment: 1 } } : {}),
    },
    create: {
      businessPageId: id,
      date: today,
      pageViews: 1,
      uniqueVisitors: isUnique.allowed ? 1 : 0,
    },
  });

  return NextResponse.json({ ok: true });
}
