import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/services/auth';
import { getGoogleAuthUrl } from '@/lib/calendar/google';

// GET: Initiate Google Calendar OAuth
export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const state = Buffer.from(JSON.stringify({ userId: user.id.toString() })).toString('base64');
  const authUrl = getGoogleAuthUrl(state);

  return NextResponse.json({ authUrl });
}
