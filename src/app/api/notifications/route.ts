import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// GET: Fetch user's notifications
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const unreadOnly = searchParams.get('unreadOnly') === 'true';

  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(unreadOnly && { isRead: false }),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });

  return NextResponse.json({
    notifications: notifications.map((n) => ({
      id: n.id.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
}

// PATCH: Mark notifications as read
export async function PATCH(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { notificationIds, markAll } = await request.json();

  if (markAll) {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true },
    });
  } else if (Array.isArray(notificationIds) && notificationIds.length > 0) {
    await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds.map((id: string) => BigInt(id)) },
        userId: user.id,
      },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
