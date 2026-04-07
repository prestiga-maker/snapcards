import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { exchangeCodeForTokens } from '@/lib/calendar/google';

// GET: Google Calendar OAuth callback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (error) {
    return NextResponse.redirect(`${appUrl}/en/settings?calendar=error`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/en/settings?calendar=error`);
  }

  let userId: bigint;
  try {
    const parsed = JSON.parse(Buffer.from(state, 'base64').toString());
    userId = BigInt(parsed.userId);
  } catch {
    return NextResponse.redirect(`${appUrl}/en/settings?calendar=error`);
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await prisma.user.update({
      where: { id: userId },
      data: {
        googleCalendarToken: JSON.parse(JSON.stringify(tokens)),
        googleCalendarConnected: true,
      },
    });

    return NextResponse.redirect(`${appUrl}/en/settings?calendar=connected`);
  } catch {
    return NextResponse.redirect(`${appUrl}/en/settings?calendar=error`);
  }
}
