import Image from 'next/image';
import type { ColorScheme } from '@/types';

interface GalleryImage {
  url?: string;
  caption?: string;
}

interface GalleryConfig {
  heading?: string;
  images?: GalleryImage[];
  layout?: 'grid' | 'masonry' | 'carousel';
}

interface GallerySectionProps {
  config: GalleryConfig;
  colorScheme: ColorScheme;
}

export function GallerySection({ config, colorScheme }: GallerySectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.secondary }}>
      <div className="mx-auto max-w-6xl">
        {config.heading && (
          <h2
            className="mb-12 text-center text-3xl font-bold"
            style={{ color: isDark ? '#ffffff' : '#1a1a1a' }}
          >
            {config.heading}
          </h2>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {config.images?.map((img, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-xl">
              {img.url ? (
                <Image
                  src={img.url}
                  alt={img.caption || `Gallery image ${i + 1}`}
                  fill
                  className="aspect-square object-cover transition-transform group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div
                  className="flex aspect-square items-center justify-center text-4xl"
                  style={{ backgroundColor: colorScheme.primary }}
                >
                  📷
                </div>
              )}
              {img.caption && (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3">
                  <p className="text-sm text-white">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
