'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface DailyData {
  date: string;
  pageViews: number;
  uniqueVisitors: number;
  chatbotConversations: number;
  leadsGenerated: number;
  qrScans: number;
}

interface LeadData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string;
  createdAt: string;
}

interface AnalyticsData {
  totals: {
    pageViews: number;
    uniqueVisitors: number;
    chatbotConversations: number;
    leadsGenerated: number;
    qrScans: number;
  };
  daily: DailyData[];
  leads: LeadData[];
}

export default function AnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('analytics');
  const locale = params.locale as string;
  const pageId = params.pageId as string;

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        const res = await fetch(`/api/pages/${pageId}/analytics?days=${days}`);
        if (res.status === 403) {
          setError('upgrade');
          return;
        }
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
      } catch {
        setError('error');
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [pageId, days]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (error === 'upgrade') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <svg className="h-16 w-16 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        <p className="text-lg font-medium">{t('proRequired')}</p>
        <button
          onClick={() => router.push(`/${locale}/settings`)}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t('upgradeNow')}
        </button>
      </div>
    );
  }

  if (error || !data) {
    return <p className="py-10 text-center text-red-500">{t('loadError')}</p>;
  }

  const maxViews = Math.max(...data.daily.map((d) => d.pageViews), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                days === d
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400'
              }`}
            >
              {d}{t('days')}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label={t('pageViews')} value={data.totals.pageViews} />
        <StatCard label={t('uniqueVisitors')} value={data.totals.uniqueVisitors} />
        <StatCard label={t('chatbotChats')} value={data.totals.chatbotConversations} />
        <StatCard label={t('leads')} value={data.totals.leadsGenerated} />
        <StatCard label={t('qrScans')} value={data.totals.qrScans} />
      </div>

      {/* Chart — simple CSS bar chart */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <h2 className="mb-4 text-lg font-semibold">{t('dailyViews')}</h2>
        {data.daily.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">{t('noData')}</p>
        ) : (
          <div className="flex items-end gap-1" style={{ height: 200 }}>
            {data.daily.map((d) => (
              <div key={d.date} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: '100%' }}>
                <div
                  className="w-full min-w-[4px] rounded-t bg-indigo-500 transition-all group-hover:bg-indigo-400"
                  style={{ height: `${(d.pageViews / maxViews) * 100}%`, minHeight: d.pageViews > 0 ? 4 : 0 }}
                />
                <div className="pointer-events-none absolute -top-8 rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {d.pageViews} {t('views')}
                  <br />
                  {d.date}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="rounded-xl border border-gray-200 p-6 dark:border-gray-800">
        <h2 className="mb-4 text-lg font-semibold">{t('recentLeads')}</h2>
        {data.leads.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-400">{t('noLeads')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-start dark:border-gray-700">
                  <th className="pb-2 pe-4 font-medium text-gray-500">{t('name')}</th>
                  <th className="pb-2 pe-4 font-medium text-gray-500">{t('email')}</th>
                  <th className="pb-2 pe-4 font-medium text-gray-500">{t('phone')}</th>
                  <th className="pb-2 pe-4 font-medium text-gray-500">{t('source')}</th>
                  <th className="pb-2 font-medium text-gray-500">{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {data.leads.map((lead) => (
                  <tr key={lead.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-2 pe-4">{lead.name || '—'}</td>
                    <td className="py-2 pe-4">{lead.email || '—'}</td>
                    <td className="py-2 pe-4">{lead.phone || '—'}</td>
                    <td className="py-2 pe-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-800">
                        {lead.source}
                      </span>
                    </td>
                    <td className="py-2 text-gray-500">
                      {new Date(lead.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back link */}
      <button
        onClick={() => router.push(`/${locale}/pages/${pageId}`)}
        className="text-sm text-indigo-600 hover:text-indigo-500"
      >
        &larr; {t('backToEditor')}
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );
}
