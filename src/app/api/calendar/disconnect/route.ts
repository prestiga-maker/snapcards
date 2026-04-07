import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// POST: Disconnect Google Calendar
export async function POST() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      googleCalendarToken: Prisma.DbNull,
      googleCalendarConnected: false,
    },
  });

  return NextResponse.json({ success: true });
}
