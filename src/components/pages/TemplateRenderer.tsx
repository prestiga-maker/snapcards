'use client';

import Image from 'next/image';
import type { PageConfig, ColorScheme } from '@/types';
import { HeroSection } from './sections/HeroSection';
import { AboutSection } from './sections/AboutSection';
import { ServicesSection } from './sections/ServicesSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { ContactSection } from './sections/ContactSection';
import { MenuSection } from './sections/MenuSection';
import { GallerySection } from './sections/GallerySection';
import { FAQSection } from './sections/FAQSection';
import { HoursSection } from './sections/HoursSection';
import { TeamSection } from './sections/TeamSection';
import { CaseStudiesSection } from './sections/CaseStudiesSection';
import { FeaturedProductsSection } from './sections/FeaturedProductsSection';
import { PortfolioGridSection } from './sections/PortfolioGridSection';
import { SkillsSection } from './sections/SkillsSection';
import { FeaturedListingsSection } from './sections/FeaturedListingsSection';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_MAP: Record<string, React.ComponentType<{ config: any; colorScheme: ColorScheme }>> = {
  hero: HeroSection,
  about: AboutSection,
  services: ServicesSection,
  testimonials: TestimonialsSection,
  contact: ContactSection,
  menu: MenuSection,
  gallery: GallerySection,
  faq: FAQSection,
  hours: HoursSection,
  team: TeamSection,
  practitioners: TeamSection,
  case_studies: CaseStudiesSection,
  featured_products: FeaturedProductsSection,
  product_grid: FeaturedProductsSection,
  portfolio_grid: PortfolioGridSection,
  skills: SkillsSection,
  featured_listings: FeaturedListingsSection,
};

interface TemplateRendererProps {
  config: PageConfig;
}

export function TemplateRenderer({ config }: TemplateRendererProps) {
  const colorScheme = config.global?.colorScheme || { primary: '#ffffff', secondary: '#f8f9fa', accent: '#0066ff' };
  const direction = config.global?.direction || 'ltr';

  const visibleSections = (config.sections || [])
    .filter((s) => s.visible !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div
      dir={direction}
      style={{
        fontFamily: config.global?.fontFamily || 'Inter, system-ui, sans-serif',
        background: '#f9f9ff',
        color: '#141b2b',
      }}
    >
      {/* Header */}
      {config.global?.logoUrl && (
        <header className="flex items-center justify-between px-6 py-4" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}>
          <Image src={config.global.logoUrl} alt="Logo" width={120} height={40} className="h-10 w-auto" unoptimized />
        </header>
      )}

      {/* Sections — no separators, spacing-based (§5) */}
      <div className="space-y-0">
        {visibleSections.map((section) => {
          const SectionComponent = SECTION_MAP[section.type];
          if (!SectionComponent) {
            return (
              <div key={section.id} className="p-4 text-center text-sm" style={{ background: '#fef3c7', color: '#92400e' }}>
                Unknown section type: {section.type}
              </div>
            );
          }
          return (
            <SectionComponent
              key={section.id}
              config={section.config}
              colorScheme={colorScheme}
            />
          );
        })}
      </div>

      {/* Footer */}
      <footer className="px-6 py-8 text-center text-xs" style={{ background: '#f1f3ff', color: '#464555' }}>
        <p>Powered by <span style={{ color: '#3525cd', fontWeight: 600 }}>SNAP.Cards</span></p>
      </footer>
    </div>
  );
}
