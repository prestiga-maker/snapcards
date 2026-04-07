import Image from 'next/image';
import type { ColorScheme } from '@/types';

interface ListingItem {
  title?: string;
  address?: string;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: string;
  image?: string;
  status?: 'for_sale' | 'for_rent' | 'sold';
}

interface FeaturedListingsConfig {
  heading?: string;
  items?: ListingItem[];
}

interface FeaturedListingsSectionProps {
  config: FeaturedListingsConfig;
  colorScheme: ColorScheme;
}

const statusLabels: Record<string, string> = {
  for_sale: 'For Sale',
  for_rent: 'For Rent',
  sold: 'Sold',
};

export function FeaturedListingsSection({ config, colorScheme }: FeaturedListingsSectionProps) {
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
            <div key={i} className="overflow-hidden rounded-xl" style={{ backgroundColor: colorScheme.secondary }}>
              <div className="relative aspect-[4/3] overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.title || ''} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full items-center justify-center text-5xl" style={{ backgroundColor: colorScheme.primary }}>🏠</div>
                )}
                {item.status && (
                  <span className="absolute start-3 top-3 rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: item.status === 'sold' ? '#ef4444' : colorScheme.accent }}>
                    {statusLabels[item.status] || item.status}
                  </span>
                )}
              </div>
              <div className="p-4">
                {item.price && <p className="text-xl font-bold" style={{ color: colorScheme.accent }}>{item.price}</p>}
                {item.title && <h3 className="mt-1 font-semibold" style={{ color: textColor }}>{item.title}</h3>}
                {item.address && <p className="text-sm" style={{ color: isDark ? '#ffffffcc' : '#555' }}>{item.address}</p>}
                <div className="mt-3 flex gap-4 text-sm" style={{ color: isDark ? '#ffffff99' : '#888' }}>
                  {item.bedrooms !== undefined && <span>🛏 {item.bedrooms}</span>}
                  {item.bathrooms !== undefined && <span>🚿 {item.bathrooms}</span>}
                  {item.area && <span>📐 {item.area}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
