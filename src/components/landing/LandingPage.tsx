'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

interface LandingPageProps {
  locale: string;
}

const FEATURES = [
  { key: 'feature1', icon: '🤖' },
  { key: 'feature2', icon: '📷' },
  { key: 'feature3', icon: '🤝' },
  { key: 'feature4', icon: '💬' },
  { key: 'feature5', icon: '📱' },
  { key: 'feature6', icon: '📊' },
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
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href={`/${locale}`} className="text-xl font-bold text-indigo-600">
            SNAP.Cards
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/${otherLocale}`}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-100"
            >
              {t('languageSwitch')}
            </Link>
            <Link
              href={`/${locale}/login`}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
            >
              {t('signIn')}
            </Link>
            <Link
              href={`/${locale}/register`}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              {t('getStarted')}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50/50 to-transparent" />
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            {t('heroTitle')}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 sm:text-xl">
            {t('heroSubtitle')}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-xl"
            >
              {t('getStarted')}
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center rounded-xl border border-gray-200 px-8 py-3.5 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {t('watchDemo')}
            </a>
          </div>
          <p className="mt-8 text-sm text-gray-400">{t('trustedBy')}</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(({ key, icon }) => (
              <div
                key={key}
                className="rounded-2xl border border-gray-100 bg-white p-8 transition-shadow hover:shadow-lg"
              >
                <div className="mb-4 text-4xl">{icon}</div>
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  {t(`${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {t(`${key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gray-50 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            {t('howItWorksTitle')}
          </h2>
          <div className="grid gap-12 sm:grid-cols-3">
            {STEPS.map(({ key, num }) => (
              <div key={key} className="text-center">
                <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
                  {num}
                </div>
                <h3 className="mb-3 text-lg font-bold text-gray-900">
                  {t(`${key}Title`)}
                </h3>
                <p className="text-sm leading-relaxed text-gray-600">
                  {t(`${key}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-16 text-center text-3xl font-bold text-gray-900 sm:text-4xl">
            {t('pricingTitle')}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {/* Free Plan */}
            <div className="rounded-2xl border border-gray-200 bg-white p-8">
              <h3 className="text-lg font-bold text-gray-900">{t('freePlan')}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">{t('freePlanPrice')}</span>
                <span className="ms-2 text-gray-500">{t('freePlanPeriod')}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {t('freePlanFeatures').split('|').map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-0.5 text-green-500">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/register`}
                className="mt-8 block w-full rounded-xl border border-gray-200 py-3 text-center text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                {t('getStarted')}
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative rounded-2xl border-2 border-indigo-600 bg-white p-8">
              <div className="absolute -top-3 start-6 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-semibold text-white">
                PRO
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('proPlan')}</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">{t('proPlanPrice')}</span>
                <span className="ms-2 text-gray-500">{t('proPlanPeriod')}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {t('proPlanFeatures').split('|').map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="mt-0.5 text-indigo-600">&#10003;</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={`/${locale}/register`}
                className="mt-8 block w-full rounded-xl bg-indigo-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
              >
                {t('proPlanCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            {t('ctaTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-indigo-100">
            {t('ctaSubtitle')}
          </p>
          <Link
            href={`/${locale}/register`}
            className="mt-8 inline-flex items-center rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-indigo-600 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-xl"
          >
            {t('ctaCta')}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-4">
            <div>
              <span className="text-lg font-bold text-indigo-600">SNAP.Cards</span>
              <p className="mt-2 text-sm text-gray-500">{t('heroSubtitle').slice(0, 80)}...</p>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">{t('footerProduct')}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-700">{t('footerFeatures')}</a></li>
                <li><a href="#" className="hover:text-gray-700">{t('footerPricing')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">{t('footerCompany')}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-700">{t('footerAbout')}</a></li>
                <li><a href="#" className="hover:text-gray-700">{t('footerBlog')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-gray-900">{t('footerLegal')}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gray-700">{t('footerPrivacy')}</a></li>
                <li><a href="#" className="hover:text-gray-700">{t('footerTerms')}</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} SNAP.Cards. {t('footerRights')}
          </div>
        </div>
      </footer>
    </div>
  );
}
