import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/services/rate-limit';

const RADIUS_KM = 5;

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rl = checkRateLimit(`nearby-events:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '0');
  const lng = parseFloat(searchParams.get('lng') || '0');

  if (!lat || !lng) {
    return NextResponse.json({ events: [] });
  }

  // Haversine approximation: 1 degree ≈ 111km
  const degreeRadius = RADIUS_KM / 111;

  const events = await prisma.event.findMany({
    where: {
      lat: { gte: lat - degreeRadius, lte: lat + degreeRadius },
      lng: { gte: lng - degreeRadius, lte: lng + degreeRadius },
      // Only show events happening today or in the future
      OR: [
        { startsAt: { gte: new Date() } },
        { startsAt: null },
      ],
    },
    orderBy: { startsAt: 'asc' },
    take: 10,
  });

  // Calculate actual distances and sort
  const withDistance = events.map((event) => {
    const eventLat = Number(event.lat);
    const eventLng = Number(event.lng);
    const distance = Math.sqrt(
      Math.pow((eventLat - lat) * 111, 2) +
      Math.pow((eventLng - lng) * 111 * Math.cos(lat * Math.PI / 180), 2)
    );
    return {
      id: event.id.toString(),
      name: event.name,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt?.toISOString() || null,
      distance: Math.round(distance * 10) / 10, // km, 1 decimal
    };
  }).sort((a, b) => a.distance - b.distance);

  return NextResponse.json({ events: withDistance });
}
