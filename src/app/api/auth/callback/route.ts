import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/en';
  const oauthError = searchParams.get('error');
  const oauthErrorDescription = searchParams.get('error_description');
  const oauthErrorCode = searchParams.get('error_code');

  if (oauthError || oauthErrorDescription) {
    console.error('[auth/callback] OAuth provider returned error:', {
      error: oauthError,
      error_description: oauthErrorDescription,
      error_code: oauthErrorCode,
      all_params: Object.fromEntries(searchParams.entries()),
    });
    const errorUrl = new URL(`${origin}/en/login`);
    errorUrl.searchParams.set('error', 'oauth_error');
    errorUrl.searchParams.set('reason', oauthErrorDescription || oauthError || 'unknown');
    if (oauthErrorCode) errorUrl.searchParams.set('code', oauthErrorCode);
    return NextResponse.redirect(errorUrl);
  }

  if (code) {
    // Attach cookies directly to the redirect response so the session
    // persists across the redirect. Using next/headers cookies() here
    // does not propagate to NextResponse.redirect().
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[auth/callback] exchangeCodeForSession failed:', {
        message: error.message,
        status: error.status,
        name: error.name,
        code: error.code,
      });
      const errorUrl = new URL(`${origin}/en/login`);
      errorUrl.searchParams.set('error', 'auth_failed');
      errorUrl.searchParams.set('reason', error.message || 'unknown');
      return NextResponse.redirect(errorUrl);
    }

    if (data.user) {
      // Sync Supabase user to MySQL
      const supabaseUser = data.user;
      const metadata = supabaseUser.user_metadata || {};

      try {
        const existingUser = await prisma.user.findUnique({
          where: { supabaseUid: supabaseUser.id },
        });

        if (!existingUser) {
          const displayName =
            metadata.display_name ||
            metadata.full_name ||
            metadata.name ||
            supabaseUser.email?.split('@')[0] ||
            'User';

          const user = await prisma.user.create({
            data: {
              supabaseUid: supabaseUser.id,
              email: supabaseUser.email!,
              phone: supabaseUser.phone || null,
              displayName,
              avatarUrl: metadata.avatar_url || metadata.picture || null,
              locale: metadata.locale || 'en',
            },
          });

          // Create empty profile
          await prisma.profile.create({
            data: {
              userId: user.id,
              firstName: metadata.first_name || displayName.split(' ')[0] || '',
              lastName: metadata.last_name || displayName.split(' ').slice(1).join(' ') || '',
            },
          });
        } else {
          // Update last login info
          await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              avatarUrl: metadata.avatar_url || metadata.picture || existingUser.avatarUrl,
            },
          });
        }
      } catch (dbError) {
        console.error('Error syncing user to MySQL:', dbError);
        // Don't block auth flow on DB errors
      }

      return response;
    }
  }

  // No code and no error — something weird happened
  console.error('[auth/callback] no code and no error in request URL', {
    all_params: Object.fromEntries(searchParams.entries()),
    full_url: request.url,
  });
  return NextResponse.redirect(`${origin}/en/login?error=auth_failed&reason=no_code`);
}
