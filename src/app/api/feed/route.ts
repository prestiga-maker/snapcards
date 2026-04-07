import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { moderatePost, incrementTrustScore, flagContent } from '@/lib/services/moderation';

// GET: Fetch feed posts with cursor-based pagination
export async function GET(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get('cursor'); // post ID for pagination
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

  // Get user's connections for visibility filtering
  const connections = await prisma.connection.findMany({
    where: {
      status: 'accepted',
      OR: [
        { requesterId: user.id },
        { receiverId: user.id },
      ],
    },
    select: { requesterId: true, receiverId: true },
  });

  const connectionUserIds = connections.map((c) =>
    c.requesterId === user.id ? c.receiverId : c.requesterId
  );

  // Feed shows: own posts + connections' public posts + connections-only posts from connections
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {
    deletedAt: null,
    moderationStatus: 'approved',
    OR: [
      // Own posts (any visibility)
      { userId: user.id },
      // Connections' posts (public or connections-only)
      {
        userId: { in: connectionUserIds },
        visibility: { in: ['public', 'connections'] },
      },
      // Public posts from anyone (for discovery)
      { visibility: 'public' },
    ],
  };

  if (cursor) {
    where.id = { lt: BigInt(cursor) };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1, // +1 to check if there are more
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
      sharedPost: {
        include: {
          user: {
            select: { id: true, displayName: true, avatarUrl: true },
          },
        },
      },
      _count: {
        select: { comments: { where: { deletedAt: null } } },
      },
    },
  });

  const hasMore = posts.length > limit;
  const sliced = hasMore ? posts.slice(0, limit) : posts;

  // Check which posts the current user has liked
  const postIds = sliced.map((p) => p.id);
  const userLikes = await prisma.like.findMany({
    where: {
      userId: user.id,
      likeableType: 'post',
      likeableId: { in: postIds },
    },
    select: { likeableId: true },
  });
  const likedPostIds = new Set(userLikes.map((l) => l.likeableId));

  const mapped = sliced.map((post) => ({
    id: post.id.toString(),
    content: post.content,
    postType: post.postType,
    mediaUrls: post.mediaUrls,
    visibility: post.visibility,
    likeCount: post.likeCount,
    commentCount: post._count.comments,
    shareCount: post.shareCount,
    isLiked: likedPostIds.has(post.id),
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
  }));

  return NextResponse.json({
    posts: mapped,
    nextCursor: hasMore ? sliced[sliced.length - 1].id.toString() : null,
  });
}

// POST: Create a new post
export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const body = await request.json();
  const { content, mediaUrls, postType, visibility } = body;

  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'Content is required' }, { status: 400 });
  }

  if (content.length > 5000) {
    return NextResponse.json({ error: 'Content too long (max 5000 chars)' }, { status: 400 });
  }

  // Moderation check
  const isFlagged = flagContent(content);
  const moderationStatus = isFlagged ? 'pending' : await moderatePost(user.id);

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      content: content.trim(),
      postType: postType || 'text',
      visibility: visibility || 'public',
      moderationStatus,
      ...(mediaUrls && { mediaUrls: JSON.parse(JSON.stringify(mediaUrls)) }),
    },
    include: {
      user: {
        select: { id: true, displayName: true, avatarUrl: true },
      },
    },
  });

  // Increment trust score for approved posts
  if (moderationStatus === 'approved') {
    await incrementTrustScore(user.id, 1);
  }

  return NextResponse.json({
    post: {
      id: post.id.toString(),
      content: post.content,
      postType: post.postType,
      mediaUrls: post.mediaUrls,
      visibility: post.visibility,
      moderationStatus: post.moderationStatus,
      likeCount: 0,
      commentCount: 0,
      shareCount: 0,
      isLiked: false,
      isOwn: true,
      createdAt: post.createdAt.toISOString(),
      user: {
        id: post.user.id.toString(),
        displayName: post.user.displayName,
        avatarUrl: post.user.avatarUrl,
      },
      sharedPost: null,
    },
  }, { status: 201 });
}
