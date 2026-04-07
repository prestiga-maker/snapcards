import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAuth } from '@/lib/services/auth';
import { performOCR, extractCardFields } from '@/lib/services/ocr';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> }
) {
  let user;
  try {
    user = await requireAuth();
  } catch (res) {
    return res as Response;
  }

  const { scanId } = await params;

  const card = await prisma.scannedCard.findFirst({
    where: { id: BigInt(scanId), scannerUserId: user.id },
  });

  if (!card) {
    return NextResponse.json({ error: 'Scan not found' }, { status: 404 });
  }

  try {
    // Step 1: Google Cloud Vision OCR
    const ocrResult = await performOCR(card.cardImageUrl);

    // Step 2: If back image exists, OCR that too and merge
    let fullText = ocrResult.rawText;
    if (card.cardImageBackUrl) {
      try {
        const backOcr = await performOCR(card.cardImageBackUrl);
        fullText += '\n---BACK---\n' + backOcr.rawText;
      } catch (err) {
        console.warn('Back image OCR failed, continuing with front only:', err);
      }
    }

    // Step 3: LLM field extraction
    const fields = await extractCardFields(fullText, ocrResult.detectedLanguages);

    // Step 4: Update scanned_cards row
    await prisma.scannedCard.update({
      where: { id: card.id },
      data: {
        rawOcrText: fullText,
        firstName: fields.firstName,
        lastName: fields.lastName,
        jobTitle: fields.jobTitle,
        companyName: fields.companyName,
        email: fields.email,
        phone: fields.phone,
        website: fields.website,
        address: fields.address,
        socialLinks: Object.keys(fields.socialLinks).length > 0
          ? JSON.parse(JSON.stringify(fields.socialLinks))
          : undefined,
        confidenceScore: ocrResult.confidence,
      },
    });

    return NextResponse.json({
      fields,
      rawText: fullText,
      confidenceScore: ocrResult.confidence,
      detectedLanguages: ocrResult.detectedLanguages,
    });
  } catch (error) {
    console.error('OCR processing failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'OCR failed' },
      { status: 500 }
    );
  }
}
