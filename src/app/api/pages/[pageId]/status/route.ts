import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/services/auth';
import { generationStatus } from '../../generate/route';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { pageId } = await params;
  const status = generationStatus.get(pageId) || { status: 'ready' };
  return NextResponse.json(status);
}
