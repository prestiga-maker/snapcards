import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/services/auth';
import { getSubscriptionStatus } from '@/lib/services/subscription';

// GET: Get current user's subscription status
export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const status = await getSubscriptionStatus(user.id);
  return NextResponse.json(status);
}
