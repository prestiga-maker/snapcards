import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { canUseFeature, featureGatedResponse } from '@/lib/services/subscription';

// GET: Fetch analytics for a business page
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  if (!canUseFeature(user.subscriptionTier, 'analytics')) {
    return featureGatedResponse('analytics');
  }

  const { pageId } = await params;
  const id = BigInt(pageId);

  const page = await prisma.businessPage.findUnique({ where: { id } });
  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Parse date range from query params (default: last 30 days)
  const url = new URL(request.url);
  const daysParam = url.searchParams.get('days');
  const days = Math.min(Math.max(parseInt(daysParam || '30', 10), 1), 90);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const analytics = await prisma.pageAnalytics.findMany({
    where: {
      businessPageId: id,
      date: { gte: since },
    },
    orderBy: { date: 'asc' },
  });

  // Aggregate totals
  const totals = analytics.reduce(
    (acc, row) => ({
      pageViews: acc.pageViews + row.pageViews,
      uniqueVisitors: acc.uniqueVisitors + row.uniqueVisitors,
      chatbotConversations: acc.chatbotConversations + row.chatbotConversations,
      leadsGenerated: acc.leadsGenerated + row.leadsGenerated,
      qrScans: acc.qrScans + row.qrScans,
    }),
    { pageViews: 0, uniqueVisitors: 0, chatbotConversations: 0, leadsGenerated: 0, qrScans: 0 }
  );

  // Daily breakdown
  const daily = analytics.map((row) => ({
    date: row.date.toISOString().slice(0, 10),
    pageViews: row.pageViews,
    uniqueVisitors: row.uniqueVisitors,
    chatbotConversations: row.chatbotConversations,
    leadsGenerated: row.leadsGenerated,
    qrScans: row.qrScans,
  }));

  // Recent leads
  const leads = await prisma.lead.findMany({
    where: { businessPageId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      source: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    totals,
    daily,
    leads: leads.map((l) => ({
      ...l,
      id: l.id.toString(),
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
