'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';

interface SubscriptionInfo {
  tier: 'free' | 'pro';
  plan: { name: string; price: number };
  subscription: {
    status: string;
    currentPeriodEnd: string;
    canceledAt: string | null;
  } | null;
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tNav = useTranslations('nav');
  const searchParams = useSearchParams();

  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState<string | null>(null);

  const [billing, setBilling] = useState<SubscriptionInfo | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingStatus, setBillingStatus] = useState<string | null>(null);

  // Fetch profile + billing on mount
  useEffect(() => {
    async function init() {
      try {
        const [profileRes, billingRes] = await Promise.all([
          fetch('/api/profile'),
          fetch('/api/billing/status'),
        ]);
        if (profileRes.ok) {
          const data = await profileRes.json();
          setCalendarConnected(data.googleCalendarConnected || false);
        }
        if (billingRes.ok) {
          const data = await billingRes.json();
          setBilling(data);
        }
      } catch {
        // Silent fail
      }
    }
    init();
  }, []);

  // Handle URL callback status
  useEffect(() => {
    const calParam = searchParams.get('calendar');
    if (calParam === 'connected') {
      setCalendarConnected(true);
      setCalendarStatus('connected');
    } else if (calParam === 'error') {
      setCalendarStatus('error');
    }

    const billParam = searchParams.get('billing');
    if (billParam === 'success') {
      setBillingStatus('success');
      // Refresh billing status
      fetch('/api/billing/status').then(r => r.json()).then(setBilling).catch(() => {});
    } else if (billParam === 'canceled') {
      setBillingStatus('canceled');
    }
  }, [searchParams]);

  async function handleConnectCalendar() {
    setCalendarLoading(true);
    try {
      const res = await fetch('/api/calendar/connect');
      if (!res.ok) return;
      const data = await res.json();
      window.location.href = data.authUrl;
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleDisconnectCalendar() {
    setCalendarLoading(true);
    try {
      const res = await fetch('/api/calendar/disconnect', { method: 'POST' });
      if (res.ok) {
        setCalendarConnected(false);
        setCalendarStatus(null);
      }
    } finally {
      setCalendarLoading(false);
    }
  }

  async function handleUpgrade() {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      window.location.href = data.url;
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleManageBilling() {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      if (!res.ok) return;
      const data = await res.json();
      window.location.href = data.url;
    } finally {
      setBillingLoading(false);
    }
  }

  const isPro = billing?.tier === 'pro';
  const isCanceled = billing?.subscription?.canceledAt != null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{tNav('settings')}</h1>

      <div className="space-y-4">
        {/* Profile section */}
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h2 className="mb-4 text-lg font-semibold">{tNav('profile')}</h2>
          <p className="text-sm text-gray-500">{t('profileHint')}</p>
        </div>

        {/* Subscription / Billing section */}
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h2 className="mb-4 text-lg font-semibold">{t('subscription')}</h2>

          {billingStatus === 'success' && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
              {t('upgradeSuccess')}
            </div>
          )}

          {isPro ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {t('proPlan')}
                </span>
                {isCanceled && (
                  <span className="text-sm text-amber-600 dark:text-amber-400">
                    {t('canceledEnds', {
                      date: new Date(billing!.subscription!.currentPeriodEnd).toLocaleDateString(),
                    })}
                  </span>
                )}
              </div>

              <div className="text-sm text-gray-500">
                {!isCanceled && billing?.subscription && (
                  <p>
                    {t('nextBilling', {
                      date: new Date(billing.subscription.currentPeriodEnd).toLocaleDateString(),
                    })}
                  </p>
                )}
              </div>

              <button
                onClick={handleManageBilling}
                disabled={billingLoading}
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
              >
                {t('manageBilling')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium dark:bg-gray-800">
                  {t('freePlan')}
                </span>
              </div>

              {/* Pro features list */}
              <div className="rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 p-4 dark:from-indigo-950/50 dark:to-purple-950/50">
                <p className="mb-3 text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                  {t('proFeatures')}
                </p>
                <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-300">
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t('featureChatbot')}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t('featureCustomDomain')}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t('featureAnalytics')}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t('featurePages')}
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {t('featureLeads')}
                  </li>
                </ul>
              </div>

              <button
                onClick={handleUpgrade}
                disabled={billingLoading}
                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {billingLoading ? '...' : t('upgradePro')}
              </button>
            </div>
          )}
        </div>

        {/* Google Calendar section */}
        <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
          <h2 className="mb-2 text-lg font-semibold">{t('calendarTitle')}</h2>
          <p className="mb-4 text-sm text-gray-500">{t('calendarDescription')}</p>

          {calendarStatus === 'connected' && (
            <div className="mb-4 rounded-lg bg-green-50 px-4 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-400">
              {t('calendarConnectedSuccess')}
            </div>
          )}
          {calendarStatus === 'error' && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
              {t('calendarError')}
            </div>
          )}

          {calendarConnected ? (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t('calendarConnected')}
              </span>
              <button
                onClick={handleDisconnectCalendar}
                disabled={calendarLoading}
                className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
              >
                {t('calendarDisconnect')}
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectCalendar}
              disabled={calendarLoading}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-medium shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:bg-gray-800 dark:ring-gray-700"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('calendarConnect')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
