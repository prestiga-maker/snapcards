import { prisma } from '@/lib/db';

interface KnowledgeBase {
  businessName: string;
  tagline: string | null;
  category: string;
  wizardInfo: Record<string, unknown>;
  sections: Array<{ type: string; content: Record<string, unknown> }>;
  socialData: Record<string, unknown> | null;
  compiledAt: string;
}

/**
 * Compile all business page data into a knowledge base for the AI chatbot.
 * Sources: wizard answers, page sections, scraped social data.
 */
export async function compileKnowledgeBase(pageId: bigint): Promise<KnowledgeBase> {
  const page = await prisma.businessPage.findUniqueOrThrow({
    where: { id: pageId },
    include: {
      template: { select: { category: true } },
      sections: {
        where: { isVisible: true },
        orderBy: { sortOrder: 'asc' },
        select: { sectionType: true, config: true },
      },
    },
  });

  const kb: KnowledgeBase = {
    businessName: page.businessName,
    tagline: page.tagline,
    category: page.template.category,
    wizardInfo: (page.wizardAnswers as Record<string, unknown>) || {},
    sections: page.sections.map((s) => ({
      type: s.sectionType,
      content: s.config as Record<string, unknown>,
    })),
    socialData: (page.scrapedSocialData as Record<string, unknown>) || null,
    compiledAt: new Date().toISOString(),
  };

  // Store compiled KB on the page
  await prisma.businessPage.update({
    where: { id: pageId },
    data: { chatbotKnowledgeBase: JSON.parse(JSON.stringify(kb)) },
  });

  return kb;
}

/**
 * Get or compile the knowledge base for a page.
 * Returns cached version if available, otherwise compiles fresh.
 */
export async function getKnowledgeBase(pageId: bigint): Promise<KnowledgeBase> {
  const page = await prisma.businessPage.findUniqueOrThrow({
    where: { id: pageId },
    select: { chatbotKnowledgeBase: true },
  });

  if (page.chatbotKnowledgeBase) {
    return page.chatbotKnowledgeBase as unknown as KnowledgeBase;
  }

  return compileKnowledgeBase(pageId);
}

/**
 * Build a system prompt for the chatbot from the knowledge base.
 */
export function buildChatbotSystemPrompt(kb: KnowledgeBase): string {
  const parts: string[] = [
    `You are a helpful AI assistant for "${kb.businessName}"${kb.tagline ? ` — ${kb.tagline}` : ''}.`,
    `Business category: ${kb.category}.`,
    '',
    'Your job is to answer customer questions about this business accurately and helpfully.',
    'Be friendly, professional, and concise. If you are unsure about something, say so honestly.',
    'If a customer wants to book an appointment or meeting, help them with the booking flow.',
    'If you detect the customer needs to speak with a human, indicate that you will escalate.',
    '',
    '--- BUSINESS INFORMATION ---',
  ];

  // Wizard answers
  if (Object.keys(kb.wizardInfo).length > 0) {
    parts.push('');
    parts.push('Business Details:');
    for (const [key, value] of Object.entries(kb.wizardInfo)) {
      if (value && typeof value === 'string') {
        parts.push(`- ${key}: ${value}`);
      } else if (value && typeof value === 'object') {
        parts.push(`- ${key}: ${JSON.stringify(value)}`);
      }
    }
  }

  // Sections
  if (kb.sections.length > 0) {
    for (const section of kb.sections) {
      parts.push('');
      parts.push(`[${section.type.toUpperCase()}]`);
      parts.push(formatSectionContent(section.type, section.content));
    }
  }

  // Social data
  if (kb.socialData && Object.keys(kb.socialData).length > 0) {
    parts.push('');
    parts.push('Social Media / Additional Info:');
    parts.push(JSON.stringify(kb.socialData, null, 2));
  }

  parts.push('');
  parts.push('--- END BUSINESS INFORMATION ---');
  parts.push('');
  parts.push('Rules:');
  parts.push('1. Only answer based on the business information above.');
  parts.push('2. Do not invent services, prices, or hours not listed.');
  parts.push('3. If asked something outside the business scope, politely redirect.');
  parts.push('4. Keep responses under 200 words unless the customer asks for detail.');
  parts.push('5. If the customer provides their name, email, or phone, acknowledge it.');
  parts.push('6. Respond in the same language the customer uses.');

  return parts.join('\n');
}

function formatSectionContent(type: string, content: Record<string, unknown>): string {
  const lines: string[] = [];

  switch (type) {
    case 'services': {
      const items = content.items as Array<{ title: string; description?: string; price?: string }> | undefined;
      if (items) {
        for (const item of items) {
          lines.push(`- ${item.title}${item.price ? ` (${item.price})` : ''}${item.description ? `: ${item.description}` : ''}`);
        }
      }
      break;
    }
    case 'menu': {
      const categories = content.categories as Array<{ name: string; items: Array<{ name: string; price?: string; description?: string }> }> | undefined;
      if (categories) {
        for (const cat of categories) {
          lines.push(`${cat.name}:`);
          for (const item of cat.items) {
            lines.push(`  - ${item.name}${item.price ? ` — ${item.price}` : ''}${item.description ? `: ${item.description}` : ''}`);
          }
        }
      }
      break;
    }
    case 'hours': {
      const schedule = content.schedule as Array<{ day: string; hours: string }> | undefined;
      if (schedule) {
        for (const day of schedule) {
          lines.push(`- ${day.day}: ${day.hours}`);
        }
      }
      break;
    }
    case 'faq': {
      const questions = content.questions as Array<{ question: string; answer: string }> | undefined;
      if (questions) {
        for (const q of questions) {
          lines.push(`Q: ${q.question}`);
          lines.push(`A: ${q.answer}`);
        }
      }
      break;
    }
    case 'contact': {
      if (content.email) lines.push(`Email: ${content.email}`);
      if (content.phone) lines.push(`Phone: ${content.phone}`);
      if (content.address) lines.push(`Address: ${content.address}`);
      break;
    }
    default:
      // Generic: dump relevant string/array fields
      for (const [key, val] of Object.entries(content)) {
        if (typeof val === 'string' && val.length > 0) {
          lines.push(`${key}: ${val}`);
        } else if (Array.isArray(val)) {
          lines.push(`${key}: ${JSON.stringify(val)}`);
        }
      }
  }

  return lines.join('\n');
}
