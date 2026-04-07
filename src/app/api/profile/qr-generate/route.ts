import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/services/auth';
import { prisma } from '@/lib/db';
import QRCode from 'qrcode';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.CPANEL_UPLOAD_PATH || path.join(process.cwd(), 'public/uploads');
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export async function POST() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';
  const profileUrl = `https://${domain}/u/${user.id}`;

  // Generate QR code as PNG buffer
  const qrBuffer = await QRCode.toBuffer(profileUrl, {
    type: 'png',
    width: 512,
    margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });

  // Save to disk
  const qrDir = path.join(UPLOAD_DIR, user.id.toString(), 'qr');
  await mkdir(qrDir, { recursive: true });
  const filename = `profile-qr.png`;
  await writeFile(path.join(qrDir, filename), qrBuffer);

  const relativePath = `/uploads/${user.id}/qr/${filename}`;
  const qrUrl = CDN_URL ? `${CDN_URL}${relativePath}` : relativePath;

  // Save URL to profile
  await prisma.profile.update({
    where: { userId: user.id },
    data: { qrCodeUrl: qrUrl },
  });

  return NextResponse.json({ qrUrl, profileUrl });
}
