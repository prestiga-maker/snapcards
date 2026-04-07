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
    <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={t('newPost')}
        rows={3}
        maxLength={5000}
        className="w-full resize-none rounded-lg border-0 bg-gray-50 p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800"
      />

      {/* Media previews */}
      {mediaUrls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {mediaUrls.map((url, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <button
                onClick={() => setMediaUrls((prev) => prev.filter((_, idx) => idx !== i))}
                className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Actions bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            📷 {t('addPhoto')}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {/* Visibility toggle */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {visibility === 'public' ? '🌐' : '🔗'} {visibility === 'public' ? t('public') : t('connectionsOnly')}
          </button>
          {showOptions && (
            <div className="flex gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-800">
              <button
                onClick={() => { setVisibility('public'); setShowOptions(false); }}
                className={`rounded-md px-2 py-1 text-xs ${visibility === 'public' ? 'bg-white shadow-sm dark:bg-gray-700' : ''}`}
              >
                🌐 {t('public')}
              </button>
              <button
                onClick={() => { setVisibility('connections'); setShowOptions(false); }}
                className={`rounded-md px-2 py-1 text-xs ${visibility === 'connections' ? 'bg-white shadow-sm dark:bg-gray-700' : ''}`}
              >
                🔗 {t('connectionsOnly')}
              </button>
            </div>
          )}
        </div>

        <button
          onClick={handlePost}
          disabled={posting || (!content.trim() && mediaUrls.length === 0)}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {posting ? t('posting') : t('post')}
        </button>
      </div>
    </div>
  );
}
