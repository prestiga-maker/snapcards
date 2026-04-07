'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL = 60000; // 1 minute

export function NotificationBell() {
  const t = useTranslations('notifications');
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch('/api/notifications?limit=10');
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      } catch {
        // Silent fail
      }
    }

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  function handleNotificationClick(notif: Notification) {
    // Mark single as read
    fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds: [notif.id] }),
    });

    setOpen(false);

    // Navigate based on type
    const data = notif.data || {};
    switch (notif.type) {
      case 'connection_request':
      case 'connection_accepted':
        router.push(`/${locale}/contacts`);
        break;
      case 'post_liked':
      case 'post_comment':
      case 'post_shared':
        if (data.postId) router.push(`/${locale}/feed/${data.postId}`);
        else router.push(`/${locale}/feed`);
        break;
      case 'new_message':
        if (data.conversationId) router.push(`/${locale}/messages?conv=${data.conversationId}`);
        else router.push(`/${locale}/messages`);
        break;
      default:
        break;
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        aria-label={t('title')}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -end-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute end-0 top-full z-50 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
              <h3 className="font-semibold">{t('title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  {t('markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-400">
                  {t('noNotifications')}
                </p>
              ) : (
                notifications.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex w-full gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      !notif.isRead ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${!notif.isRead ? 'font-semibold' : ''}`}>
                        {notif.title}
                      </p>
                      {notif.body && (
                        <p className="mt-0.5 truncate text-xs text-gray-400">{notif.body}</p>
                      )}
                      <p className="mt-0.5 text-[10px] text-gray-400">
                        {timeAgo(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
