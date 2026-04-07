export type Locale = 'en' | 'he';

export type SubscriptionTier = 'free' | 'pro';

export type ConnectionStatus = 'pending' | 'accepted' | 'blocked';

export type ScanMethod = 'photo' | 'qr' | 'nfc';

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export type PostType = 'text' | 'image' | 'link' | 'share';

export type ConversationType = 'direct' | 'ai_assistant' | 'customer_chat';

export type SenderType = 'user' | 'ai_assistant' | 'system';

export type TemplateCategory =
  | 'generic'
  | 'restaurant'
  | 'professional_services'
  | 'ecommerce'
  | 'portfolio_creative'
  | 'health_wellness'
  | 'real_estate';

export interface SocialLinks {
  linkedin?: string;
  facebook?: string;
  instagram?: string;
  tiktok?: string;
  x?: string;
  youtube?: string;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
}

export interface PageConfig {
  sections: SectionConfig[];
  global: {
    colorScheme: ColorScheme;
    fontFamily: string;
    logoUrl: string | null;
    faviconUrl: string | null;
    direction: 'ltr' | 'rtl';
  };
}

export interface SectionConfig {
  id: string;
  type: string;
  sortOrder: number;
  visible: boolean;
  config: Record<string, unknown>;
}

export interface WizardAnswers {
  businessName: string;
  industry: string;
  problemSolved: string;
  solution: string;
  targetAudience: string;
  productsServices: string;
  pricing: string;
  socialLinks: SocialLinks;
  uploads: string[];
  usp: string;
}
