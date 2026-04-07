import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { canUseFeature, featureGatedResponse } from '@/lib/services/subscription';
import dns from 'dns/promises';

// PUT: Set or update custom domain for a business page
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  if (!canUseFeature(user.subscriptionTier, 'customDomain')) {
    return featureGatedResponse('customDomain');
  }

  const { pageId } = await params;
  const id = BigInt(pageId);

  const page = await prisma.businessPage.findUnique({ where: { id } });
  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const { domain } = body as { domain: string };

  if (!domain) {
    return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
  }

  // Basic domain validation
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
  }

  // Check if domain is already taken by another page
  const existing = await prisma.businessPage.findUnique({ where: { customDomain: domain } });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: 'Domain already in use' }, { status: 409 });
  }

  await prisma.businessPage.update({
    where: { id },
    data: {
      customDomain: domain,
      domainVerified: false,
    },
  });

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

  return NextResponse.json({
    domain,
    verified: false,
    instructions: {
      type: 'CNAME',
      name: domain,
      value: appDomain,
    },
  });
}

// POST: Verify DNS for a custom domain
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { pageId } = await params;
  const id = BigInt(pageId);

  const page = await prisma.businessPage.findUnique({ where: { id } });
  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (!page.customDomain) {
    return NextResponse.json({ error: 'No custom domain set' }, { status: 400 });
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

  // Check CNAME record
  try {
    const records = await dns.resolveCname(page.customDomain);
    const verified = records.some((r) => r === appDomain || r.endsWith(`.${appDomain}`));

    if (verified) {
      await prisma.businessPage.update({
        where: { id },
        data: { domainVerified: true },
      });
    }

    return NextResponse.json({ verified, records });
  } catch {
    return NextResponse.json({ verified: false, error: 'DNS lookup failed — CNAME not found' });
  }
}

// DELETE: Remove custom domain
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { pageId } = await params;
  const id = BigInt(pageId);

  const page = await prisma.businessPage.findUnique({ where: { id } });
  if (!page || page.userId !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await prisma.businessPage.update({
    where: { id },
    data: { customDomain: null, domainVerified: false },
  });

  return NextResponse.json({ success: true });
}
