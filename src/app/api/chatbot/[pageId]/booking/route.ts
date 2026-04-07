import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAvailableSlots, createBookingEvent } from '@/lib/calendar/google';

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

// POST: Public booking endpoint for business page chatbot
export async function POST(request: NextRequest, context: RouteContext) {
  const { pageId: pageIdStr } = await context.params;
  const pageId = BigInt(pageIdStr);

  const page = await prisma.businessPage.findUnique({
    where: { id: pageId, isPublished: true },
    select: {
      id: true,
      chatbotEnabled: true,
      userId: true,
      businessName: true,
      user: {
        select: {
          id: true,
          googleCalendarConnected: true,
        },
      },
    },
  });

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  if (!page.chatbotEnabled) {
    return NextResponse.json({ error: 'Chatbot not enabled' }, { status: 403 });
  }

  if (!page.user.googleCalendarConnected) {
    return NextResponse.json({ error: 'Calendar not connected' }, { status: 400 });
  }

  const body = await request.json();
  const { action } = body;

  switch (action) {
    case 'getSlots': {
      const { date } = body;
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return NextResponse.json({ error: 'Valid date required (YYYY-MM-DD)' }, { status: 400 });
      }

      try {
        const slots = await getAvailableSlots(page.userId, date);
        return NextResponse.json({ slots });
      } catch {
        return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
      }
    }

    case 'book': {
      const { startTime, endTime, name, email, phone, notes } = body;

      if (!startTime || !endTime) {
        return NextResponse.json({ error: 'Start and end time required' }, { status: 400 });
      }

      if (!name || !email) {
        return NextResponse.json({ error: 'Name and email required for booking' }, { status: 400 });
      }

      try {
        const result = await createBookingEvent(page.userId, {
          summary: `Booking: ${name} — ${page.businessName}`,
          description: `Customer: ${name}\nEmail: ${email}${phone ? `\nPhone: ${phone}` : ''}${notes ? `\nNotes: ${notes}` : ''}`,
          startTime,
          endTime,
          attendeeEmail: email,
          attendeeName: name,
        });

        // Save as lead
        await prisma.lead.create({
          data: {
            businessPageId: pageId,
            name,
            email,
            phone: phone || null,
            message: `Booking: ${new Date(startTime).toLocaleString()}${notes ? ` — ${notes}` : ''}`,
            source: 'booking',
          },
        });

        // Track analytics
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        await prisma.pageAnalytics.upsert({
          where: {
            uq_analytics_date: { businessPageId: pageId, date: today },
          },
          update: { leadsGenerated: { increment: 1 } },
          create: {
            businessPageId: pageId,
            date: today,
            leadsGenerated: 1,
          },
        });

        // Notify page owner
        await prisma.notification.create({
          data: {
            userId: page.userId,
            type: 'system',
            title: `New booking on ${page.businessName}`,
            body: `${name} booked for ${new Date(startTime).toLocaleString()}`,
            data: JSON.parse(JSON.stringify({
              pageId: pageId.toString(),
              eventId: result.eventId,
            })),
          },
        });

        return NextResponse.json({
          success: true,
          eventLink: result.htmlLink,
        });
      } catch {
        return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
      }
    }

    default:
      return NextResponse.json({ error: 'Invalid action. Use getSlots or book' }, { status: 400 });
  }
}
