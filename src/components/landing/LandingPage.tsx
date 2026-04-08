'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface LandingPageProps {
  locale: string;
}

const FEATURES = [
  { key: 'feature1', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
  { key: 'feature2', icon: 'M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z' },
  { key: 'feature3', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { key: 'feature4', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
  { key: 'feature5', icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
  { key: 'feature6', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
] as const;

const STEPS = [
  { key: 'step1', num: '1' },
  { key: 'step2', num: '2' },
  { key: 'step3', num: '3' },
] as const;

export function LandingPage({ locale }: LandingPageProps) {
  const t = useTranslations('landing');
  const otherLocale = locale === 'he' ? 'en' : 'he';

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href={`/${otherLocale}`}
            className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-container-low)]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-surface-variant)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </Link>

          <Link href={`/${locale}`} className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>
            SNAP.Cards
          </Link>

          <Link
            href={`/${locale}/login`}
            className="flex h-9 w-9 items-center justify-center rounded-full"
            style={{ background: 'var(--primary)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-12 pt-6 sm:px-6 sm:pt-12">
        {/* Trust banner */}
        <div className="mx-auto mb-6 flex max-w-sm justify-center">
          <span className="rounded-2xl px-5 py-1.5 text-xs font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))' }}>
            {t('trustedBy')}
          </span>
        </div>

        <div className="mx-auto max-w-lg text-center">
          <h1 className="text-display text-[2.5rem] leading-[1.1] sm:text-5xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
            {t('heroSubtitle')}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link
              href={`/${locale}/register`}
              className="gradient-primary mx-auto inline-flex w-full max-w-sm items-center justify-center rounded-2xl px-8 py-4 text-base font-semibold text-white shadow-ambient transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {t('getStarted')}
            </Link>
            <a
              href="#how-it-works"
              className="mx-auto inline-flex w-full max-w-sm items-center justify-center rounded-2xl px-8 py-4 text-base font-semibold ghost-border transition-colors"
              style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}
            >
              {t('watchDemo')}
            </a>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon }) => (
              <div
                key={key}
                className="rounded-2xl p-6 transition-shadow hover:shadow-ambient"
                style={{ background: 'var(--surface-container-lowest)' }}
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'var(--surface-container-low)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d={icon} />
                  </svg>
                </div>
                <h3 className="mb-2 text-base font-bold" style={{ color: 'var(--on-surface)' }}>
                  {t(`${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  {t(`${key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-12 sm:px-6" style={{ background: 'var(--surface-container-low)' }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-display mb-12 text-center text-3xl sm:text-4xl">
            {t('howItWorksTitle')}
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            {STEPS.map(({ key, num }) => (
              <div key={key} className="text-center">
                <div className="gradient-primary mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-ambient">
                  {num}
                </div>
                <h3 className="mb-3 text-lg font-bold" style={{ color: 'var(--on-surface)' }}>
                  {t(`${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>
                  {t(`${key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-display mb-12 text-center text-3xl sm:text-4xl">
            {t('pricingTitle')}
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-2xl p-7" style={{ background: 'var(--surface-container-lowest)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{t('freePlan')}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-display text-4xl">{t('freePlanPrice')}</span>
                <span className="ms-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('freePlanPeriod')}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {t('freePlanFeatures').split('|').map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                    <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/register`}
                className="mt-7 block w-full rounded-2xl py-3.5 text-center text-sm font-semibold ghost-border transition-colors"
                style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
              >
                {t('getStarted')}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-2xl p-7 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
              <div className="absolute -top-3 start-5 rounded-2xl px-4 py-1 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))' }}>
                PRO
              </div>
              <h3 className="text-lg font-bold" style={{ color: 'var(--on-surface)' }}>{t('proPlan')}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-display text-4xl">{t('proPlanPrice')}</span>
                <span className="ms-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('proPlanPeriod')}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {t('proPlanFeatures').split('|').map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                    <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/register`}
                className="gradient-primary mt-7 block w-full rounded-2xl py-3.5 text-center text-sm font-semibold text-white shadow-ambient transition-transform hover:scale-[1.01]"
              >
                {t('proPlanCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl px-6 py-12 text-center shadow-ambient" style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}>
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            {t('ctaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-base text-white/80">
            {t('ctaSubtitle')}
          </p>
          <Link
            href={`/${locale}/register`}
            className="mt-8 inline-flex items-center rounded-2xl px-8 py-3.5 text-base font-semibold transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--surface-container-lowest)', color: 'var(--primary)' }}
          >
            {t('ctaCta')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-10 sm:px-6" style={{ background: 'var(--surface-container-low)' }}>
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>SNAP.Cards</span>
              <p className="mt-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('heroSubtitle').slice(0, 80)}...</p>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface)' }}>{t('footerProduct')}</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                <li><a href="#" className="transition-colors hover:text-[var(--on-surface)]">{t('footerFeatures')}</a></li>
                <li><a href="#" className="transition-colors hover:text-[var(--on-surface)]">{t('footerPricing')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface)' }}>{t('footerCompany')}</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                <li><a href="#" className="transition-colors hover:text-[var(--on-surface)]">{t('footerAbout')}</a></li>
                <li><a href="#" className="transition-colors hover:text-[var(--on-surface)]">{t('footerBlog')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--on-surface)' }}>{t('footerLegal')}</h4>
              <ul className="space-y-2 text-sm" style={{ color: 'var(--on-surface-variant)' }}>
                <li><a href="#" className="transition-colors hover:text-[var(--on-surface)]">{t('footerPrivacy')}</a></li>
                <li><a href="#" className="transition-colors hover:text-[var(--on-surface)]">{t('footerTerms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 text-center text-sm" style={{ color: 'var(--on-surface-variant)', borderTop: '1px solid rgba(199,196,216,0.2)' }}>
            &copy; {new Date().getFullYear()} SNAP.Cards. {t('footerRights')}
          </div>
        </div>
      </footer>
    </div>
  );
}
