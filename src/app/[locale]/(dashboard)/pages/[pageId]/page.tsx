'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { PageEditor } from '@/components/pages/PageEditor';
import type { PageConfig } from '@/types';

interface TemplateInfo {
  slug: string;
  name: string;
  category: string;
  schema: {
    sections: Array<{ type: string; label: string; fields: Record<string, unknown> }>;
    colorSchemes: Array<{ name: string; primary: string; secondary: string; accent: string }>;
    fonts: string[];
  };
}

interface PageData {
  id: string;
  slug: string;
  businessName: string;
  tagline: string | null;
  isPublished: boolean;
  chatbotEnabled: boolean;
  pageConfig: PageConfig;
  colorScheme: { primary: string; secondary: string; accent: string };
  fontFamily: string;
  template: TemplateInfo;
}

export default function PageEditorPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations('pages');
  const tc = useTranslations('common');
  const locale = params.locale as string;
  const pageId = params.pageId as string;

  const [page, setPage] = useState<PageData | null>(null);
  const [status, setStatus] = useState<string>('loading');
  const [publishing, setPublishing] = useState(false);
  const [togglingChatbot, setTogglingChatbot] = useState(false);

  const fetchPage = useCallback(async () => {
    const res = await fetch(`/api/pages/${pageId}`);
    if (res.ok) {
      const data = await res.json();
      setPage(data);
      setStatus('ready');
    }
  }, [pageId]);

  useEffect(() => {
    let stopped = false;

    async function checkStatus() {
      const res = await fetch(`/api/pages/${pageId}/status`);
      const data = await res.json();
      setStatus(data.status);
      return data.status;
    }

    checkStatus().then((s) => {
      if (stopped || s === 'ready' || s === 'failed') {
        if (s === 'ready') fetchPage();
        return;
      }
    });

    const interval = setInterval(async () => {
      const s = await checkStatus();
      if (s === 'ready') {
        clearInterval(interval);
        fetchPage();
      } else if (s === 'failed') {
        clearInterval(interval);
      }
    }, 3000);

    return () => { stopped = true; clearInterval(interval); };
  }, [pageId, fetchPage]);

  async function handlePublish() {
    setPublishing(true);
    const res = await fetch(`/api/pages/${pageId}/publish`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setPage((prev) => prev ? { ...prev, isPublished: true } : null);
      alert(t('publishedAlert', { url: data.url }));
    }
    setPublishing(false);
  }

  if (status === 'loading' || status === 'scraping' || status === 'generating') {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
        <p className="text-lg font-medium">
          {status === 'scraping' && t('scraping')}
          {status === 'generating' && t('generating')}
          {status === 'loading' && tc('loading')}
        </p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center gap-4">
        <p className="text-lg text-red-600">{t('generationFailed')}</p>
        <button
          onClick={() => router.push(`/${locale}/pages/new`)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
        >
          {t('startOver')}
        </button>
      </div>
    );
  }

  async function handleToggleChatbot() {
    if (!page) return;
    setTogglingChatbot(true);
    const res = await fetch(`/api/pages/${page.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatbotEnabled: !page.chatbotEnabled }),
    });
    if (res.ok) {
      setPage((prev) => prev ? { ...prev, chatbotEnabled: !prev.chatbotEnabled } : null);
    }
    setTogglingChatbot(false);
  }

  if (!page) return null;

  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">{page.businessName}</h1>
          {page.isPublished && (
            <p className="text-sm text-green-600">
              {t('liveAt', { url: `${page.slug}.${domain}` })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Analytics */}
          <button
            onClick={() => router.push(`/${locale}/pages/${pageId}/analytics`)}
            className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
            {t('analytics')}
          </button>
          {/* Chatbot toggle */}
          <button
            onClick={handleToggleChatbot}
            disabled={togglingChatbot}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              page.chatbotEnabled
                ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-400'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400'
            }`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {t('chatbot')} {page.chatbotEnabled ? t('chatbotOn') : t('chatbotOff')}
          </button>
          <button
            onClick={() => router.push(`/${locale}/pages`)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-700"
          >
            {t('title')}
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {publishing ? '...' : page.isPublished ? t('unpublish') : t('publish')}
          </button>
        </div>
      </div>

      {/* Editor */}
      <PageEditor
        pageId={page.id}
        initialConfig={page.pageConfig}
        templateSchema={{
          sections: page.template.schema?.sections || [],
        }}
        colorSchemes={page.template.schema?.colorSchemes || []}
        fonts={page.template.schema?.fonts || ['Inter']}
      />
    </div>
  );
}
