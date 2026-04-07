import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

export async function GET() {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { profile: true },
  });

  if (!fullUser) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    displayName: fullUser.displayName,
    email: fullUser.email,
    avatarUrl: fullUser.avatarUrl,
    locale: fullUser.locale,
    subscriptionTier: fullUser.subscriptionTier,
    googleCalendarConnected: fullUser.googleCalendarConnected,
    profile: fullUser.profile
      ? {
          firstName: fullUser.profile.firstName,
          lastName: fullUser.profile.lastName,
          firstNameHe: fullUser.profile.firstNameHe,
          lastNameHe: fullUser.profile.lastNameHe,
          jobTitle: fullUser.profile.jobTitle,
          companyName: fullUser.profile.companyName,
          bio: fullUser.profile.bio,
          website: fullUser.profile.website,
          socialLinks: fullUser.profile.socialLinks,
          location: fullUser.profile.location,
          profileCompleteness: fullUser.profile.profileCompleteness,
          qrCodeUrl: fullUser.profile.qrCodeUrl,
          scanCount: fullUser.profile.scanCount,
        }
      : null,
  });
}

export async function PUT(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const body = await request.json();

  // Update user fields
  if (body.displayName || body.avatarUrl || body.locale) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.displayName && { displayName: body.displayName }),
        ...(body.avatarUrl && { avatarUrl: body.avatarUrl }),
        ...(body.locale && { locale: body.locale }),
      },
    });
  }

  // Update profile fields
  if (body.profile) {
    const p = body.profile;

    // Calculate completeness
    const fields = [p.firstName, p.lastName, p.jobTitle, p.companyName, p.bio, p.website, p.location];
    const filled = fields.filter((f) => f && f.trim()).length;
    const completeness = Math.round((filled / fields.length) * 100);

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        ...(p.firstName !== undefined && { firstName: p.firstName }),
        ...(p.lastName !== undefined && { lastName: p.lastName }),
        ...(p.firstNameHe !== undefined && { firstNameHe: p.firstNameHe }),
        ...(p.lastNameHe !== undefined && { lastNameHe: p.lastNameHe }),
        ...(p.jobTitle !== undefined && { jobTitle: p.jobTitle }),
        ...(p.companyName !== undefined && { companyName: p.companyName }),
        ...(p.bio !== undefined && { bio: p.bio }),
        ...(p.website !== undefined && { website: p.website }),
        ...(p.socialLinks !== undefined && { socialLinks: p.socialLinks }),
        ...(p.location !== undefined && { location: p.location }),
        profileCompleteness: completeness,
      },
      create: {
        userId: user.id,
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        profileCompleteness: completeness,
      },
    });
  }

  return NextResponse.json({ success: true });
}
