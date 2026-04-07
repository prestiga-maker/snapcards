import type { ColorScheme } from '@/types';

interface HeroConfig {
  headline?: string;
  subheadline?: string;
  backgroundImage?: string;
  cta?: { text?: string; action?: string; value?: string };
  layout?: 'centered' | 'left_aligned' | 'split';
}

interface HeroSectionProps {
  config: HeroConfig;
  colorScheme: ColorScheme;
}

export function HeroSection({ config, colorScheme }: HeroSectionProps) {
  const layout = config.layout || 'centered';

  const alignmentClass = {
    centered: 'text-center items-center',
    left_aligned: 'text-start items-start',
    split: 'text-start items-start md:w-1/2',
  }[layout];

  function handleCta() {
    if (!config.cta) return;
    const { action, value } = config.cta;
    if (action === 'phone' && value) window.location.href = `tel:${value}`;
    if (action === 'whatsapp' && value) window.open(`https://wa.me/${value.replace(/[^0-9]/g, '')}`, '_blank');
    if (action === 'external_link' && value) window.open(value, '_blank');
    if (action === 'scroll_to_contact') document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section
      className="relative flex min-h-[500px] items-center justify-center px-6 py-20"
      style={{
        backgroundColor: colorScheme.primary,
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {config.backgroundImage && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      <div className={`relative z-10 flex max-w-4xl flex-col gap-6 ${alignmentClass}`}>
        {config.headline && (
          <h1
            className="text-4xl font-bold leading-tight md:text-5xl lg:text-6xl"
            style={{ color: config.backgroundImage ? '#ffffff' : colorScheme.accent }}
          >
            {config.headline}
          </h1>
        )}
        {config.subheadline && (
          <p
            className="max-w-2xl text-lg md:text-xl"
            style={{ color: config.backgroundImage ? '#ffffffcc' : `${colorScheme.primary === '#ffffff' ? '#666' : '#ffffffcc'}` }}
          >
            {config.subheadline}
          </p>
        )}
        {config.cta?.text && (
          <button
            onClick={handleCta}
            className="w-fit rounded-lg px-8 py-3 text-lg font-semibold transition-transform hover:scale-105"
            style={{ backgroundColor: colorScheme.accent, color: '#ffffff' }}
          >
            {config.cta.text}
          </button>
        )}
      </div>
    </section>
  );
}
