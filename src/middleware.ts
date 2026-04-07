import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';
import { updateSession } from './lib/supabase/middleware';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // Business page routing: {slug}.snap.cards
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';
  if (
    hostname !== appDomain &&
    hostname !== `www.${appDomain}` &&
    !hostname.startsWith('localhost') &&
    hostname.endsWith(`.${appDomain}`)
  ) {
    const slug = hostname.replace(`.${appDomain}`, '');
    const url = request.nextUrl.clone();
    url.pathname = `/sites/${slug}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Custom domain routing: user's own domain → /sites/{slug} via DB lookup header
  if (
    hostname !== appDomain &&
    hostname !== `www.${appDomain}` &&
    !hostname.startsWith('localhost') &&
    !hostname.endsWith(`.${appDomain}`)
  ) {
    // Custom domain — rewrite to /sites/_custom with the domain in a header
    const url = request.nextUrl.clone();
    url.pathname = `/sites/_custom${pathname}`;
    const response = NextResponse.rewrite(url);
    response.headers.set('x-custom-domain', hostname);
    return response;
  }

  // API routes: skip i18n, just refresh Supabase session
  if (pathname.startsWith('/api')) {
    return updateSession(request);
  }

  // Static/internal paths: skip i18n
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/sites') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Refresh Supabase session + apply i18n routing
  const supabaseResponse = await updateSession(request);
  const intlResponse = intlMiddleware(request);

  // Merge Supabase cookies into the i18n response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    intlResponse.cookies.set(cookie.name, cookie.value);
  });

  return intlResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
