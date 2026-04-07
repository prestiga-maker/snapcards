import Image from 'next/image';
import type { ColorScheme } from '@/types';

interface ProductItem {
  name?: string;
  description?: string;
  price?: string;
  image?: string;
  badge?: string;
}

interface FeaturedProductsConfig {
  heading?: string;
  items?: ProductItem[];
}

interface FeaturedProductsSectionProps {
  config: FeaturedProductsConfig;
  colorScheme: ColorScheme;
}

export function FeaturedProductsSection({ config, colorScheme }: FeaturedProductsSectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.primary }}>
      <div className="mx-auto max-w-6xl">
        {config.heading && (
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: textColor }}>
            {config.heading}
          </h2>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {config.items?.map((item, i) => (
            <div key={i} className="group overflow-hidden rounded-xl" style={{ backgroundColor: colorScheme.secondary }}>
              <div className="relative aspect-square overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name || ''} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl" style={{ backgroundColor: colorScheme.primary }}>🛍️</div>
                )}
                {item.badge && (
                  <span className="absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: colorScheme.accent }}>
                    {item.badge}
                  </span>
                )}
              </div>
              <div className="p-4">
                {item.name && <h3 className="font-semibold" style={{ color: textColor }}>{item.name}</h3>}
                {item.description && <p className="mt-1 text-sm" style={{ color: isDark ? '#ffffffcc' : '#555' }}>{item.description}</p>}
                {item.price && <p className="mt-2 text-lg font-bold" style={{ color: colorScheme.accent }}>{item.price}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
