import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';

// POST: Toggle like on a post
export async function POST(
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
  const postBigId = BigInt(postId);

  // Check post exists
  const post = await prisma.post.findFirst({
    where: { id: postBigId, deletedAt: null },
  });

  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  // Check if already liked
  const existing = await prisma.like.findUnique({
    where: {
      uq_like: { userId: user.id, likeableType: 'post', likeableId: postBigId },
    },
  });

  if (existing) {
    // Unlike
    await prisma.like.delete({ where: { id: existing.id } });
    await prisma.post.update({
      where: { id: postBigId },
      data: { likeCount: { decrement: 1 } },
    });

    return NextResponse.json({ liked: false, likeCount: Math.max(0, post.likeCount - 1) });
  }

  // Like
  await prisma.like.create({
    data: {
      userId: user.id,
      likeableType: 'post',
      likeableId: postBigId,
    },
  });

  await prisma.post.update({
    where: { id: postBigId },
    data: { likeCount: { increment: 1 } },
  });

  // Notify post author (if not self-like)
  if (post.userId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: post.userId,
        type: 'post_liked',
        title: `${user.displayName} liked your post`,
        data: JSON.parse(JSON.stringify({
          postId: post.id.toString(),
          likerId: user.id.toString(),
        })),
      },
    });
  }

  return NextResponse.json({ liked: true, likeCount: post.likeCount + 1 });
}
