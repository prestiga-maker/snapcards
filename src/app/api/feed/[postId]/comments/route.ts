import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { flagContent } from '@/lib/services/moderation';

// POST: Add a comment to a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { postId } = await params;
  const { content, parentCommentId } = await request.json();

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (content.length > 2000) {
    return NextResponse.json({ error: 'Comment too long (max 2000 chars)' }, { status: 400 });
  }

  const postBigId = BigInt(postId);

  // Verify post exists
  const post = await prisma.post.findFirst({
    where: { id: postBigId, deletedAt: null },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Verify parent comment if replying
  if (parentCommentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: BigInt(parentCommentId), postId: postBigId, deletedAt: null },
    });
    if (!parent) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
    }
  }

  const isFlagged = flagContent(content);

  const comment = await prisma.comment.create({
    data: {
      postId: postBigId,
      userId: user.id,
      content: content.trim(),
      moderationStatus: isFlagged ? 'pending' : 'approved',
      ...(parentCommentId && { parentCommentId: BigInt(parentCommentId) }),
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  });

  // Increment comment count on post
  await prisma.post.update({
    where: { id: postBigId },
    data: { commentCount: { increment: 1 } },
  });

  // Notify post author (if not self-comment)
  if (post.userId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        type: 'post_comment',
        title: `${user.displayName} commented on your post`,
        body: content.slice(0, 100),
        data: JSON.parse(JSON.stringify({
          postId: post.id.toString(),
          commentId: comment.id.toString(),
        })),
      },
    });
  }

  return NextResponse.json({
    comment: {
      id: comment.id.toString(),
      content: comment.content,
      moderationStatus: comment.moderationStatus,
      createdAt: comment.createdAt.toISOString(),
      user: {
        id: comment.user.id.toString(),
        displayName: comment.user.displayName,
        avatarUrl: comment.user.avatarUrl,
      },
      replies: [],
    },
  }, { status: 201 });
}
