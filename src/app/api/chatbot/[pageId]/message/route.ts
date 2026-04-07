import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAIProvider } from '@/lib/ai';
import { getKnowledgeBase, buildChatbotSystemPrompt } from '@/lib/services/knowledge-base';
import { checkRateLimit, getClientIp } from '@/lib/services/rate-limit';

const MAX_MESSAGES_PER_CONVERSATION = 50;
const MAX_HISTORY_CONTEXT = 10;

interface RouteContext {
  params: Promise<{ pageId: string }>;
}

// POST: Public chatbot message endpoint (no auth required)
export async function POST(request: NextRequest, context: RouteContext) {
  // Rate limit: 30 messages per minute per IP
  const ip = getClientIp(request);
  const rl = checkRateLimit(`chatbot:${ip}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { pageId: pageIdStr } = await context.params;
  const pageId = BigInt(pageIdStr);

  // Validate page exists, is published, and has chatbot enabled
  const page = await prisma.businessPage.findUnique({
    where: { id: pageId, isPublished: true },
    select: {
      id: true,
      chatbotEnabled: true,
      userId: true,
      businessName: true,
    },
  });

  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  if (!page.chatbotEnabled) {
    return NextResponse.json({ error: 'Chatbot not enabled' }, { status: 403 });
  }

  const body = await request.json();
  const { message, conversationId: existingConvId, visitorName, visitorEmail, visitorPhone } = body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  if (message.length > 2000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400 });
  }

  // Get or create conversation
  let conversationId: bigint;

  if (existingConvId) {
    conversationId = BigInt(existingConvId);
    // Verify conversation belongs to this page
    const conv = await prisma.conversation.findFirst({
      where: { id: conversationId, businessPageId: pageId, type: 'chatbot' },
    });
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Rate limit: check message count
    const msgCount = await prisma.message.count({
      where: { conversationId },
    });
    if (msgCount >= MAX_MESSAGES_PER_CONVERSATION * 2) {
      return NextResponse.json({ error: 'Conversation limit reached' }, { status: 429 });
    }
  } else {
    // Create new chatbot conversation
    const conv = await prisma.conversation.create({
      data: {
        type: 'chatbot',
        businessPageId: pageId,
      },
    });
    conversationId = conv.id;

    // Track analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.pageAnalytics.upsert({
      where: {
        uq_analytics_date: { businessPageId: pageId, date: today },
      },
      update: { chatbotConversations: { increment: 1 } },
      create: {
        businessPageId: pageId,
        date: today,
        chatbotConversations: 1,
      },
    });
  }

  // Save visitor message
  await prisma.message.create({
    data: {
      conversationId,
      senderType: 'user',
      content: message.trim(),
    },
  });

  // Get conversation history for context
  const history = await prisma.message.findMany({
    where: { conversationId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    take: MAX_HISTORY_CONTEXT,
    select: { senderType: true, content: true },
  });

  // Build AI messages
  const kb = await getKnowledgeBase(pageId);
  const systemPrompt = buildChatbotSystemPrompt(kb);

  const aiMessages = [
    { role: 'system' as const, content: systemPrompt },
    // History in chronological order
    ...history.reverse().map((m) => ({
      role: (m.senderType === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // Generate AI response
  const ai = getAIProvider();
  let aiResponse: string;
  let shouldEscalate = false;

  try {
    const result = await ai.generate({
      messages: aiMessages,
      maxTokens: 500,
      temperature: 0.5,
    });
    aiResponse = result.content;

    // Detect low confidence / escalation signals
    const lowerResponse = aiResponse.toLowerCase();
    if (
      lowerResponse.includes("i'm not sure") ||
      lowerResponse.includes("i don't have that information") ||
      lowerResponse.includes('speak with') ||
      lowerResponse.includes('contact the owner') ||
      lowerResponse.includes('escalat')
    ) {
      shouldEscalate = true;
    }
  } catch {
    aiResponse = "I'm sorry, I'm having trouble right now. Please try again in a moment, or contact the business directly.";
    shouldEscalate = true;
  }

  // Save AI response
  const aiMsg = await prisma.message.create({
    data: {
      conversationId,
      senderType: 'ai_assistant',
      content: aiResponse,
      isEscalated: shouldEscalate,
      metadata: shouldEscalate ? JSON.parse(JSON.stringify({ escalationReason: 'low_confidence' })) : undefined,
    },
  });

  // If escalated, notify page owner
  if (shouldEscalate) {
    await prisma.notification.create({
      data: {
        userId: page.userId,
        type: 'chatbot_escalation',
        title: `Chatbot escalation on ${page.businessName}`,
        body: `A visitor needs help: "${message.trim().slice(0, 100)}"`,
        data: JSON.parse(JSON.stringify({
          conversationId: conversationId.toString(),
          pageId: pageId.toString(),
        })),
      },
    });
  }

  // Lead capture: if visitor provided contact info, save as lead
  if (visitorName || visitorEmail || visitorPhone) {
    await prisma.lead.create({
      data: {
        businessPageId: pageId,
        name: visitorName || null,
        email: visitorEmail || null,
        phone: visitorPhone || null,
        message: message.trim().slice(0, 500),
        source: 'chatbot',
        conversationId,
      },
    });

    // Track lead in analytics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    await prisma.pageAnalytics.upsert({
      where: {
        uq_analytics_date: { businessPageId: pageId, date: today },
      },
      update: { leadsGenerated: { increment: 1 } },
      create: {
        businessPageId: pageId,
        date: today,
        leadsGenerated: 1,
      },
    });
  }

  return NextResponse.json({
    conversationId: conversationId.toString(),
    message: {
      id: aiMsg.id.toString(),
      content: aiResponse,
      senderType: 'ai_assistant',
      isEscalated: shouldEscalate,
      createdAt: aiMsg.createdAt.toISOString(),
    },
  });
}
