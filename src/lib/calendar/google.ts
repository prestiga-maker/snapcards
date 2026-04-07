import { prisma } from '@/lib/db';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/calendar/callback`;

interface GoogleTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface CalendarSlot {
  start: string; // ISO
  end: string;   // ISO
}

interface FreeBusyResponse {
  calendars: Record<string, { busy: Array<{ start: string; end: string }> }>;
}

/**
 * Build the Google OAuth consent URL for Calendar access.
 */
export function getGoogleAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens.
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleTokens> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google token exchange failed: ${err}`);
  }

  const data = await res.json();

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Refresh an expired access token.
 */
async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_at: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to refresh Google token');
  }

  const data = await res.json();
  return {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };
}

/**
 * Get a valid access token for a user, refreshing if needed.
 */
export async function getValidToken(userId: bigint): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { googleCalendarToken: true },
  });

  if (!user.googleCalendarToken) {
    throw new Error('Google Calendar not connected');
  }

  const tokens = user.googleCalendarToken as unknown as GoogleTokens;

  // Refresh if expired (with 5-min buffer)
  if (Date.now() > tokens.expires_at - 300000) {
    const refreshed = await refreshAccessToken(tokens.refresh_token);
    const updated: GoogleTokens = {
      ...tokens,
      access_token: refreshed.access_token,
      expires_at: refreshed.expires_at,
    };

    await prisma.user.update({
      where: { id: userId },
      data: { googleCalendarToken: JSON.parse(JSON.stringify(updated)) },
    });

    return refreshed.access_token;
  }

  return tokens.access_token;
}

/**
 * Get available time slots for a given date range.
 * Checks the user's primary calendar for free/busy info.
 */
export async function getAvailableSlots(
  userId: bigint,
  dateStr: string, // YYYY-MM-DD
  slotDurationMinutes: number = 30,
  businessHoursStart: number = 9, // 9 AM
  businessHoursEnd: number = 17,   // 5 PM
): Promise<CalendarSlot[]> {
  const accessToken = await getValidToken(userId);

  const dayStart = new Date(`${dateStr}T${String(businessHoursStart).padStart(2, '0')}:00:00`);
  const dayEnd = new Date(`${dateStr}T${String(businessHoursEnd).padStart(2, '0')}:00:00`);

  // Query Google Calendar FreeBusy API
  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: dayStart.toISOString(),
      timeMax: dayEnd.toISOString(),
      items: [{ id: 'primary' }],
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to fetch calendar availability');
  }

  const data: FreeBusyResponse = await res.json();
  const busySlots = data.calendars?.primary?.busy || [];

  // Generate available slots
  const slots: CalendarSlot[] = [];
  let current = new Date(dayStart);

  while (current.getTime() + slotDurationMinutes * 60000 <= dayEnd.getTime()) {
    const slotEnd = new Date(current.getTime() + slotDurationMinutes * 60000);

    // Check if slot overlaps with any busy period
    const isAvailable = !busySlots.some((busy) => {
      const busyStart = new Date(busy.start).getTime();
      const busyEnd = new Date(busy.end).getTime();
      return current.getTime() < busyEnd && slotEnd.getTime() > busyStart;
    });

    if (isAvailable) {
      slots.push({
        start: current.toISOString(),
        end: slotEnd.toISOString(),
      });
    }

    current = slotEnd;
  }

  return slots;
}

/**
 * Create a calendar event for a booking.
 */
export async function createBookingEvent(
  userId: bigint,
  options: {
    summary: string;
    description?: string;
    startTime: string; // ISO
    endTime: string;   // ISO
    attendeeEmail?: string;
    attendeeName?: string;
  }
): Promise<{ eventId: string; htmlLink: string }> {
  const accessToken = await getValidToken(userId);

  const event: Record<string, unknown> = {
    summary: options.summary,
    description: options.description || '',
    start: { dateTime: options.startTime },
    end: { dateTime: options.endTime },
  };

  if (options.attendeeEmail) {
    event.attendees = [
      {
        email: options.attendeeEmail,
        displayName: options.attendeeName || undefined,
      },
    ];
  }

  const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create calendar event: ${err}`);
  }

  const data = await res.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink,
  };
}
