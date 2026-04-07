'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ConnectionUser {
  id: string;
  otherUser: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
}

interface NewConversationModalProps {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function NewConversationModal({ onClose, onCreated }: NewConversationModalProps) {
  const t = useTranslations('messages');
  const [connections, setConnections] = useState<ConnectionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function fetchConnections() {
      try {
        const res = await fetch('/api/connections?status=accepted');
        if (!res.ok) return;
        const data = await res.json();
        setConnections(data.connections);
      } finally {
        setLoading(false);
      }
    }
    fetchConnections();
  }, []);

  async function handleSelect(userId: string) {
    setCreating(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (!res.ok) return;
      const data = await res.json();
      onCreated(data.conversationId);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('startConversation')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <p className="mb-3 text-sm text-gray-500">{t('chooseContact')}</p>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : connections.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            {t('noConversationsHint')}
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {connections.map((conn) => (
              <button
                key={conn.id}
                onClick={() => handleSelect(conn.otherUser.id)}
                disabled={creating}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start hover:bg-gray-100 disabled:opacity-50 dark:hover:bg-gray-800"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
                  {conn.otherUser.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conn.otherUser.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    conn.otherUser.displayName[0]?.toUpperCase()
                  )}
                </div>
                <span className="text-sm font-medium">{conn.otherUser.displayName}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
