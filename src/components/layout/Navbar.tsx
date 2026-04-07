'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { LocaleSwitcher } from './LocaleSwitcher';
import { NotificationBell } from './NotificationBell';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface NavbarProps {
  user: { displayName: string; avatarUrl: string | null } | null;
}

export function Navbar({ user }: NavbarProps) {
  const t = useTranslations('nav');
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href={`/${locale}`}
          className="text-xl font-bold text-indigo-600 dark:text-indigo-400"
        >
          SNAP.Cards
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          {user && (
            <>
              <Link href={`/${locale}/feed`} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                {t('feed')}
              </Link>
              <Link href={`/${locale}/contacts`} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                {t('contacts')}
              </Link>
              <Link href={`/${locale}/pages`} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                {t('pages')}
              </Link>
              <Link href={`/${locale}/messages`} className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
                {t('messages')}
              </Link>
            </>
          )}
          <LocaleSwitcher />
          {user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <Link
                href={`/${locale}/settings`}
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                {user.displayName}
              </Link>
              <button
                onClick={handleSignOut}
                className="text-sm text-red-600 hover:text-red-700"
              >
                {t('signOut')}
              </button>
            </div>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('home')}
            </Link>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:text-gray-900 md:hidden dark:hover:text-gray-100"
          aria-label="Toggle menu"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-800 dark:bg-gray-950">
          <div className="flex flex-col gap-3">
            {user && (
              <>
                <Link href={`/${locale}/feed`} className="text-sm">{t('feed')}</Link>
                <Link href={`/${locale}/contacts`} className="text-sm">{t('contacts')}</Link>
                <Link href={`/${locale}/pages`} className="text-sm">{t('pages')}</Link>
                <Link href={`/${locale}/messages`} className="text-sm">{t('messages')}</Link>
                <hr className="border-gray-200 dark:border-gray-800" />
                <button onClick={handleSignOut} className="text-start text-sm text-red-600">
                  {t('signOut')}
                </button>
              </>
            )}
            <LocaleSwitcher />
          </div>
        </div>
      )}
    </nav>
  );
}
