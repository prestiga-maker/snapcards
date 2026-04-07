export interface ScrapedImage {
  url: string;
  alt: string;
  source: string;
}

export interface ScrapedProfile {
  platform: string;
  name?: string;
  bio?: string;
  images: ScrapedImage[];
}

export interface ScrapeResult {
  profiles: ScrapedProfile[];
  allImages: ScrapedImage[];
}

function detectPlatform(url: string): string | null {
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('linkedin.com')) return 'linkedin';
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'x';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return null;
}

async function scrapeOpenGraph(url: string): Promise<{ title?: string; description?: string; image?: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        Accept: 'text/html',
      },
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);

    if (!res.ok) return {};

    const html = await res.text();

    const getOGTag = (property: string): string | undefined => {
      const match = html.match(
        new RegExp(`<meta[^>]*property=["']og:${property}["'][^>]*content=["']([^"']+)["']`, 'i')
      ) || html.match(
        new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:${property}["']`, 'i')
      );
      return match?.[1];
    };

    return {
      title: getOGTag('title'),
      description: getOGTag('description'),
      image: getOGTag('image'),
    };
  } catch {
    return {};
  }
}

async function scrapeSingleUrl(url: string): Promise<ScrapedProfile> {
  const platform = detectPlatform(url) || 'unknown';
  const og = await scrapeOpenGraph(url);

  const images: ScrapedImage[] = [];
  if (og.image) {
    images.push({
      url: og.image,
      alt: og.title || `${platform} image`,
      source: `scrape_${platform}`,
    });
  }

  return {
    platform,
    name: og.title,
    bio: og.description,
    images,
  };
}

/**
 * Best-effort scraping of social media URLs.
 * Returns whatever data we can get — gracefully degrades on failures.
 */
export async function scrapeSocialUrls(urls: string[]): Promise<ScrapeResult> {
  const validUrls = urls.filter((u) => {
    try {
      new URL(u);
      return true;
    } catch {
      return false;
    }
  });

  const results = await Promise.allSettled(
    validUrls.map((url) => scrapeSingleUrl(url))
  );

  const profiles: ScrapedProfile[] = [];
  const allImages: ScrapedImage[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      profiles.push(result.value);
      allImages.push(...result.value.images);
    }
  }

  return { profiles, allImages };
}
