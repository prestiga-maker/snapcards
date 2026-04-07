'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface MessageData {
  id: string;
  content: string;
  senderType: string;
  isOwn: boolean;
  createdAt: string;
  sender: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
}

interface ChatViewProps {
  conversationId: string;
  onBack: () => void;
  onMessageSent: () => void;
}

const POLL_INTERVAL = 30000; // 30 seconds

export function ChatView({ conversationId, onBack, onMessageSent }: ChatViewProps) {
  const t = useTranslations('messages');
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const latestTimestampRef = useRef<string>('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages/${conversationId}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages);
      if (data.messages.length > 0) {
        latestTimestampRef.current = data.messages[data.messages.length - 1].createdAt;
      }
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Poll for new messages
  const pollMessages = useCallback(async () => {
    if (!latestTimestampRef.current) return;

    try {
      const res = await fetch(
        `/api/messages/${conversationId}?after=${encodeURIComponent(latestTimestampRef.current)}`
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data.messages.length > 0) {
        setMessages((prev) => [...prev, ...data.messages]);
        latestTimestampRef.current = data.messages[data.messages.length - 1].createdAt;
      }
    } catch {
      // Silent fail for polling
    }
  }, [conversationId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Start polling
  useEffect(() => {
    pollRef.current = setInterval(pollMessages, POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [pollMessages]);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function handleSend() {
    if (!text.trim()) return;
    setSending(true);

    const messageText = text;
    setText('');

    try {
      const res = await fetch(`/api/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText }),
      });

      if (!res.ok) {
        setText(messageText); // Restore on failure
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      latestTimestampRef.current = data.message.createdAt;
      onMessageSent();
    } finally {
      setSending(false);
    }
  }

  // Group messages by date
  function formatMessageTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="flex flex-1 flex-col rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Chat header */}
      <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <button
          onClick={onBack}
          className="shrink-0 text-gray-500 hover:text-gray-700 sm:hidden dark:hover:text-gray-300"
        >
          ←
        </button>
        {messages.length > 0 && messages[0].sender && !messages[0].isOwn && (
          <>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
              {messages[0].sender.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={messages[0].sender.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                messages[0].sender.displayName[0]?.toUpperCase()
              )}
            </div>
            <span className="font-semibold">{messages[0].sender.displayName}</span>
          </>
        )}
        {messages.length > 0 && messages.find(m => !m.isOwn)?.sender && messages[0].isOwn && (
          <>
            {(() => {
              const other = messages.find(m => !m.isOwn)?.sender;
              if (!other) return null;
              return (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-sm font-bold text-white">
                    {other.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={other.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      other.displayName[0]?.toUpperCase()
                    )}
                  </div>
                  <span className="font-semibold">{other.displayName}</span>
                </>
              );
            })()}
          </>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            {t('typeMessage')}
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                    msg.isOwn
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  <p
                    className={`mt-0.5 text-end text-[10px] ${
                      msg.isOwn ? 'text-blue-200' : 'text-gray-400'
                    }`}
                  >
                    {formatMessageTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-3 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={t('typeMessage')}
            className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
