import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/services/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const UPLOAD_DIR = process.env.CPANEL_UPLOAD_PATH || path.join(process.cwd(), 'public/uploads');
const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  const context = formData.get('context') as string || 'general';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // Validate file size (10MB max)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
  }

  // Create unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const userDir = path.join(UPLOAD_DIR, user.id.toString(), context);
  const filePath = path.join(userDir, filename);

  // Ensure directory exists
  await mkdir(userDir, { recursive: true });

  // Write file
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  // Return URL
  const relativePath = `/uploads/${user.id}/${context}/${filename}`;
  const url = CDN_URL ? `${CDN_URL}${relativePath}` : relativePath;

  return NextResponse.json({ url, filename });
}
