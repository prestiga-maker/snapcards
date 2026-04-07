import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { moderatePost } from '@/lib/services/moderation';

// POST: Share a post (creates a new post referencing the original)
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
  const { content } = await request.json();
  const postBigId = BigInt(postId);

  // Get original post
  const originalPost = await prisma.post.findFirst({
    where: { id: postBigId, deletedAt: null, moderationStatus: 'approved' },
  });

  if (!originalPost) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const moderationStatus = await moderatePost(user.id);

  // Create share post
  const sharePost = await prisma.post.create({
    data: {
      userId: user.id,
      content: content?.trim() || '',
      postType: 'share',
      sharedPostId: postBigId,
      visibility: 'public',
      moderationStatus,
    },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      sharedPost: {
        include: {
          user: { select: { id: true, displayName: true, avatarUrl: true } },
        },
      },
    },
  });

  // Increment share count on original
  await prisma.post.update({
    where: { id: postBigId },
    data: { shareCount: { increment: 1 } },
  });

  // Notify original author
  if (originalPost.userId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: originalPost.userId,
        type: 'post_shared',
        title: `${user.displayName} shared your post`,
        data: JSON.parse(JSON.stringify({
          postId: originalPost.id.toString(),
          sharePostId: sharePost.id.toString(),
        })),
      },
    });
  }

  return NextResponse.json({
    post: {
      id: sharePost.id.toString(),
      content: sharePost.content,
      postType: 'share',
      mediaUrls: null,
      visibility: sharePost.visibility,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      isLiked: false,
      isOwn: true,
      createdAt: sharePost.createdAt.toISOString(),
      user: {
        id: sharePost.user.id.toString(),
        displayName: sharePost.user.displayName,
        avatarUrl: sharePost.user.avatarUrl,
      },
      sharedPost: sharePost.sharedPost
        ? {
            id: sharePost.sharedPost.id.toString(),
            content: sharePost.sharedPost.content,
            mediaUrls: sharePost.sharedPost.mediaUrls,
            createdAt: sharePost.sharedPost.createdAt.toISOString(),
            user: {
              id: sharePost.sharedPost.user.id.toString(),
              displayName: sharePost.sharedPost.user.displayName,
              avatarUrl: sharePost.sharedPost.user.avatarUrl,
            },
          }
        : null,
    },
  }, { status: 201 });
}
