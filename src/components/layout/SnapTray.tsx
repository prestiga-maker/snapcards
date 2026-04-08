'use client';

import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

function FeedIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
    </svg>
  );
}

function ContactsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function ScanIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function StatsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function MenuIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? 'var(--primary)' : 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function SnapTray() {
  const t = useTranslations('nav');
  const params = useParams();
  const pathname = usePathname();
  const locale = params.locale as string;

  const isActive = (path: string) => pathname.includes(path);

  const items = [
    { href: `/${locale}/feed`, label: t('feed'), icon: FeedIcon, path: '/feed' },
    { href: `/${locale}/contacts`, label: t('contacts'), icon: ContactsIcon, path: '/contacts' },
    { href: `/${locale}/scan`, label: t('scan'), icon: null, path: '/scan' },
    { href: `/${locale}/analytics`, label: t('stats'), icon: StatsIcon, path: '/analytics' },
    { href: `/${locale}/settings`, label: t('menu'), icon: MenuIcon, path: '/settings' },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 glass ghost-border border-t" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {items.map((item) => {
          const active = isActive(item.path);

          // Scan button — center elevated
          if (item.path === '/scan') {
            return (
              <Link
                key={item.path}
                href={item.href}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div className="gradient-primary flex h-14 w-14 items-center justify-center rounded-full shadow-ambient transition-transform hover:scale-105 active:scale-95">
                  <ScanIcon />
                </div>
                <span className="mt-0.5 text-[10px] font-medium" style={{ color: active ? 'var(--primary)' : 'var(--on-surface-variant)' }}>
                  {item.label}
                </span>
              </Link>
            );
          }

          const Icon = item.icon!;

          return (
            <Link
              key={item.path}
              href={item.href}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <div className={`rounded-2xl px-4 py-1 transition-colors ${active ? 'bg-[var(--surface-container-low)]' : ''}`}>
                <Icon active={active} />
              </div>
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? 'var(--primary)' : 'var(--on-surface-variant)' }}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
