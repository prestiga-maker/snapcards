import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';
  const baseUrl = `https://${domain}`;

  const privateRoutes = ['/api/', '/en/settings', '/he/settings', '/en/messages', '/he/messages'];

  return {
    rules: [
      // Default: allow all crawlers
      {
        userAgent: '*',
        allow: '/',
        disallow: privateRoutes,
      },
      // AI search engines — explicitly welcome
      {
        userAgent: 'GPTBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: privateRoutes,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: privateRoutes,
      },
      {
        userAgent: 'Claude-Web',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: privateRoutes,
      },
      {
        userAgent: 'PerplexityBot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: privateRoutes,
      },
      {
        userAgent: 'Amazonbot',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: privateRoutes,
      },
      {
        userAgent: 'Google-Extended',
        allow: ['/', '/llms.txt', '/llms-full.txt'],
        disallow: privateRoutes,
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
