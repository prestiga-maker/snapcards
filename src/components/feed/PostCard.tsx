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
    // Optimistic update
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
    <div className={`rounded-xl border border-gray-200 p-4 dark:border-gray-700 ${isPending ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-bold text-white">
            {post.user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.user.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              post.user.displayName[0]?.toUpperCase()
            )}
          </div>
          <div>
            <p className="font-semibold">{post.user.displayName}</p>
            <p className="text-xs text-gray-400">
              {timeAgo(post.createdAt, t)}
              {post.visibility === 'connections' && ' · 🔗'}
            </p>
          </div>
        </div>

        {post.isOwn && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              ⋮
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute end-0 top-8 z-20 min-w-[130px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => { setShowMenu(false); handleDelete(); }}
                    className="w-full px-3 py-1.5 text-start text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
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
        <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-300">
          {t('pendingModeration')}
        </div>
      )}

      {/* Share context */}
      {post.postType === 'share' && post.sharedPost && (
        <>
          {post.content && <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>}
          <div className="mt-3 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-xs font-bold text-white">
                {post.sharedPost.user.displayName[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium">{post.sharedPost.user.displayName}</span>
              <span className="text-xs text-gray-400">{timeAgo(post.sharedPost.createdAt, t)}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm">{post.sharedPost.content}</p>
            {Array.isArray(post.sharedPost.mediaUrls) && post.sharedPost.mediaUrls.length > 0 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {post.sharedPost.mediaUrls.map((url: string, i: number) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={url} alt="" className="h-32 rounded-lg object-cover" />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Regular post content */}
      {post.postType !== 'share' && (
        <>
          <p className="mt-3 whitespace-pre-wrap text-sm">{post.content}</p>
          {mediaUrls.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {mediaUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={url} alt="" className="max-h-64 rounded-lg object-cover" />
              ))}
            </div>
          )}
        </>
      )}

      {/* Action bar */}
      <div className="mt-3 flex items-center gap-1 border-t border-gray-100 pt-3 dark:border-gray-800">
        <button
          onClick={handleLike}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
            liked
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          {liked ? '❤️' : '🤍'} {likeCount > 0 ? likeCount : ''} {liked ? t('liked') : t('like')}
        </button>

        <button
          onClick={() => router.push(`/feed/${post.id}`)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          💬 {post.commentCount > 0 ? post.commentCount : ''} {t('comment')}
        </button>

        <button
          onClick={() => setShowShare(!showShare)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          🔄 {post.shareCount > 0 ? post.shareCount : ''} {t('share')}
        </button>
      </div>

      {/* Share dialog */}
      {showShare && (
        <div className="mt-2 space-y-2 rounded-lg border border-gray-200 p-3 dark:border-gray-700">
          <textarea
            value={shareComment}
            onChange={(e) => setShareComment(e.target.value)}
            placeholder={t('addShareComment')}
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-300 p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowShare(false)}
              className="rounded-lg px-3 py-1.5 text-sm text-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {t('share')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
