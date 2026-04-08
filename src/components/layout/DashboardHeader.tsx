'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { NotificationBell } from './NotificationBell';

interface DashboardHeaderProps {
  user: { displayName: string; avatarUrl: string | null } | null;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const params = useParams();
  const locale = params.locale as string;

  return (
    <header className="sticky top-0 z-40 glass">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        {/* Avatar */}
        <Link href={`/${locale}/settings`} className="flex items-center">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt={user.displayName}
              className="h-9 w-9 rounded-full object-cover"
              style={{ boxShadow: '0 2px 12px rgba(20,27,43,0.08)' }}
            />
          ) : (
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))' }}
            >
              {user?.displayName?.[0]?.toUpperCase() || '?'}
            </div>
          )}
        </Link>

        {/* Logo */}
        <Link
          href={`/${locale}/feed`}
          className="text-lg font-bold"
          style={{ color: 'var(--on-surface)' }}
        >
          SNAP.Cards
        </Link>

        {/* Search / Notifications */}
        <div className="flex items-center gap-1">
          {user && <NotificationBell />}
          <Link
            href={`/${locale}/contacts?focus=search`}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-container-low)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
