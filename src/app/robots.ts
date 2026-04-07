import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const domain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'snap.cards';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/en/settings', '/he/settings', '/en/messages', '/he/messages'],
      },
    ],
    sitemap: `https://${domain}/sitemap.xml`,
  };
}
