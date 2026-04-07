'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { ConversationList } from '@/components/messages/ConversationList';
import { ChatView } from '@/components/messages/ChatView';
import { NewConversationModal } from '@/components/messages/NewConversationModal';

export interface ConversationSummary {
  id: string;
  type: string;
  participants: { id: string; displayName: string; avatarUrl: string | null }[];
  lastMessage: {
    content: string;
    senderId: string | null;
    senderType: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  isMuted: boolean;
  updatedAt: string;
}

export default function MessagesPage() {
  const t = useTranslations('messages');
  const searchParams = useSearchParams();
  const startWithUser = searchParams.get('user'); // Pre-open chat from contact page

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/messages');
      if (!res.ok) return;
      const data = await res.json();
      setConversations(data.conversations);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-open or create conversation with a specific user
  useEffect(() => {
    if (!startWithUser || loading) return;

    const existing = conversations.find((c) =>
      c.participants.some((p) => p.id === startWithUser)
    );

    if (existing) {
      setActiveConvId(existing.id);
    } else {
      // Create a new conversation
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: startWithUser }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.conversationId) {
            setActiveConvId(data.conversationId);
            fetchConversations();
          }
        });
    }
  }, [startWithUser, conversations, loading, fetchConversations]);

  function handleConversationCreated(convId: string) {
    setActiveConvId(convId);
    setShowNewModal(false);
    fetchConversations();
  }

  function handleMessageSent() {
    // Refresh conversation list to update last message
    fetchConversations();
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation list (sidebar) */}
      <div className={`w-full shrink-0 sm:w-80 ${activeConvId ? 'hidden sm:block' : ''}`}>
        <div className="flex h-full flex-col rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <h1 className="text-lg font-bold">{t('title')}</h1>
            <button
              onClick={() => setShowNewModal(true)}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              +
            </button>
          </div>

          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-4 text-center text-gray-500">
              <div className="mb-2 text-3xl">💬</div>
              <p className="text-sm">{t('noConversations')}</p>
              <p className="mt-1 text-xs">{t('noConversationsHint')}</p>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activeId={activeConvId}
              onSelect={setActiveConvId}
            />
          )}
        </div>
      </div>

      {/* Chat view (main area) */}
      <div className={`flex-1 ${!activeConvId ? 'hidden sm:flex' : 'flex'}`}>
        {activeConvId ? (
          <ChatView
            conversationId={activeConvId}
            onBack={() => setActiveConvId(null)}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-gray-200 text-gray-400 dark:border-gray-700">
            {t('selectConversation')}
          </div>
        )}
      </div>

      {/* New conversation modal */}
      {showNewModal && (
        <NewConversationModal
          onClose={() => setShowNewModal(false)}
          onCreated={handleConversationCreated}
        />
      )}
    </div>
  );
}
