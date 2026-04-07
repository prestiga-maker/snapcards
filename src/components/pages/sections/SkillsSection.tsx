import type { ColorScheme } from '@/types';

interface SkillItem {
  name?: string;
  level?: number;
}

interface SkillsConfig {
  heading?: string;
  items?: SkillItem[];
}

interface SkillsSectionProps {
  config: SkillsConfig;
  colorScheme: ColorScheme;
}

export function SkillsSection({ config, colorScheme }: SkillsSectionProps) {
  const isDark = colorScheme.primary !== '#ffffff' && colorScheme.primary !== '#fff';
  const textColor = isDark ? '#ffffff' : '#1a1a1a';

  return (
    <section className="px-6 py-16" style={{ backgroundColor: colorScheme.secondary }}>
      <div className="mx-auto max-w-2xl">
        {config.heading && (
          <h2 className="mb-12 text-center text-3xl font-bold" style={{ color: isDark ? '#ffffff' : '#1a1a1a' }}>
            {config.heading}
          </h2>
        )}
        <div className="space-y-4">
          {config.items?.map((item, i) => (
            <div key={i}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-medium" style={{ color: textColor }}>{item.name}</span>
                {item.level && <span style={{ color: isDark ? '#ffffff99' : '#888' }}>{item.level}%</span>}
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: colorScheme.primary }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${item.level || 50}%`, backgroundColor: colorScheme.accent }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
