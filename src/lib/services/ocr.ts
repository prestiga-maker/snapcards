import { getAIProvider } from '@/lib/ai';

export interface OCRResult {
  rawText: string;
  confidence: number;
  detectedLanguages: string[];
}

export interface ExtractedCardFields {
  firstName: string | null;
  lastName: string | null;
  jobTitle: string | null;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  socialLinks: Record<string, string>;
}

/**
 * Call Google Cloud Vision API for OCR on a business card image.
 */
export async function performOCR(imageUrl: string): Promise<OCRResult> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_CLOUD_VISION_API_KEY not set');
  }

  // Determine if imageUrl is a remote URL or local path
  let imagePayload: Record<string, unknown>;

  if (imageUrl.startsWith('http')) {
    imagePayload = {
      source: { imageUri: imageUrl },
    };
  } else {
    // For local files, we need to read and base64 encode
    const fs = await import('fs/promises');
    const path = await import('path');
    const fullPath = imageUrl.startsWith('/')
      ? path.join(process.cwd(), 'public', imageUrl)
      : imageUrl;
    const buffer = await fs.readFile(fullPath);
    imagePayload = {
      content: buffer.toString('base64'),
    };
  }

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: imagePayload,
            features: [
              { type: 'TEXT_DETECTION', maxResults: 1 },
              { type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google Vision API error ${response.status}: ${error}`);
  }

  const data = await response.json();
  const annotations = data.responses?.[0];

  if (annotations?.error) {
    throw new Error(`Vision API error: ${annotations.error.message}`);
  }

  const fullText =
    annotations?.fullTextAnnotation?.text ||
    annotations?.textAnnotations?.[0]?.description ||
    '';

  // Extract confidence from pages
  const pages = annotations?.fullTextAnnotation?.pages || [];
  let totalConfidence = 0;
  let blockCount = 0;
  for (const page of pages) {
    for (const block of page.blocks || []) {
      if (block.confidence !== undefined) {
        totalConfidence += block.confidence;
        blockCount++;
      }
    }
  }
  const confidence = blockCount > 0 ? totalConfidence / blockCount : 0.5;

  // Detect languages
  const detectedLanguages: string[] = [];
  for (const page of pages) {
    const langs = page.property?.detectedLanguages || [];
    for (const lang of langs) {
      if (lang.languageCode && !detectedLanguages.includes(lang.languageCode)) {
        detectedLanguages.push(lang.languageCode);
      }
    }
  }

  // Check for Hebrew characters as fallback
  if (detectedLanguages.length === 0) {
    if (/[\u0590-\u05FF]/.test(fullText)) detectedLanguages.push('he');
    if (/[a-zA-Z]/.test(fullText)) detectedLanguages.push('en');
  }

  return {
    rawText: fullText,
    confidence: Math.round(confidence * 100) / 100,
    detectedLanguages,
  };
}

/**
 * Use LLM to extract structured fields from raw OCR text.
 */
export async function extractCardFields(
  rawText: string,
  detectedLanguages: string[]
): Promise<ExtractedCardFields> {
  const ai = getAIProvider();

  const languageHint = detectedLanguages.includes('he')
    ? 'The card contains Hebrew text. Names may be in Hebrew — transliterate if needed but prefer the original script.'
    : 'The card is primarily in English.';

  const response = await ai.generate({
    messages: [
      {
        role: 'system',
        content: `You are a business card data extraction specialist. Extract structured contact information from OCR text of business cards. ${languageHint}

Rules:
- Extract ONLY information that is clearly present in the text
- For phone numbers, preserve the original format including country codes
- For emails, ensure they are valid email addresses
- For websites, include the full URL (add https:// if missing)
- For social links, identify platforms by URL patterns (linkedin.com, facebook.com, instagram.com, etc.)
- If a field is not found, return null
- Names in Hebrew should be kept in Hebrew
- Separate first name and last name carefully
- Job titles may be in Hebrew or English — preserve the original language`,
      },
      {
        role: 'user',
        content: `Extract structured fields from this business card OCR text:

---
${rawText}
---

Return ONLY valid JSON with this structure:
{
  "firstName": "string or null",
  "lastName": "string or null",
  "jobTitle": "string or null",
  "companyName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "website": "string or null",
  "address": "string or null",
  "socialLinks": {"platform": "url", ...}
}`,
      },
    ],
    maxTokens: 1024,
    temperature: 0.1, // Low temperature for extraction accuracy
  });

  try {
    const cleaned = response.content
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();
    const parsed = JSON.parse(cleaned);

    return {
      firstName: parsed.firstName || null,
      lastName: parsed.lastName || null,
      jobTitle: parsed.jobTitle || null,
      companyName: parsed.companyName || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      website: parsed.website || null,
      address: parsed.address || null,
      socialLinks: parsed.socialLinks || {},
    };
  } catch {
    console.error('Failed to parse LLM extraction:', response.content.slice(0, 300));
    // Fallback: try to extract email and phone with regex
    const emailMatch = rawText.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
    const phoneMatch = rawText.match(/[\+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,}/);

    return {
      firstName: null,
      lastName: null,
      jobTitle: null,
      companyName: null,
      email: emailMatch?.[0] || null,
      phone: phoneMatch?.[0] || null,
      website: null,
      address: null,
      socialLinks: {},
    };
  }
}
