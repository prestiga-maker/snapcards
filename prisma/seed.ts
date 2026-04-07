import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    slug: 'generic',
    name: 'Generic Business',
    category: 'generic',
    description: 'A versatile template for any type of business.',
    thumbnailUrl: '/templates/generic-thumb.jpg',
    sortOrder: 0,
    aiPromptTemplate: `You are a professional copywriter creating a business website. Based on the following business details, generate compelling, concise content for each section.

Business Details:
{wizardAnswers}

Social Media Context:
{scrapedData}

Generate content in {locale} language. Be professional but warm. Focus on the value proposition and what makes this business unique. Return JSON matching the section config structure.`,
    schema: {
      sections: [
        {
          type: 'hero',
          label: 'Hero Banner',
          required: true,
          fields: {
            headline: { type: 'text', maxLength: 100, aiGenerated: true },
            subheadline: { type: 'text', maxLength: 200, aiGenerated: true },
            backgroundImage: { type: 'image', aspect: '16:9' },
            cta: {
              type: 'object',
              fields: {
                text: { type: 'text', maxLength: 30 },
                action: { type: 'enum', options: ['scroll_to_contact', 'external_link', 'phone', 'whatsapp'] },
                value: { type: 'text' },
              },
            },
            layout: { type: 'enum', options: ['centered', 'left_aligned', 'split'], default: 'centered' },
          },
        },
        {
          type: 'about',
          label: 'About',
          required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            body: { type: 'richtext', aiGenerated: true },
            image: { type: 'image' },
          },
        },
        {
          type: 'services',
          label: 'Services',
          required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            items: {
              type: 'array',
              aiGenerated: true,
              itemFields: {
                title: { type: 'text' },
                description: { type: 'text' },
                icon: { type: 'text' },
                price: { type: 'text' },
              },
            },
          },
        },
        {
          type: 'testimonials',
          label: 'Testimonials',
          required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            items: {
              type: 'array',
              aiGenerated: true,
              itemFields: {
                quote: { type: 'text' },
                author: { type: 'text' },
                role: { type: 'text' },
                avatarUrl: { type: 'image' },
              },
            },
          },
        },
        {
          type: 'faq',
          label: 'FAQ',
          required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            items: {
              type: 'array',
              aiGenerated: true,
              itemFields: {
                question: { type: 'text' },
                answer: { type: 'text' },
              },
            },
          },
        },
        {
          type: 'contact',
          label: 'Contact',
          required: true,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            subheading: { type: 'text', aiGenerated: true },
            showForm: { type: 'boolean', default: true },
            showMap: { type: 'boolean', default: false },
            showPhone: { type: 'boolean', default: true },
            showEmail: { type: 'boolean', default: true },
            showWhatsapp: { type: 'boolean', default: true },
          },
        },
      ],
      colorSchemes: [
        { name: 'Modern Dark', primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560' },
        { name: 'Clean Light', primary: '#ffffff', secondary: '#f8f9fa', accent: '#0066ff' },
        { name: 'Warm Sunset', primary: '#fff8f0', secondary: '#fff0e0', accent: '#ff6b35' },
        { name: 'Ocean Blue', primary: '#f0f7ff', secondary: '#e0efff', accent: '#0077b6' },
        { name: 'Forest Green', primary: '#f0f9f4', secondary: '#e0f2e9', accent: '#2d6a4f' },
      ],
      fonts: ['Inter', 'Playfair Display', 'Heebo', 'Assistant', 'Poppins', 'Montserrat'],
    },
    defaultConfig: {
      sections: [],
      global: {
        colorScheme: { primary: '#ffffff', secondary: '#f8f9fa', accent: '#0066ff' },
        fontFamily: 'Inter',
        logoUrl: null,
        faviconUrl: null,
        direction: 'ltr',
      },
    },
  },
  {
    slug: 'restaurant',
    name: 'Restaurant & Café',
    category: 'restaurant',
    description: 'Perfect for restaurants, cafés, bakeries, and food businesses.',
    thumbnailUrl: '/templates/restaurant-thumb.jpg',
    sortOrder: 1,
    aiPromptTemplate: `You are a food & hospitality copywriter creating a restaurant website. Write mouth-watering, inviting copy.

Business Details:
{wizardAnswers}

Social Media Context:
{scrapedData}

Generate content in {locale} language. Emphasize the dining experience, cuisine quality, and atmosphere. For menu items, create appetizing descriptions. Return JSON matching the section config structure.`,
    schema: {
      sections: [
        {
          type: 'hero',
          label: 'Hero Banner',
          required: true,
          fields: {
            headline: { type: 'text', maxLength: 100, aiGenerated: true },
            subheadline: { type: 'text', maxLength: 200, aiGenerated: true },
            backgroundImage: { type: 'image', aspect: '16:9' },
            cta: {
              type: 'object',
              fields: {
                text: { type: 'text', maxLength: 30 },
                action: { type: 'enum', options: ['scroll_to_contact', 'external_link', 'phone', 'whatsapp'] },
                value: { type: 'text' },
              },
            },
            layout: { type: 'enum', options: ['centered', 'left_aligned', 'split'], default: 'centered' },
          },
        },
        {
          type: 'about',
          label: 'Our Story',
          required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            body: { type: 'richtext', aiGenerated: true },
            image: { type: 'image' },
          },
        },
        {
          type: 'menu',
          label: 'Menu',
          required: true,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            categories: {
              type: 'array',
              aiGenerated: true,
              itemFields: {
                name: { type: 'text' },
                items: {
                  type: 'array',
                  itemFields: {
                    name: { type: 'text' },
                    description: { type: 'text' },
                    price: { type: 'text' },
                    image: { type: 'image' },
                    badges: { type: 'array', itemFields: { label: { type: 'text' } } },
                  },
                },
              },
            },
          },
        },
        {
          type: 'gallery',
          label: 'Gallery',
          required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            images: { type: 'array', itemFields: { url: { type: 'image' }, caption: { type: 'text' } } },
            layout: { type: 'enum', options: ['grid', 'masonry', 'carousel'], default: 'grid' },
          },
        },
        {
          type: 'hours',
          label: 'Opening Hours',
          required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            schedule: {
              type: 'array',
              itemFields: {
                days: { type: 'text' },
                hours: { type: 'text' },
              },
            },
          },
        },
        {
          type: 'testimonials',
          label: 'Reviews',
          required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            items: {
              type: 'array',
              aiGenerated: true,
              itemFields: {
                quote: { type: 'text' },
                author: { type: 'text' },
                rating: { type: 'number' },
              },
            },
          },
        },
        {
          type: 'contact',
          label: 'Contact & Reservations',
          required: true,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            subheading: { type: 'text', aiGenerated: true },
            showForm: { type: 'boolean', default: true },
            showMap: { type: 'boolean', default: true },
            showPhone: { type: 'boolean', default: true },
            showWhatsapp: { type: 'boolean', default: true },
          },
        },
      ],
      colorSchemes: [
        { name: 'Rustic Warmth', primary: '#2c1810', secondary: '#3d2317', accent: '#d4a574' },
        { name: 'Fresh & Clean', primary: '#ffffff', secondary: '#f5f5f0', accent: '#2d6a4f' },
        { name: 'Elegant Dark', primary: '#1a1a1a', secondary: '#2d2d2d', accent: '#c9a96e' },
        { name: 'Mediterranean', primary: '#fefcf3', secondary: '#f5f0e1', accent: '#c44536' },
      ],
      fonts: ['Playfair Display', 'Lora', 'Heebo', 'Inter', 'Cormorant Garamond'],
    },
    defaultConfig: {
      sections: [],
      global: {
        colorScheme: { primary: '#2c1810', secondary: '#3d2317', accent: '#d4a574' },
        fontFamily: 'Playfair Display',
        logoUrl: null,
        faviconUrl: null,
        direction: 'ltr',
      },
    },
  },
  {
    slug: 'professional-services',
    name: 'Professional Services',
    category: 'professional_services',
    description: 'For consultants, lawyers, accountants, and service providers.',
    thumbnailUrl: '/templates/professional-thumb.jpg',
    sortOrder: 2,
    aiPromptTemplate: `You are a B2B copywriter creating a professional services website. Write authoritative, trust-building copy.

Business Details:
{wizardAnswers}

Social Media Context:
{scrapedData}

Generate content in {locale} language. Emphasize expertise, track record, and client results. Use professional tone. Return JSON matching the section config structure.`,
    schema: {
      sections: [
        {
          type: 'hero', label: 'Hero Banner', required: true,
          fields: {
            headline: { type: 'text', maxLength: 100, aiGenerated: true },
            subheadline: { type: 'text', maxLength: 200, aiGenerated: true },
            backgroundImage: { type: 'image', aspect: '16:9' },
            cta: { type: 'object', fields: { text: { type: 'text', maxLength: 30 }, action: { type: 'enum', options: ['scroll_to_contact', 'external_link', 'phone', 'whatsapp'] }, value: { type: 'text' } } },
            layout: { type: 'enum', options: ['centered', 'left_aligned', 'split'], default: 'left_aligned' },
          },
        },
        {
          type: 'about', label: 'About', required: false,
          fields: { heading: { type: 'text', aiGenerated: true }, body: { type: 'richtext', aiGenerated: true }, image: { type: 'image' } },
        },
        {
          type: 'services', label: 'Services & Pricing', required: true,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            items: { type: 'array', aiGenerated: true, itemFields: { title: { type: 'text' }, description: { type: 'text' }, price: { type: 'text' }, features: { type: 'array', itemFields: { text: { type: 'text' } } } } },
          },
        },
        {
          type: 'team', label: 'Our Team', required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            members: { type: 'array', itemFields: { name: { type: 'text' }, role: { type: 'text' }, bio: { type: 'text' }, photoUrl: { type: 'image' } } },
          },
        },
        {
          type: 'testimonials', label: 'Client Testimonials', required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            items: { type: 'array', aiGenerated: true, itemFields: { quote: { type: 'text' }, author: { type: 'text' }, role: { type: 'text' }, company: { type: 'text' } } },
          },
        },
        {
          type: 'case_studies', label: 'Case Studies', required: false,
          fields: {
            heading: { type: 'text', aiGenerated: true },
            items: { type: 'array', aiGenerated: true, itemFields: { title: { type: 'text' }, challenge: { type: 'text' }, solution: { type: 'text' }, result: { type: 'text' } } },
          },
        },
        {
          type: 'contact', label: 'Get in Touch', required: true,
          fields: { heading: { type: 'text', aiGenerated: true }, subheading: { type: 'text', aiGenerated: true }, showForm: { type: 'boolean', default: true }, showPhone: { type: 'boolean', default: true }, showEmail: { type: 'boolean', default: true } },
        },
      ],
      colorSchemes: [
        { name: 'Corporate Blue', primary: '#ffffff', secondary: '#f0f4f8', accent: '#1e40af' },
        { name: 'Executive Dark', primary: '#0f172a', secondary: '#1e293b', accent: '#38bdf8' },
        { name: 'Trust Green', primary: '#ffffff', secondary: '#f0fdf4', accent: '#15803d' },
      ],
      fonts: ['Inter', 'DM Sans', 'Heebo', 'Poppins'],
    },
    defaultConfig: { sections: [], global: { colorScheme: { primary: '#ffffff', secondary: '#f0f4f8', accent: '#1e40af' }, fontFamily: 'Inter', logoUrl: null, faviconUrl: null, direction: 'ltr' } },
  },
  {
    slug: 'ecommerce',
    name: 'E-commerce & Shop',
    category: 'ecommerce',
    description: 'For online stores, boutiques, and product-based businesses.',
    thumbnailUrl: '/templates/ecommerce-thumb.jpg',
    sortOrder: 3,
    aiPromptTemplate: `You are an e-commerce copywriter. Write persuasive, conversion-focused product copy.

Business Details:
{wizardAnswers}

Social Media Context:
{scrapedData}

Generate content in {locale} language. Emphasize product benefits, quality, and unique selling points. Return JSON matching the section config structure.`,
    schema: {
      sections: [
        { type: 'hero', label: 'Hero Banner', required: true, fields: { headline: { type: 'text', maxLength: 100, aiGenerated: true }, subheadline: { type: 'text', maxLength: 200, aiGenerated: true }, backgroundImage: { type: 'image', aspect: '16:9' }, cta: { type: 'object', fields: { text: { type: 'text', maxLength: 30 }, action: { type: 'enum', options: ['scroll_to_contact', 'external_link', 'phone', 'whatsapp'] }, value: { type: 'text' } } }, layout: { type: 'enum', options: ['centered', 'left_aligned', 'split'], default: 'split' } } },
        { type: 'featured_products', label: 'Featured Products', required: true, fields: { heading: { type: 'text', aiGenerated: true }, items: { type: 'array', aiGenerated: true, itemFields: { name: { type: 'text' }, description: { type: 'text' }, price: { type: 'text' }, image: { type: 'image' }, badge: { type: 'text' } } } } },
        { type: 'about', label: 'Our Story', required: false, fields: { heading: { type: 'text', aiGenerated: true }, body: { type: 'richtext', aiGenerated: true }, image: { type: 'image' } } },
        { type: 'testimonials', label: 'Customer Reviews', required: false, fields: { heading: { type: 'text', aiGenerated: true }, items: { type: 'array', aiGenerated: true, itemFields: { quote: { type: 'text' }, author: { type: 'text' }, rating: { type: 'number' } } } } },
        { type: 'contact', label: 'Contact', required: true, fields: { heading: { type: 'text', aiGenerated: true }, subheading: { type: 'text', aiGenerated: true }, showForm: { type: 'boolean', default: true }, showWhatsapp: { type: 'boolean', default: true } } },
      ],
      colorSchemes: [
        { name: 'Boutique', primary: '#faf5f0', secondary: '#f0ebe3', accent: '#8b5e34' },
        { name: 'Modern Shop', primary: '#ffffff', secondary: '#fafafa', accent: '#e11d48' },
        { name: 'Minimal', primary: '#ffffff', secondary: '#f5f5f5', accent: '#171717' },
      ],
      fonts: ['Poppins', 'DM Sans', 'Heebo', 'Inter'],
    },
    defaultConfig: { sections: [], global: { colorScheme: { primary: '#ffffff', secondary: '#fafafa', accent: '#e11d48' }, fontFamily: 'Poppins', logoUrl: null, faviconUrl: null, direction: 'ltr' } },
  },
  {
    slug: 'portfolio-creative',
    name: 'Portfolio & Creative',
    category: 'portfolio_creative',
    description: 'For designers, photographers, artists, and creative professionals.',
    thumbnailUrl: '/templates/portfolio-thumb.jpg',
    sortOrder: 4,
    aiPromptTemplate: `You are a creative copywriter building a portfolio website. Write expressive, personality-driven copy.

Business Details:
{wizardAnswers}

Social Media Context:
{scrapedData}

Generate content in {locale} language. Let the work speak but frame it with compelling narrative. Return JSON matching the section config structure.`,
    schema: {
      sections: [
        { type: 'hero', label: 'Hero', required: true, fields: { headline: { type: 'text', maxLength: 100, aiGenerated: true }, subheadline: { type: 'text', maxLength: 200, aiGenerated: true }, backgroundImage: { type: 'image', aspect: '16:9' }, layout: { type: 'enum', options: ['centered', 'left_aligned', 'split'], default: 'centered' } } },
        { type: 'portfolio_grid', label: 'Portfolio', required: true, fields: { heading: { type: 'text', aiGenerated: true }, categories: { type: 'array', itemFields: { name: { type: 'text' } } }, items: { type: 'array', itemFields: { title: { type: 'text' }, category: { type: 'text' }, image: { type: 'image' }, link: { type: 'text' } } }, layout: { type: 'enum', options: ['grid', 'masonry'], default: 'masonry' } } },
        { type: 'about', label: 'About Me', required: false, fields: { heading: { type: 'text', aiGenerated: true }, body: { type: 'richtext', aiGenerated: true }, image: { type: 'image' } } },
        { type: 'skills', label: 'Skills & Tools', required: false, fields: { heading: { type: 'text', aiGenerated: true }, items: { type: 'array', aiGenerated: true, itemFields: { name: { type: 'text' }, level: { type: 'number' } } } } },
        { type: 'testimonials', label: 'Client Feedback', required: false, fields: { heading: { type: 'text', aiGenerated: true }, items: { type: 'array', aiGenerated: true, itemFields: { quote: { type: 'text' }, author: { type: 'text' }, role: { type: 'text' } } } } },
        { type: 'contact', label: 'Let\'s Work Together', required: true, fields: { heading: { type: 'text', aiGenerated: true }, subheading: { type: 'text', aiGenerated: true }, showForm: { type: 'boolean', default: true }, showEmail: { type: 'boolean', default: true } } },
      ],
      colorSchemes: [
        { name: 'Dark Canvas', primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#f59e0b' },
        { name: 'Light Studio', primary: '#ffffff', secondary: '#fafafa', accent: '#7c3aed' },
        { name: 'Minimal Mono', primary: '#ffffff', secondary: '#f5f5f5', accent: '#000000' },
      ],
      fonts: ['Space Grotesk', 'Sora', 'Heebo', 'Inter'],
    },
    defaultConfig: { sections: [], global: { colorScheme: { primary: '#0a0a0a', secondary: '#1a1a1a', accent: '#f59e0b' }, fontFamily: 'Space Grotesk', logoUrl: null, faviconUrl: null, direction: 'ltr' } },
  },
  {
    slug: 'health-wellness',
    name: 'Health & Wellness',
    category: 'health_wellness',
    description: 'For clinics, therapists, gyms, spas, and wellness practitioners.',
    thumbnailUrl: '/templates/health-thumb.jpg',
    sortOrder: 5,
    aiPromptTemplate: `You are a health & wellness copywriter. Write calming, trust-building, empathetic copy.

Business Details:
{wizardAnswers}

Social Media Context:
{scrapedData}

Generate content in {locale} language. Emphasize care, expertise, and patient/client well-being. Return JSON matching the section config structure.`,
    schema: {
      sections: [
        { type: 'hero', label: 'Hero', required: true, fields: { headline: { type: 'text', maxLength: 100, aiGenerated: true }, subheadline: { type: 'text', maxLength: 200, aiGenerated: true }, backgroundImage: { type: 'image', aspect: '16:9' }, cta: { type: 'object', fields: { text: { type: 'text', maxLength: 30 }, action: { type: 'enum', options: ['scroll_to_contact', 'external_link', 'phone', 'whatsapp'] }, value: { type: 'text' } } }, layout: { type: 'enum', options: ['centered', 'left_aligned', 'split'], default: 'centered' } } },
        { type: 'services', label: 'Treatments & Services', required: true, fields: { heading: { type: 'text', aiGenerated: true }, items: { type: 'array', aiGenerated: true, itemFields: { title: { type: 'text' }, description: { type: 'text' }, duration: { type: 'text' }, price: { type: 'text' }, icon: { type: 'text' } } } } },
        { type: 'practitioners', label: 'Our Practitioners', required: false, fields: { heading: { type: 'text', aiGenerated: true }, members: { type: 'array', itemFields: { name: { type: 'text' }, specialty: { type: 'text' }, bio: { type: 'text' }, photoUrl: { type: 'image' } } } } },
        { type: 'testimonials', label: 'Patient Stories', required: false, fields: { heading: { type: 'text', aiGenerated: true }, items: { type: 'array', aiGenerated: true, itemFields: { quote: { type: 'text' }, author: { type: 'text' } } } } },
        { type: 'gallery', label: 'Our Space', required: false, fields: { heading: { type: 'text', aiGenerated: true }, images: { type: 'array', itemFields: { url: { type: 'image' }, caption: { type: 'text' } } }, layout: { type: 'enum', options: ['grid', 'carousel'], default: 'grid' } } },
        { type: 'contact', label: 'Book an Appointment', required: true, fields: { heading: { type: 'text', aiGenerated: true }, subheading: { type: 'text', aiGenerated: true }, showForm: { type: 'boolean', default: true }, showPhone: { type: 'boolean', default: true }, showWhatsapp: { type: 'boolean', default: true } } },
      ],
      colorSchemes: [
        { name: 'Calm Sage', primary: '#f7faf8', secondary: '#edf5f0', accent: '#4a7c6f' },
        { name: 'Serene Blue', primary: '#f5f9fc', secondary: '#e8f0f7', accent: '#2563eb' },
        { name: 'Warm Wellness', primary: '#fdfbf7', secondary: '#f8f3eb', accent: '#b45309' },
      ],
      fonts: ['Nunito', 'Lora', 'Heebo', 'Assistant'],
    },
    defaultConfig: { sections: [], global: { colorScheme: { primary: '#f7faf8', secondary: '#edf5f0', accent: '#4a7c6f' }, fontFamily: 'Nunito', logoUrl: null, faviconUrl: null, direction: 'ltr' } },
  },
  {
    slug: 'real-estate',
    name: 'Real Estate',
    category: 'real_estate',
    description: 'For agents, brokers, property managers, and real estate firms.',
    thumbnailUrl: '/templates/real-estate-thumb.jpg',
    sortOrder: 6,
    aiPromptTemplate: `You are a real estate copywriter. Write aspirational, detail-rich property and agent copy.

Business Details:
{wizardAnswers}

Social Media Context:
{scrapedData}

Generate content in {locale} language. Emphasize local expertise, market knowledge, and client success stories. Return JSON matching the section config structure.`,
    schema: {
      sections: [
        { type: 'hero', label: 'Hero', required: true, fields: { headline: { type: 'text', maxLength: 100, aiGenerated: true }, subheadline: { type: 'text', maxLength: 200, aiGenerated: true }, backgroundImage: { type: 'image', aspect: '16:9' }, cta: { type: 'object', fields: { text: { type: 'text', maxLength: 30 }, action: { type: 'enum', options: ['scroll_to_contact', 'external_link', 'phone', 'whatsapp'] }, value: { type: 'text' } } }, layout: { type: 'enum', options: ['centered', 'left_aligned', 'split'], default: 'split' } } },
        { type: 'featured_listings', label: 'Featured Listings', required: true, fields: { heading: { type: 'text', aiGenerated: true }, items: { type: 'array', itemFields: { title: { type: 'text' }, address: { type: 'text' }, price: { type: 'text' }, bedrooms: { type: 'number' }, bathrooms: { type: 'number' }, area: { type: 'text' }, image: { type: 'image' }, status: { type: 'enum', options: ['for_sale', 'for_rent', 'sold'] } } } } },
        { type: 'about', label: 'About', required: false, fields: { heading: { type: 'text', aiGenerated: true }, body: { type: 'richtext', aiGenerated: true }, image: { type: 'image' }, stats: { type: 'array', aiGenerated: true, itemFields: { label: { type: 'text' }, value: { type: 'text' } } } } },
        { type: 'testimonials', label: 'Client Success Stories', required: false, fields: { heading: { type: 'text', aiGenerated: true }, items: { type: 'array', aiGenerated: true, itemFields: { quote: { type: 'text' }, author: { type: 'text' }, property: { type: 'text' } } } } },
        { type: 'contact', label: 'Get in Touch', required: true, fields: { heading: { type: 'text', aiGenerated: true }, subheading: { type: 'text', aiGenerated: true }, showForm: { type: 'boolean', default: true }, showPhone: { type: 'boolean', default: true }, showWhatsapp: { type: 'boolean', default: true } } },
      ],
      colorSchemes: [
        { name: 'Luxury Gold', primary: '#1a1a1a', secondary: '#2a2a2a', accent: '#c9a96e' },
        { name: 'Classic Blue', primary: '#ffffff', secondary: '#f0f4f8', accent: '#1e3a5f' },
        { name: 'Modern White', primary: '#ffffff', secondary: '#fafafa', accent: '#059669' },
      ],
      fonts: ['DM Serif Display', 'Inter', 'Heebo', 'Poppins'],
    },
    defaultConfig: { sections: [], global: { colorScheme: { primary: '#1a1a1a', secondary: '#2a2a2a', accent: '#c9a96e' }, fontFamily: 'DM Serif Display', logoUrl: null, faviconUrl: null, direction: 'ltr' } },
  },
];

async function main() {
  console.log('Seeding templates...');

  for (const tpl of templates) {
    await prisma.pageTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        thumbnailUrl: tpl.thumbnailUrl,
        schema: tpl.schema,
        defaultConfig: tpl.defaultConfig,
        aiPromptTemplate: tpl.aiPromptTemplate,
        sortOrder: tpl.sortOrder,
      },
      create: {
        slug: tpl.slug,
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        thumbnailUrl: tpl.thumbnailUrl,
        schema: tpl.schema,
        defaultConfig: tpl.defaultConfig,
        aiPromptTemplate: tpl.aiPromptTemplate,
        sortOrder: tpl.sortOrder,
      },
    });
    console.log(`  ✓ ${tpl.name}`);
  }

  console.log('Done! Seeded', templates.length, 'templates.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
