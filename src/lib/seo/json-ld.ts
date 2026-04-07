import type { PageConfig, SectionConfig } from '@/types';

interface BusinessPageData {
  businessName: string;
  seoDescription: string | null;
  tagline: string | null;
  seoImageUrl: string | null;
  wizardAnswers: Record<string, unknown> | null;
  pageConfig: PageConfig;
}

function findSection(config: PageConfig, type: string): SectionConfig | undefined {
  return config.sections?.find((s) => s.type === type && s.visible !== false);
}

/**
 * Build rich LocalBusiness JSON-LD from page data + section configs.
 * Includes services, FAQ, opening hours, and social links when available.
 */
export function buildBusinessJsonLd(page: BusinessPageData, url: string) {
  const config = page.pageConfig;
  const wizard = page.wizardAnswers as Record<string, unknown> | null;

  // Base LocalBusiness schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: page.businessName,
    description: page.seoDescription || page.tagline || '',
    url,
    ...(page.seoImageUrl && { image: page.seoImageUrl }),
  };

  // Industry from wizard
  if (wizard?.industry) {
    jsonLd.additionalType = String(wizard.industry);
  }

  // Services → hasOfferCatalog
  const servicesSection = findSection(config, 'services');
  const serviceItems = (servicesSection?.config as { items?: Array<{ title?: string; description?: string; price?: string }> })?.items;
  if (serviceItems?.length) {
    jsonLd.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: serviceItems
        .filter((s) => s.title)
        .map((s) => ({
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: s.title,
            ...(s.description && { description: s.description }),
          },
          ...(s.price && { price: s.price, priceCurrency: 'ILS' }),
        })),
    };
  }

  // FAQ → FAQPage schema (can coexist as nested graph)
  const faqSection = findSection(config, 'faq');
  const faqItems = (faqSection?.config as { items?: Array<{ question?: string; answer?: string }> })?.items;
  if (faqItems?.length) {
    jsonLd.mainEntity = faqItems
      .filter((f) => f.question && f.answer)
      .map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.answer,
        },
      }));
  }

  // Opening hours
  const hoursSection = findSection(config, 'hours');
  const schedule = (hoursSection?.config as { schedule?: Array<{ days?: string; hours?: string }> })?.schedule;
  if (schedule?.length) {
    jsonLd.openingHoursSpecification = schedule
      .filter((s) => s.days && s.hours)
      .map((s) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: s.days,
        opens: s.hours?.split('-')[0]?.trim() || '',
        closes: s.hours?.split('-')[1]?.trim() || '',
      }));
  }

  // Social links from wizard
  const socialLinks = wizard?.socialLinks as Record<string, string> | undefined;
  if (socialLinks) {
    const sameAs = Object.values(socialLinks).filter((v) => v && typeof v === 'string' && v.startsWith('http'));
    if (sameAs.length) {
      jsonLd.sameAs = sameAs;
    }
  }

  // Keywords from wizard
  if (wizard?.targetAudience) {
    jsonLd.audience = {
      '@type': 'Audience',
      audienceType: String(wizard.targetAudience),
    };
  }

  if (wizard?.problemSolved) {
    jsonLd.knowsAbout = String(wizard.problemSolved);
  }

  return jsonLd;
}

/**
 * Build a separate FAQPage schema for rich snippet eligibility.
 * Google requires FAQPage as a standalone type for FAQ rich results.
 */
export function buildFaqJsonLd(config: PageConfig, url: string) {
  const faqSection = findSection(config, 'faq');
  const faqItems = (faqSection?.config as { items?: Array<{ question?: string; answer?: string }> })?.items;
  if (!faqItems?.length) return null;

  const validItems = faqItems.filter((f) => f.question && f.answer);
  if (!validItems.length) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    url,
    mainEntity: validItems.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

/**
 * Build Organization schema for the SNAP.Cards platform itself.
 */
export function buildOrganizationJsonLd(domain: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SNAP.Cards',
    url: `https://${domain}`,
    logo: `https://${domain}/icon.png`,
    description: 'AI-powered business networking platform. Create professional business pages, scan business cards, and connect with professionals.',
    sameAs: [],
    foundingDate: '2024',
    applicationCategory: 'BusinessApplication',
  };
}

/**
 * Build WebSite schema with potential search action.
 */
export function buildWebSiteJsonLd(domain: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SNAP.Cards',
    url: `https://${domain}`,
    description: 'AI-powered business networking platform. Create professional business pages, scan business cards, and connect with professionals.',
    inLanguage: ['en', 'he'],
    publisher: {
      '@type': 'Organization',
      name: 'SNAP.Cards',
      url: `https://${domain}`,
    },
  };
}

/**
 * Build SoftwareApplication schema for the platform.
 */
export function buildSoftwareAppJsonLd(domain: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'SNAP.Cards',
    url: `https://${domain}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: 'AI-powered business networking platform. Create professional business pages, scan business cards with OCR, manage contacts, and grow your professional network.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        description: '1 business page, card scanning, contacts, social feed, messaging',
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '20',
        priceCurrency: 'USD',
        priceSpecification: {
          '@type': 'UnitPriceSpecification',
          price: '20',
          priceCurrency: 'USD',
          billingDuration: 'P1M',
        },
        description: 'Up to 10 pages, AI chatbot, custom domains, analytics, lead export',
      },
    ],
    featureList: [
      'AI Business Page Builder',
      'Business Card Scanner with OCR',
      'QR & NFC Card Sharing',
      'Social Feed & Messaging',
      'AI Chatbot',
      'Google Calendar Booking',
      'Analytics Dashboard',
      'Custom Domains',
      'Hebrew & English (RTL)',
    ],
  };
}
