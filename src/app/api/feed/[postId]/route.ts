import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// GET: Single post with comments
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { postId } = await params;

  const post = await prisma.post.findFirst({
    where: { id: BigInt(postId), deletedAt: null },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      sharedPost: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
      comments: {
        where: { deletedAt: null, parentCommentId: null },
        orderBy: { createdAt: 'asc' },
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
          replies: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, displayName: true, avatarUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Check if user liked
  const liked = await prisma.like.findUnique({
    where: {
      uq_like: { userId: user.id, likeableType: 'post', likeableId: post.id },
    },
  });

  return NextResponse.json({
    post: {
      id: post.id.toString(),
      content: post.content,
      postType: post.postType,
      mediaUrls: post.mediaUrls,
      visibility: post.visibility,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      shareCount: post.shareCount,
      isLiked: !!liked,
      isOwn: post.userId === user.id,
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id.toString(),
        displayName: post.user.displayName,
        avatarUrl: post.user.avatarUrl,
      },
      sharedPost: post.sharedPost
        ? {
            id: post.sharedPost.id.toString(),
            content: post.sharedPost.content,
            mediaUrls: post.sharedPost.mediaUrls,
            createdAt: post.sharedPost.createdAt.toISOString(),
            user: {
              id: post.sharedPost.user.id.toString(),
              displayName: post.sharedPost.user.displayName,
              avatarUrl: post.sharedPost.user.avatarUrl,
            },
          }
        : null,
      comments: post.comments.map((c) => ({
        id: c.id.toString(),
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        user: {
          id: c.user.id.toString(),
          displayName: c.user.displayName,
          avatarUrl: c.user.avatarUrl,
        },
        replies: c.replies.map((r) => ({
          id: r.id.toString(),
          content: r.content,
          createdAt: r.createdAt.toISOString(),
          user: {
            id: r.user.id.toString(),
            displayName: r.user.displayName,
            avatarUrl: r.user.avatarUrl,
          },
        })),
      })),
    },
  });
}

// DELETE: Soft-delete own post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { postId } = await params;

  const post = await prisma.post.findFirst({
    where: { id: BigInt(postId), userId: user.id, deletedAt: null },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ success: true });
}
