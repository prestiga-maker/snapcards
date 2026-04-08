'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';

interface PostData {
  id: string;
  content: string;
  postType: string;
  mediaUrls: string[] | null;
  visibility: string;
  moderationStatus?: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  isLiked: boolean;
  isOwn: boolean;
  createdAt: string;
  user: { id: string; displayName: string; avatarUrl: string | null };
  sharedPost: null;
}

interface PostComposerProps {
  onPostCreated: (post: PostData) => void;
}

export function PostComposer({ onPostCreated }: PostComposerProps) {
  const t = useTranslations('feed');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'connections'>('public');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handlePost() {
    if (!content.trim() && mediaUrls.length === 0) return;
    setPosting(true);

    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          postType: mediaUrls.length > 0 ? 'image' : 'text',
          visibility,
          mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to post');
      }

      const data = await res.json();
      onPostCreated(data.post);
      setContent('');
      setMediaUrls([]);
      setShowOptions(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to post');
    } finally {
      setPosting(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'post');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setMediaUrls((prev) => [...prev, data.url]);
    } catch {
      alert('Failed to upload image');
    }
  }

  return (
    <div className="rounded-2xl p-4 shadow-ambient" style={{ background: 'var(--surface-container-lowest)' }}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('newPost')}
        rows={3}
        maxLength={5000}
        className="w-full resize-none rounded-xl p-3 text-sm focus:outline-none"
        style={{ background: 'var(--surface-container-low)', color: 'var(--on-surface)' }}
      />

      {/* Media previews */}
      {mediaUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-xl object-cover" />
              <button
                onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: 'var(--primary)' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-container-low)]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
            </svg>
            {t('addPhoto')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-[var(--surface-container-low)]"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            {visibility === 'public' ? t('public') : t('connectionsOnly')}
          </button>

          {showOptions && (
            <div className="flex gap-0.5 rounded-xl p-0.5" style={{ background: 'var(--surface-container-low)' }}>
              <button
                onClick={() => { setVisibility('public'); setShowOptions(false); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${visibility === 'public' ? 'shadow-ambient' : ''}`}
                style={{ background: visibility === 'public' ? 'var(--surface-container-lowest)' : 'transparent' }}
              >
                {t('public')}
              </button>
              <button
                onClick={() => { setVisibility('connections'); setShowOptions(false); }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${visibility === 'connections' ? 'shadow-ambient' : ''}`}
                style={{ background: visibility === 'connections' ? 'var(--surface-container-lowest)' : 'transparent' }}
              >
                {t('connectionsOnly')}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handlePost}
          disabled={posting || (!content.trim() && mediaUrls.length === 0)}
          className="gradient-primary rounded-xl px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {posting ? t('posting') : t('post')}
        </button>
      </div>
    </div>
  );
}
