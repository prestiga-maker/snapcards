import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.CPANEL_UPLOAD_PATH || path.join(process.cwd(), 'public/uploads');
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

// Rate limit: 50 scans/day per user
const scanCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = scanCounts.get(userId);

  if (!entry || entry.resetAt < now) {
    scanCounts.set(userId, { count: 1, resetAt: now + 24 * 60 * 60 * 1000 });
    return true;
  }

  if (entry.count >= 50) return false;

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  if (!checkRateLimit(user.id.toString())) {
    return NextResponse.json(
      { error: 'Daily scan limit reached (50/day)' },
      { status: 429 }
    );
  }

  const formData = await request.formData();
  const frontImage = formData.get('front') as File | null;
  const backImage = formData.get('back') as File | null;
  const scanMethod = (formData.get('scanMethod') as string) || 'photo';
  const lat = formData.get('lat') as string | null;
  const lng = formData.get('lng') as string | null;

  if (!frontImage) {
    return NextResponse.json({ error: 'No card image provided' }, { status: 400 });
  }

  // Validate file types
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
  if (!allowedTypes.includes(frontImage.type)) {
    return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
  }

  // Save front image
  const ext = frontImage.name.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const frontFilename = `card-front-${timestamp}.${ext}`;
  const scanDir = path.join(UPLOAD_DIR, user.id.toString(), 'scans');
  await mkdir(scanDir, { recursive: true });

  const frontBuffer = Buffer.from(await frontImage.arrayBuffer());
  await writeFile(path.join(scanDir, frontFilename), frontBuffer);

  const frontPath = `/uploads/${user.id}/scans/${frontFilename}`;
  const frontUrl = CDN_URL ? `${CDN_URL}${frontPath}` : frontPath;

  // Save back image if provided
  let backUrl: string | null = null;
  if (backImage && allowedTypes.includes(backImage.type)) {
    const backExt = backImage.name.split('.').pop() || 'jpg';
    const backFilename = `card-back-${timestamp}.${backExt}`;
    const backBuffer = Buffer.from(await backImage.arrayBuffer());
    await writeFile(path.join(scanDir, backFilename), backBuffer);
    const backPath = `/uploads/${user.id}/scans/${backFilename}`;
    backUrl = CDN_URL ? `${CDN_URL}${backPath}` : backPath;
  }

  // Create scanned_cards row
  const card = await prisma.scannedCard.create({
    data: {
      scannerUserId: user.id,
      cardImageUrl: frontUrl,
      cardImageBackUrl: backUrl,
      scanMethod,
      scanLocationLat: lat ? parseFloat(lat) : null,
      scanLocationLng: lng ? parseFloat(lng) : null,
    },
  });

  return NextResponse.json({
    scanId: card.id.toString(),
    imageUrl: frontUrl,
    backImageUrl: backUrl,
  });
}
