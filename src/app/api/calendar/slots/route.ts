import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/services/auth';
import { getAvailableSlots } from '@/lib/calendar/google';

// GET: Get available calendar slots (for authenticated page owner)
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Valid date required (YYYY-MM-DD)' }, { status: 400 });
  }

  if (!user.googleCalendarConnected) {
    return NextResponse.json({ error: 'Google Calendar not connected' }, { status: 400 });
  }

  try {
    const slots = await getAvailableSlots(user.id, date);
    return NextResponse.json({ slots });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
}
