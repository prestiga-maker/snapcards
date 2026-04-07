'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useParams } from 'next/navigation';
import { PostCard } from '@/components/feed/PostCard';

interface PostUser {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

interface CommentData {
  id: string;
  content: string;
  createdAt: string;
  user: PostUser;
  replies: CommentData[];
}

interface PostDetail {
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
  user: PostUser;
  sharedPost: {
    id: string;
    content: string;
    mediaUrls: string[] | null;
    createdAt: string;
    user: PostUser;
  } | null;
  comments: CommentData[];
}

function Comment({
  comment,
  postId,
  onReplyAdded,
}: {
  comment: CommentData;
  postId: string;
  onReplyAdded: (parentId: string, reply: CommentData) => void;
}) {
  const t = useTranslations('feed');
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleReply() {
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText, parentCommentId: comment.id }),
      });
      if (!res.ok) return;
      const data = await res.json();
      onReplyAdded(comment.id, data.comment);
      setReplyText('');
      setShowReplyInput(false);
      setShowReplies(true);
    } finally {
      setSubmitting(false);
    }
  }

  const timeDiff = Date.now() - new Date(comment.createdAt).getTime();
  const mins = Math.floor(timeDiff / 60000);
  const timeStr = mins < 1 ? t('justNow')
    : mins < 60 ? t('minutesAgo', { count: mins })
    : mins < 1440 ? t('hoursAgo', { count: Math.floor(mins / 60) })
    : t('daysAgo', { count: Math.floor(mins / 1440) });

  return (
    <div className="group">
      <div className="flex gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-gray-300 to-gray-500 text-xs font-bold text-white">
          {comment.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={comment.user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            comment.user.displayName[0]?.toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl bg-gray-100 px-3 py-2 dark:bg-gray-800">
            <span className="text-sm font-semibold">{comment.user.displayName}</span>
            <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
          </div>
          <div className="mt-0.5 flex items-center gap-3 ps-2 text-xs text-gray-400">
            <span>{timeStr}</span>
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="font-medium hover:text-gray-600 dark:hover:text-gray-300"
            >
              {t('reply')}
            </button>
          </div>
        </div>
      </div>

      {/* Reply input */}
      {showReplyInput && (
        <div className="ms-10 mt-2 flex gap-2">
          <input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
            }}
            placeholder={t('writeComment')}
            className="flex-1 rounded-full border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
          />
          <button
            onClick={handleReply}
            disabled={submitting || !replyText.trim()}
            className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            ↵
          </button>
        </div>
      )}

      {/* Replies */}
      {comment.replies.length > 0 && (
        <div className="ms-10 mt-1">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {t('viewReplies', { count: comment.replies.length })}
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowReplies(false)}
                className="mb-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {t('hideReplies')}
              </button>
              <div className="space-y-2 border-s-2 border-gray-200 ps-3 dark:border-gray-700">
                {comment.replies.map((reply) => (
                  <Comment key={reply.id} comment={reply} postId={postId} onReplyAdded={onReplyAdded} />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PostDetailPage() {
  const t = useTranslations('feed');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const postId = params.postId as string;

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = useCallback(async () => {
    try {
      const res = await fetch(`/api/feed/${postId}`);
      if (!res.ok) {
        router.push('/feed');
        return;
      }
      const data = await res.json();
      setPost(data.post);
    } finally {
      setLoading(false);
    }
  }, [postId, router]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  async function handleComment() {
    if (!commentText.trim() || !post) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setPost((prev) =>
        prev ? { ...prev, comments: [...prev.comments, data.comment], commentCount: prev.commentCount + 1 } : prev
      );
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReplyAdded(parentId: string, reply: CommentData) {
    setPost((prev) => {
      if (!prev) return prev;
      const addReply = (comments: CommentData[]): CommentData[] =>
        comments.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...c.replies, reply] };
          }
          return { ...c, replies: addReply(c.replies) };
        });
      return { ...prev, comments: addReply(prev.comments) };
    });
  }

  function handleDelete() {
    router.push('/feed');
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <button
        onClick={() => router.push('/feed')}
        className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
      >
        ← {tCommon('back')}
      </button>

      <PostCard post={post} onDelete={handleDelete} />

      {/* Comment composer */}
      <div className="flex gap-2">
        <input
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleComment();
            }
          }}
          placeholder={t('writeComment')}
          className="flex-1 rounded-full border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
        />
        <button
          onClick={handleComment}
          disabled={submitting || !commentText.trim()}
          className="rounded-full bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          ↵
        </button>
      </div>

      {/* Comments thread */}
      {post.comments.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold">{t('comments')} ({post.commentCount})</h3>
          {post.comments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              postId={post.id}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
}
