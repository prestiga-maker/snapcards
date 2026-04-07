import type { ColorScheme } from '@/types';

interface CaseStudyItem {
  title?: string;
  challenge?: string;
  solution?: string;
  result?: string;
}

interface CaseStudiesConfig {
  heading?: string;
  items?: CaseStudyItem[];
}

interface CaseStudiesSectionProps {
  config: CaseStudiesConfig;
  colorScheme: ColorScheme;
}

export function CaseStudiesSection({ config, colorScheme }: CaseStudiesSectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';
  const subtextColor = isDark ? '#ffffffcc' : '#555';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.secondary }}>
      <div className="mx-auto max-w-4xl">
        {config.heading && (
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: isDark ? '#ffffff' : '#1a1a1a' }}>
            {config.heading}
          </h2>
        )}
        <div className="space-y-8">
          {config.items?.map((item, i) => (
            <div key={i} className="rounded-xl p-6" style={{ backgroundColor: colorScheme.primary }}>
              {item.title && <h3 className="mb-4 text-xl font-semibold" style={{ color: textColor }}>{item.title}</h3>}
              <div className="grid gap-4 md:grid-cols-3">
                {item.challenge && (
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: colorScheme.accent }}>Challenge</p>
                    <p className="mt-1 text-sm" style={{ color: subtextColor }}>{item.challenge}</p>
                  </div>
                )}
                {item.solution && (
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: colorScheme.accent }}>Solution</p>
                    <p className="mt-1 text-sm" style={{ color: subtextColor }}>{item.solution}</p>
                  </div>
                )}
                {item.result && (
                  <div>
                    <p className="text-xs font-semibold uppercase" style={{ color: colorScheme.accent }}>Result</p>
                    <p className="mt-1 text-sm" style={{ color: subtextColor }}>{item.result}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
