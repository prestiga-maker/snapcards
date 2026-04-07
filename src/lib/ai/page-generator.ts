import { getAIProvider } from './index';
import type { WizardAnswers, PageConfig, SectionConfig } from '@/types';

interface GeneratePageContentOptions {
  templatePrompt: string;
  templateSchema: { sections: Array<{ type: string; label: string; required: boolean; fields: Record<string, unknown> }> };
  wizardAnswers: WizardAnswers;
  scrapedData: Record<string, unknown> | null;
  locale: string;
  colorScheme: { primary: string; secondary: string; accent: string };
  fontFamily: string;
}

function buildSectionPrompt(schema: GeneratePageContentOptions['templateSchema']): string {
  const sectionList = schema.sections
    .map((s) => {
      const fieldNames = Object.keys(s.fields).join(', ');
      return `- "${s.type}" (${s.label}): fields: ${fieldNames}`;
    })
    .join('\n');

  return `Generate content for these sections:\n${sectionList}`;
}

export async function generatePageContent(
  options: GeneratePageContentOptions
): Promise<PageConfig> {
  const ai = getAIProvider();

  const wizardText = Object.entries(options.wizardAnswers)
    .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
    .join('\n');

  const scrapedText = options.scrapedData
    ? JSON.stringify(options.scrapedData, null, 2)
    : 'No social media data available.';

  const systemPrompt = options.templatePrompt
    .replace('{wizardAnswers}', wizardText)
    .replace('{scrapedData}', scrapedText)
    .replace('{locale}', options.locale === 'he' ? 'Hebrew' : 'English');

  const userPrompt = `${buildSectionPrompt(options.templateSchema)}

Return a JSON object with this exact structure:
{
  "sections": [
    {
      "type": "<section_type>",
      "config": { <section fields with generated content> }
    }
  ]
}

Important:
- Generate content for ALL sections listed above
- For array fields (items, categories, etc.), generate 3-5 realistic items
- For testimonials, create believable but fictional reviews
- For FAQ, generate 4-6 common questions relevant to this business
- All text should be in ${options.locale === 'he' ? 'Hebrew' : 'English'}
- Be concise and professional
- Return ONLY valid JSON, no markdown fences`;

  const response = await ai.generate({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: 4096,
    temperature: 0.7,
  });

  let parsed: { sections: Array<{ type: string; config: Record<string, unknown> }> };
  try {
    // Strip markdown code fences if present
    const cleaned = response.content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error('Failed to parse AI response:', response.content.slice(0, 500));
    throw new Error('AI returned invalid JSON');
  }

  // Build PageConfig
  const sections: SectionConfig[] = parsed.sections.map((section, index) => ({
    id: `sec_${Date.now()}_${index}`,
    type: section.type,
    sortOrder: index,
    visible: true,
    config: section.config,
  }));

  return {
    sections,
    global: {
      colorScheme: options.colorScheme,
      fontFamily: options.fontFamily,
      logoUrl: null,
      faviconUrl: null,
      direction: options.locale === 'he' ? 'rtl' : 'ltr',
    },
  };
}
