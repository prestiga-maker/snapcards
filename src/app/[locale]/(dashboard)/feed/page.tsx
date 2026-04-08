'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { PostComposer } from '@/components/feed/PostComposer';
import { PostCard } from '@/components/feed/PostCard';

interface PostUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
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
  sharedPost: {
    id: string;
    content: string;
    mediaUrls: string[] | null;
    createdAt: string;
    user: PostUser;
  } | null;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export default function FeedPage() {
  const t = useTranslations('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const fetchPosts = useCallback(async (cursor?: string) => {
    const isMore = !!cursor;
    if (isMore) setLoadingMore(true); else setLoading(true);

    try {
      const params = new URLSearchParams({ limit: '10' });
      if (cursor) params.set('cursor', cursor);

      const res = await fetch(`/api/feed?${params}`);
      if (!res.ok) return;

      const data = await res.json();
      if (isMore) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setNextCursor(data.nextCursor);
    } finally {
      if (isMore) setLoadingMore(false); else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!nextCursor || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && nextCursor) {
          fetchPosts(nextCursor);
        }
      },
      { threshold: 0.1 }
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [nextCursor, loadingMore, fetchPosts]);

  function handlePostCreated(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleDelete(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  function handleLikeToggle(id: string, liked: boolean, count: number) {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isLiked: liked, likeCount: count } : p))
    );
  }

  return (
    <div className="space-y-5">
      {/* Editorial date header */}
      <div>
        <p className="text-sm" style={{ color: 'var(--on-surface-variant)' }}>{formatDate()}</p>
        <h1 className="text-display text-2xl sm:text-3xl">{t('dailySnap')}</h1>
      </div>

      <PostComposer onPostCreated={handlePostCreated} />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full" style={{ border: '3px solid var(--surface-container-low)', borderTopColor: 'var(--primary)' }} />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background: 'var(--surface-container-lowest)' }}>
          <p className="text-lg font-semibold" style={{ color: 'var(--on-surface)' }}>{t('noPostsYet')}</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--on-surface-variant)' }}>{t('noPostsHint')}</p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handleDelete}
                onLikeToggle={handleLikeToggle}
              />
            ))}
          </div>

          {/* Infinite scroll sentinel */}
          <div ref={observerRef} className="h-4" />

          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full" style={{ border: '3px solid var(--surface-container-low)', borderTopColor: 'var(--primary)' }} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
