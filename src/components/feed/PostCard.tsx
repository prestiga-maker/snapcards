'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface PostUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface SharedPost {
  id: string;
  content: string;
  mediaUrls: string[] | null;
  createdAt: string;
  user: PostUser;
}

interface Post {
  id: string;
  content: string;
  postType: string;
  mediaUrls: string[] | null;
  visibility: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isOwn: boolean;
  createdAt: string;
  moderationStatus?: string;
  user: PostUser;
  sharedPost: SharedPost | null;
}

interface PostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
  onLikeToggle?: (id: string, liked: boolean, count: number) => void;
}

function timeAgo(dateStr: string, t: ReturnType<typeof useTranslations>): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return t('justNow');
  if (minutes < 60) return t('minutesAgo', { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('daysAgo', { count: days });
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n > 0 ? n.toString() : '';
}

export function PostCard({ post, onDelete, onLikeToggle }: PostCardProps) {
  const t = useTranslations('feed');
  const router = useRouter();
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [shareComment, setShareComment] = useState('');
  const [sharing, setSharing] = useState(false);

  const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];

  async function handleLike() {
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const res = await fetch(`/api/feed/${post.id}/like`, { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
      onLikeToggle?.(post.id, data.liked, data.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  }

  async function handleDelete() {
    if (!confirm(t('confirmDeletePost'))) return;
    const res = await fetch(`/api/feed/${post.id}`, { method: 'DELETE' });
    if (res.ok) onDelete?.(post.id);
  }

  async function handleShare() {
    setSharing(true);
    try {
      const res = await fetch(`/api/feed/${post.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: shareComment }),
      });
      if (res.ok) {
        setShowShare(false);
        setShareComment('');
      }
    } finally {
      setSharing(false);
    }
  }

  const isPending = post.moderationStatus === 'pending';

  return (
    <article
      className={`rounded-2xl p-5 shadow-ambient transition-shadow hover:shadow-ambient-lg ${isPending ? 'opacity-60' : ''}`}
      style={{ background: 'var(--surface-container-lowest)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))' }}>
            {post.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.user.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              post.user.displayName[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--on-surface)' }}>{post.user.displayName}</p>
            <p className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>
              {timeAgo(post.createdAt, t)}
              {post.visibility === 'connections' && ' · Connections'}
            </p>
          </div>
        </div>

        {post.isOwn && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[var(--surface-container-low)]"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute end-0 top-9 z-20 min-w-[140px] rounded-xl p-1 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
                  <button
                    onClick={() => { setShowMenu(false); handleDelete(); }}
                    className="w-full rounded-lg px-3 py-2 text-start text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    {t('deletePost')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Moderation notice */}
      {isPending && (
        <div className="mt-3 rounded-xl px-4 py-2.5 text-xs font-medium" style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface-variant)' }}>
          {t('pendingModeration')}
        </div>
      )}

      {/* Share context */}
      {post.postType === 'share' && post.sharedPost && (
        <>
          {post.content && <p className="mt-4 whitespace-pre-wrap" style={{ color: 'var(--on-surface)' }}>{post.content}</p>}
          <div className="mt-3 rounded-xl p-4" style={{ background: 'var(--surface-container-low)' }}>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--primary), var(--primary-container))' }}>
                {post.sharedPost.user.displayName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--on-surface)' }}>{post.sharedPost.user.displayName}</span>
              <span className="text-xs" style={{ color: 'var(--on-surface-variant)' }}>{timeAgo(post.sharedPost.createdAt, t)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm" style={{ color: 'var(--on-surface)' }}>{post.sharedPost.content}</p>
            {Array.isArray(post.sharedPost.mediaUrls) && post.sharedPost.mediaUrls.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {post.sharedPost.mediaUrls.map((url: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="h-32 rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Regular post content */}
      {post.postType !== 'share' && (
        <>
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed" style={{ color: 'var(--on-surface)' }}>{post.content}</p>
          {mediaUrls.length > 0 && (
            <div className="mt-4 overflow-hidden rounded-xl">
              {mediaUrls.length === 1 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaUrls[0]} alt="" className="w-full rounded-xl object-cover" style={{ maxHeight: '360px' }} />
              ) : (
                <div className="flex gap-2 overflow-x-auto">
                  {mediaUrls.map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="h-48 rounded-xl object-cover" />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Action bar — no border, spacing only */}
      <div className="mt-4 flex items-center gap-1 pt-1">
        <button
          onClick={handleLike}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          style={{ color: liked ? 'var(--primary)' : 'var(--on-surface-variant)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? 'var(--primary)' : 'none'} stroke={liked ? 'var(--primary)' : 'currentColor'} strokeWidth="1.8">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {formatCount(likeCount)}
        </button>

        <button
          onClick={() => router.push(`/feed/${post.id}`)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {formatCount(post.commentCount)}
        </button>

        <button
          onClick={() => setShowShare(!showShare)}
          className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--on-surface-variant)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        </button>
      </div>

      {/* Share dialog */}
      {showShare && (
        <div className="mt-3 space-y-3 rounded-xl p-4" style={{ background: 'var(--surface-container-low)' }}>
          <textarea
            value={shareComment}
            onChange={(e) => setShareComment(e.target.value)}
            placeholder={t('addShareComment')}
            rows={2}
            className="w-full resize-none rounded-xl p-3 text-sm focus:outline-none"
            style={{ background: 'var(--surface-container-lowest)', color: 'var(--on-surface)' }}
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowShare(false)}
              className="rounded-xl px-4 py-2 text-sm font-medium"
              style={{ color: 'var(--on-surface-variant)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="gradient-primary rounded-xl px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {t('share')}
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
