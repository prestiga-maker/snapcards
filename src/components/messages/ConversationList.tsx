'use client';

import { useTranslations } from 'next-intl';

interface ConversationSummary {
  id: string;
  participants: { id: string; displayName: string; avatarUrl: string | null }[];
  lastMessage: {
    content: string;
    senderId: string | null;
    senderType: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface ConversationListProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  const t = useTranslations('messages');

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conv) => {
        const other = conv.participants[0];
        const isActive = conv.id === activeId;

        // Format time
        let timeStr = '';
        if (conv.lastMessage) {
          const date = new Date(conv.lastMessage.createdAt);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
          if (diffDays === 0) {
            timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } else if (diffDays === 1) {
            timeStr = t('yesterday');
          } else {
            timeStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          }
        }

        return (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={`flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
              isActive ? 'bg-blue-50 dark:bg-blue-950' : ''
            }`}
          >
            {/* Avatar */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-bold text-white">
              {other?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={other.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                other?.displayName[0]?.toUpperCase() || '?'
              )}
            </div>

            {/* Name + last message */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className={`truncate text-sm font-semibold ${conv.unreadCount > 0 ? '' : 'font-medium'}`}>
                  {other?.displayName || 'Unknown'}
                </span>
                <span className="shrink-0 text-xs text-gray-400">{timeStr}</span>
              </div>
              {conv.lastMessage && (
                <p className={`truncate text-xs ${conv.unreadCount > 0 ? 'font-medium text-gray-700 dark:text-gray-300' : 'text-gray-400'}`}>
                  {conv.lastMessage.content}
                </p>
              )}
            </div>

            {/* Unread badge */}
            {conv.unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                {conv.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
