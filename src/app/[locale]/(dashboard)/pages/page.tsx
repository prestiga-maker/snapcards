'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface PageItem {
  id: string;
  slug: string;
  businessName: string;
  isPublished: boolean;
  templateName: string;
  createdAt: string;
}

export default function PagesListPage() {
  const t = useTranslations('pages');
  const params = useParams();
  const locale = params.locale as string;
  const [pages, setPages] = useState<PageItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pages')
      .then((res) => res.json())
      .then((data) => {
        setPages(data.pages || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link
          href={`/${locale}/pages/new`}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t('create')}
        </Link>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-xl border border-gray-200 p-12 text-center text-gray-500 dark:border-gray-800">
          <div className="mb-3 text-4xl">🌐</div>
          <p>{t('noPages')}</p>
          <p className="mt-1 text-sm">{t('noPagesHint')}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={`/${locale}/pages/${page.id}`}
              className="group rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md dark:border-gray-800"
            >
              <div className="mb-3 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    page.isPublished
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                  }`}
                >
                  {page.isPublished ? t('published') : t('draft')}
                </span>
                <span className="text-xs text-gray-400">{page.templateName}</span>
              </div>
              <h3 className="text-lg font-semibold group-hover:text-indigo-600">
                {page.businessName}
              </h3>
              {page.isPublished && (
                <p className="mt-1 text-sm text-gray-500">
                  {page.slug}.{domain}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
