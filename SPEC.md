# SNAP.Cards — Product & Technical Specification

**Version**: 1.0  
**Date**: 2026-04-06  
**Status**: Approved  

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [Architecture](#2-architecture)
3. [Data Model](#3-data-model)
4. [Template System](#4-template-system)
5. [API Routes](#5-api-routes)
6. [Privacy & Connection Model](#6-privacy--connection-model)
7. [Moderation System](#7-moderation-system)
8. [Phased Delivery Plan](#8-phased-delivery-plan)
9. [Technical Risks & Mitigations](#9-technical-risks--mitigations)

---

## 1. Product Overview

### What is SNAP.Cards?

SNAP.Cards is a business networking platform where users:

1. **Build AI-powered business web pages** from category templates (the revenue driver)
2. **Scan physical business cards** (OCR) to create digital contacts
3. **Network** via a full social feed (posts, comments, likes, shares)
4. **Exchange digital cards** via QR codes linking to their profile
5. **Message** connections and use an AI assistant for business management

### Target Users

- Entrepreneurs, freelancers, and small business owners
- Conference attendees and networkers
- Israeli tech ecosystem (Hebrew + English from day one)

### Value Proposition

- **For networkers**: Scan a card → instant digital contact. No manual entry.
- **For business owners**: Answer 10 questions → get a live website with AI chatbot, booking, and analytics.
- **For the platform**: Free tier drives adoption; Pro tier ($20/mo) drives revenue.

### Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Business page at `{slug}.snap.cards`, card scanning, social feed, messaging, basic analytics |
| Pro | $20/mo | Custom domain, AI chatbot on page, email campaigns, advanced analytics, e-commerce, priority support |

### Key Constraints

- **Team**: Solo founder using AI-assisted development (Claude, Cursor)
- **Languages**: English + Hebrew, full RTL UI
- **Scale target**: 10K–50K users within 6 months
- **Launch platform**: Responsive web app first, React Native later

---

## 2. Architecture

### 2.1 System Diagram

```
                          ┌───────────────────────────┐
                          │       End Users            │
                          │  (Browser / Mobile PWA)    │
                          └────────────┬──────────────┘
                                       │ HTTPS
                                       ▼
                          ┌───────────────────────────┐
                          │    Vercel Edge Network     │
                          │  ┌─────────────────────┐  │
                          │  │ Next.js App (SSR)    │  │
                          │  │                      │  │
                          │  │ • App UI (/app/*)    │  │
                          │  │ • API Routes (/api)  │  │
                          │  │ • Business Pages     │  │
                          │  │   [slug].snap.cards  │  │
                          │  └─────────────────────┘  │
                          └──┬──────┬──────┬──────┬───┘
                             │      │      │      │
              ┌──────────────┘      │      │      └──────────────────┐
              │                     │      │                         │
              ▼                     ▼      ▼                         ▼
    ┌──────────────────┐  ┌────────────┐ ┌────────────┐   ┌──────────────────┐
    │ Supabase Auth    │  │ cPanel     │ │ cPanel     │   │ AWS CloudFront   │
    │                  │  │ MySQL DB   │ │ File       │   │ CDN              │
    │ • Google OAuth   │  │            │ │ Storage    │──▶│ • Card images    │
    │ • Apple OAuth    │  │ cleverdot  │ │            │   │ • Site assets    │
    │ • Email/Password │  │ .com       │ │ /uploads   │   │ • User uploads   │
    │ • Magic Links    │  └────────────┘ └────────────┘   └──────────────────┘
    └──────────────────┘
              
              ┌──────────────────┬──────────────────┬──────────────────┐
              │                  │                  │                  │
              ▼                  ▼                  ▼                  ▼
    ┌──────────────────┐ ┌───────────────┐ ┌───────────────┐ ┌────────────────┐
    │ Google Cloud     │ │ Claude / GPT  │ │ Social Media  │ │ Google         │
    │ Vision API       │ │ LLM API       │ │ Scraper       │ │ Calendar API   │
    │                  │ │               │ │               │ │                │
    │ • OCR            │ │ • Page copy   │ │ • FB images   │ │ • Booking      │
    │ • Card parsing   │ │ • Moderation  │ │ • IG images   │ │   integration  │
    │                  │ │ • Chatbot     │ │ • LinkedIn    │ │                │
    │                  │ │ • Drafting    │ │ • TikTok/X/YT │ │                │
    └──────────────────┘ └───────────────┘ └───────────────┘ └────────────────┘

    ┌───────────────────────────────────────────────────────────────────┐
    │ Service Worker (Client-Side)                                     │
    │ • Web Push Notifications                                         │
    │ • Offline card photo queue (future)                               │
    └───────────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Tenant Business Page Routing

```
Browser requests:  joes-pizza.snap.cards
                        │
                        ▼
Vercel DNS → Next.js middleware reads hostname
                        │
                        ▼
Extract slug "joes-pizza" → DB lookup in business_pages table
                        │
                        ▼
Fetch page_config JSON + template_id → SSR render with template component
                        │
                        ▼
Return fully rendered HTML (SEO-friendly, cached via ISR)
```

### 2.3 Key Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| App framework | Next.js on Vercel | Full-stack, SSR for SEO, edge middleware for multi-tenancy |
| Database | MySQL on cPanel (cleverdot.com) | Existing hosting, sufficient for 50K users |
| Auth | Supabase Auth | Managed OAuth (Google, Apple), magic links, JWT tokens |
| File storage | cPanel + CloudFront CDN | cPanel for writes, CloudFront for reads |
| Real-time | 30-second polling | Simpler than WebSockets for MVP; solo dev constraint |
| Business pages | Shared app, dynamic routing | Single deployment, no per-site builds |
| AI provider | Claude or GPT (abstracted) | Provider-agnostic service layer; swap without code changes |
| OCR | Google Cloud Vision API | Best Hebrew support, high accuracy, pay-per-call |

---

## 3. Data Model

All tables use `id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY`. All timestamps are `DATETIME` in UTC. Soft deletes via `deleted_at DATETIME NULL` where applicable.

### 3.1 Users & Profiles

#### `users`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| supabase_uid | VARCHAR(255) UNIQUE | Supabase Auth foreign key |
| email | VARCHAR(255) UNIQUE | |
| phone | VARCHAR(50) NULL | |
| display_name | VARCHAR(255) | |
| avatar_url | VARCHAR(500) NULL | |
| locale | ENUM('en','he') DEFAULT 'en' | |
| trust_score | INT DEFAULT 0 | For moderation; increments on approved posts |
| is_verified | BOOLEAN DEFAULT FALSE | |
| subscription_tier | ENUM('free','pro') DEFAULT 'free' | |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| deleted_at | DATETIME NULL | |

#### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK → users, UNIQUE | |
| first_name | VARCHAR(255) | |
| last_name | VARCHAR(255) | |
| first_name_he | VARCHAR(255) NULL | Hebrew name |
| last_name_he | VARCHAR(255) NULL | |
| job_title | VARCHAR(255) NULL | |
| company_name | VARCHAR(255) NULL | |
| bio | TEXT NULL | |
| website | VARCHAR(500) NULL | |
| social_links | JSON NULL | `{"linkedin":"…","facebook":"…","instagram":"…","tiktok":"…","x":"…","youtube":"…"}` |
| location | VARCHAR(255) NULL | |
| lat | DECIMAL(10,8) NULL | For GPS event suggestions |
| lng | DECIMAL(11,8) NULL | |
| profile_completeness | TINYINT DEFAULT 0 | 0–100% |
| qr_code_url | VARCHAR(500) NULL | Generated QR image path |
| nfc_tag_id | VARCHAR(255) NULL | |
| scan_count | INT DEFAULT 0 | How many times this user's card was scanned by others |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**Indexes**: `idx_profiles_company (company_name)`, `idx_profiles_location (lat, lng)`

### 3.2 Card Scanning & Contacts

#### `scanned_cards`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| scanner_user_id | BIGINT UNSIGNED FK → users | Who scanned |
| matched_user_id | BIGINT UNSIGNED FK → users NULL | If card owner is on platform |
| card_image_url | VARCHAR(500) | Stored card photo |
| card_image_back_url | VARCHAR(500) NULL | Back of card |
| scan_method | ENUM('photo','qr','nfc') | |
| raw_ocr_text | TEXT | Full OCR output |
| first_name | VARCHAR(255) NULL | Extracted + user-confirmed |
| last_name | VARCHAR(255) NULL | |
| job_title | VARCHAR(255) NULL | |
| company_name | VARCHAR(255) NULL | |
| email | VARCHAR(255) NULL | |
| phone | VARCHAR(50) NULL | |
| website | VARCHAR(500) NULL | |
| address | TEXT NULL | |
| social_links | JSON NULL | Social URLs found on card |
| custom_fields | JSON NULL | Anything else extracted |
| notes | TEXT NULL | Scanner's personal notes |
| tags | JSON NULL | `["client","met-at-conference"]` |
| is_self_scan | BOOLEAN DEFAULT FALSE | |
| scan_location_lat | DECIMAL(10,8) NULL | GPS at scan time |
| scan_location_lng | DECIMAL(11,8) NULL | |
| event_context | VARCHAR(255) NULL | Auto-suggested or typed event |
| confidence_score | DECIMAL(3,2) NULL | OCR confidence 0.00–1.00 |
| is_confirmed | BOOLEAN DEFAULT FALSE | User confirmed data |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| deleted_at | DATETIME NULL | |

**Dedup constraint**: `UNIQUE (scanner_user_id, email)` where email is NOT NULL. Application-level dedup on `(scanner_user_id, first_name, last_name, company_name)` when email is NULL.

**Indexes**: `idx_scanned_scanner (scanner_user_id)`, `idx_scanned_matched (matched_user_id)`

#### `connections`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| requester_id | BIGINT UNSIGNED FK → users | |
| receiver_id | BIGINT UNSIGNED FK → users | |
| status | ENUM('pending','accepted','blocked') | Scan-based = auto 'accepted' |
| source | ENUM('scan','search','import') | How connection was made |
| scanned_card_id | BIGINT UNSIGNED FK → scanned_cards NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**Constraint**: `UNIQUE (requester_id, receiver_id)`

### 3.3 AI Page Builder

#### `page_templates`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| slug | VARCHAR(100) UNIQUE | e.g. 'restaurant' |
| name | VARCHAR(255) | Display name |
| category | ENUM('generic','restaurant','professional_services','ecommerce','portfolio_creative','health_wellness','real_estate') | |
| description | TEXT | |
| thumbnail_url | VARCHAR(500) | Preview image |
| schema | JSON | Section definitions (see Section 4) |
| default_config | JSON | Default content/styling |
| ai_prompt_template | TEXT | Category-specific prompt for AI generation |
| is_active | BOOLEAN DEFAULT TRUE | |
| sort_order | INT DEFAULT 0 | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

#### `business_pages`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK → users | Owner |
| template_id | BIGINT UNSIGNED FK → page_templates | |
| slug | VARCHAR(100) UNIQUE | `{slug}.snap.cards` |
| custom_domain | VARCHAR(255) NULL UNIQUE | Pro feature |
| domain_verified | BOOLEAN DEFAULT FALSE | |
| business_name | VARCHAR(255) | |
| tagline | VARCHAR(500) NULL | |
| page_config | JSON | Full rendered page configuration |
| seo_title | VARCHAR(255) NULL | |
| seo_description | VARCHAR(500) NULL | |
| seo_image_url | VARCHAR(500) NULL | OG image |
| wizard_answers | JSON NULL | Stored answers from setup wizard |
| scraped_social_data | JSON NULL | Cached scraped content |
| color_scheme | JSON NULL | `{"primary":"#…","secondary":"#…","accent":"#…"}` |
| font_family | VARCHAR(100) NULL | |
| is_published | BOOLEAN DEFAULT FALSE | |
| is_pro | BOOLEAN DEFAULT FALSE | |
| chatbot_enabled | BOOLEAN DEFAULT FALSE | Pro feature |
| chatbot_knowledge_base | JSON NULL | Compiled KB for AI chatbot |
| analytics_enabled | BOOLEAN DEFAULT FALSE | Pro feature |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| published_at | DATETIME NULL | |

**Indexes**: `idx_bp_slug (slug)`, `idx_bp_domain (custom_domain)`, `idx_bp_user (user_id)`

#### `page_sections`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| business_page_id | BIGINT UNSIGNED FK → business_pages | |
| section_type | VARCHAR(50) | e.g. 'hero','about','menu','gallery' |
| sort_order | INT | |
| is_visible | BOOLEAN DEFAULT TRUE | |
| config | JSON | Section-specific content and settings |
| created_at | DATETIME | |
| updated_at | DATETIME | |

**Index**: `idx_ps_page (business_page_id, sort_order)`

#### `page_images`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| business_page_id | BIGINT UNSIGNED FK → business_pages | |
| source | ENUM('upload','scrape_facebook','scrape_instagram','scrape_linkedin','scrape_tiktok','scrape_x','scrape_youtube','ai_generated') | |
| original_url | VARCHAR(500) NULL | Source URL if scraped |
| stored_url | VARCHAR(500) | CDN path |
| alt_text | VARCHAR(255) NULL | |
| width | INT NULL | |
| height | INT NULL | |
| created_at | DATETIME | |

### 3.4 Social Network

#### `posts`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK → users | |
| content | TEXT | |
| media_urls | JSON NULL | `["url1","url2"]` |
| post_type | ENUM('text','image','link','share') | |
| shared_post_id | BIGINT UNSIGNED FK → posts NULL | |
| visibility | ENUM('public','connections') DEFAULT 'public' | |
| moderation_status | ENUM('pending','approved','rejected') | |
| moderation_reason | VARCHAR(500) NULL | |
| like_count | INT DEFAULT 0 | Denormalized |
| comment_count | INT DEFAULT 0 | Denormalized |
| share_count | INT DEFAULT 0 | Denormalized |
| created_at | DATETIME | |
| updated_at | DATETIME | |
| deleted_at | DATETIME NULL | |

**Indexes**: `idx_posts_user (user_id, created_at DESC)`, `idx_posts_feed (moderation_status, created_at DESC)`

#### `comments`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| post_id | BIGINT UNSIGNED FK → posts | |
| user_id | BIGINT UNSIGNED FK → users | |
| parent_comment_id | BIGINT UNSIGNED FK → comments NULL | Threaded replies |
| content | TEXT | |
| moderation_status | ENUM('pending','approved','rejected') | Same trust-score logic |
| created_at | DATETIME | |
| deleted_at | DATETIME NULL | |

#### `likes`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK → users | |
| likeable_type | ENUM('post','comment') | Polymorphic |
| likeable_id | BIGINT UNSIGNED | |
| created_at | DATETIME | |

**Constraint**: `UNIQUE (user_id, likeable_type, likeable_id)`

### 3.5 Messaging

#### `conversations`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| type | ENUM('direct','ai_assistant','customer_chat') | |
| business_page_id | BIGINT UNSIGNED FK → business_pages NULL | For customer_chat |
| created_at | DATETIME | |
| updated_at | DATETIME | Last message time (for sorting) |

#### `conversation_participants`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| conversation_id | BIGINT UNSIGNED FK → conversations | |
| user_id | BIGINT UNSIGNED FK → users | |
| last_read_at | DATETIME NULL | For unread badge |
| is_muted | BOOLEAN DEFAULT FALSE | |
| created_at | DATETIME | |

**Constraint**: `UNIQUE (conversation_id, user_id)`

#### `messages`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| conversation_id | BIGINT UNSIGNED FK → conversations | |
| sender_id | BIGINT UNSIGNED FK → users NULL | NULL for AI messages |
| sender_type | ENUM('user','ai_assistant','system') | |
| content | TEXT | |
| media_urls | JSON NULL | |
| metadata | JSON NULL | e.g. `{"intent":"booking","calendar_link":"…"}` |
| is_escalated | BOOLEAN DEFAULT FALSE | Chatbot escalated to owner |
| created_at | DATETIME | |
| deleted_at | DATETIME NULL | |

**Index**: `idx_messages_conv (conversation_id, created_at DESC)`

### 3.6 Notifications

#### `notifications`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK → users | Recipient |
| type | ENUM('connection_request','connection_accepted','card_scanned','post_like','post_comment','message','chatbot_escalation','moderation_result','system') | |
| title | VARCHAR(255) | |
| body | TEXT NULL | |
| data | JSON NULL | Deep-link context: `{"post_id":123}` |
| is_read | BOOLEAN DEFAULT FALSE | |
| channel | SET('web_push','email') | Delivery channels |
| created_at | DATETIME | |

**Index**: `idx_notif_user (user_id, is_read, created_at DESC)`

#### `push_subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK → users | |
| endpoint | TEXT | Web Push endpoint URL |
| keys | JSON | `{"p256dh":"…","auth":"…"}` |
| user_agent | VARCHAR(500) NULL | |
| created_at | DATETIME | |

### 3.7 Events

#### `events`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| name | VARCHAR(255) | |
| description | TEXT NULL | |
| location | VARCHAR(500) NULL | |
| lat | DECIMAL(10,8) NULL | |
| lng | DECIMAL(11,8) NULL | |
| starts_at | DATETIME NULL | |
| ends_at | DATETIME NULL | |
| source | ENUM('manual','gps_suggest','eventbrite','luma') | |
| external_url | VARCHAR(500) NULL | |
| created_by | BIGINT UNSIGNED FK → users NULL | |
| created_at | DATETIME | |

#### `event_scans`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| event_id | BIGINT UNSIGNED FK → events | |
| scanned_card_id | BIGINT UNSIGNED FK → scanned_cards | |
| created_at | DATETIME | |

### 3.8 Subscriptions & Leads

#### `subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| user_id | BIGINT UNSIGNED FK → users | |
| tier | ENUM('pro') | |
| status | ENUM('active','canceled','past_due','trialing') | |
| payment_provider | ENUM('stripe','paddle') | |
| external_subscription_id | VARCHAR(255) | |
| current_period_start | DATETIME | |
| current_period_end | DATETIME | |
| canceled_at | DATETIME NULL | |
| created_at | DATETIME | |
| updated_at | DATETIME | |

#### `leads`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| business_page_id | BIGINT UNSIGNED FK → business_pages | |
| name | VARCHAR(255) NULL | |
| email | VARCHAR(255) NULL | |
| phone | VARCHAR(50) NULL | |
| message | TEXT NULL | |
| source | ENUM('contact_form','chatbot','booking') | |
| conversation_id | BIGINT UNSIGNED FK → conversations NULL | |
| created_at | DATETIME | |

#### `page_analytics`

| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT UNSIGNED PK | |
| business_page_id | BIGINT UNSIGNED FK → business_pages | |
| date | DATE | Aggregated daily |
| page_views | INT DEFAULT 0 | |
| unique_visitors | INT DEFAULT 0 | |
| chatbot_conversations | INT DEFAULT 0 | |
| leads_generated | INT DEFAULT 0 | |
| qr_scans | INT DEFAULT 0 | |

**Constraint**: `UNIQUE (business_page_id, date)`

---

## 4. Template System

### 4.1 Overview

Each template defines **section types** available for a business category. The `page_templates.schema` JSON declares available sections and their editable fields. The `business_pages.page_config` JSON stores the user's actual content. AI fills in all `aiGenerated: true` fields during wizard completion.

### 4.2 Template Schema Structure

Stored in `page_templates.schema`:

```json
{
  "sections": [
    {
      "type": "hero",
      "label": "Hero Banner",
      "required": true,
      "fields": {
        "headline": { "type": "text", "maxLength": 100, "aiGenerated": true },
        "subheadline": { "type": "text", "maxLength": 200, "aiGenerated": true },
        "backgroundImage": { "type": "image", "aspect": "16:9" },
        "cta": {
          "type": "object",
          "fields": {
            "text": { "type": "text", "maxLength": 30 },
            "action": { "type": "enum", "options": ["scroll_to_contact", "external_link", "phone", "whatsapp"] },
            "value": { "type": "text" }
          }
        },
        "layout": { "type": "enum", "options": ["centered", "left_aligned", "split"], "default": "centered" }
      }
    },
    {
      "type": "about",
      "label": "About",
      "required": false,
      "fields": {
        "heading": { "type": "text", "aiGenerated": true },
        "body": { "type": "richtext", "aiGenerated": true },
        "image": { "type": "image" }
      }
    }
  ],
  "colorSchemes": [
    { "name": "Modern Dark", "primary": "#1a1a2e", "secondary": "#16213e", "accent": "#e94560" },
    { "name": "Clean Light", "primary": "#ffffff", "secondary": "#f8f9fa", "accent": "#0066ff" }
  ],
  "fonts": ["Inter", "Playfair Display", "Heebo", "Assistant"]
}
```

### 4.3 Template Categories & Their Sections

| Category | Sections |
|----------|----------|
| **Generic Business** | hero, about, services, testimonials, contact, faq |
| **Restaurant** | hero, about, menu (categories/items/prices), gallery, hours, reservations, contact |
| **Professional Services** | hero, about, services (pricing tiers), team, testimonials, case_studies, contact |
| **E-commerce** | hero, featured_products, product_grid, about, testimonials, contact |
| **Portfolio/Creative** | hero, portfolio_grid (filterable), about, skills, testimonials, contact |
| **Health/Wellness** | hero, services, practitioners, booking, testimonials, gallery, contact |
| **Real Estate** | hero, featured_listings, property_search, about, testimonials, contact |

All templates also include these universal sections: **header/nav**, **footer**, **whatsapp_button**, **chatbot_widget** (Pro).

### 4.4 AI Content Generation Flow

```
1. User selects template category
2. Setup wizard collects answers (10 questions):
   - Business name, industry, problem solved, solution, target audience,
     products/services, pricing, social links, uploads/URLs, USP
3. User pastes social media profile URLs
4. Backend scrapes public images from those URLs → stores to cPanel → CDN
5. AI prompt constructed from:
   - page_templates.ai_prompt_template (category-specific)
   - wizard_answers
   - scraped social data (bio text, image descriptions)
6. AI generates content for all fields with aiGenerated: true
7. AI selects from scraped images for relevant sections
8. Generated config saved to business_pages.page_config
9. User reviews and edits via visual editor
```

### 4.5 Page Config Structure

Stored in `business_pages.page_config`:

```json
{
  "sections": [
    {
      "id": "sec_abc123",
      "type": "hero",
      "sortOrder": 0,
      "visible": true,
      "config": {
        "headline": "Joe's Authentic Italian Pizza",
        "subheadline": "Wood-fired perfection since 1998",
        "backgroundImage": "/uploads/pages/joes-pizza/hero.jpg",
        "cta": { "text": "Order Now", "action": "phone", "value": "+972-3-555-1234" },
        "layout": "centered"
      }
    }
  ],
  "global": {
    "colorScheme": { "primary": "#1a1a2e", "secondary": "#16213e", "accent": "#e94560" },
    "fontFamily": "Inter",
    "logoUrl": "/uploads/pages/joes-pizza/logo.png",
    "faviconUrl": null,
    "direction": "ltr"
  }
}
```

### 4.6 Rendering Pipeline

```
Request to slug.snap.cards
  → Next.js middleware extracts slug from hostname
  → Server component fetches business_pages row by slug (or custom_domain)
  → Loads page_config JSON + template_id
  → Renders <TemplateRenderer templateId={…} config={pageConfig} />
  → TemplateRenderer maps section types to React components:
       "hero"         → <HeroSection config={…} colorScheme={…} />
       "menu"         → <MenuSection config={…} colorScheme={…} />
       "gallery"      → <GallerySection config={…} colorScheme={…} />
       etc.
  → Each section component reads its config and renders RTL-aware layout
  → If chatbot_enabled: injects <ChatbotWidget pageId={…} />
  → ISR caching: revalidate on publish (on-demand) or every 1 hour
```

---

## 5. API Routes

All routes are Next.js App Router API routes under `/api/`. Auth via Supabase JWT in `Authorization: Bearer <token>`. Middleware validates JWT and attaches `userId` to request context.

### 5.1 Auth

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/callback` | Supabase auth callback; creates/updates `users` + `profiles` rows in MySQL |
| POST | `/api/auth/delete-account` | GDPR-compliant cascading soft-delete |

Auth flows (OAuth, magic link, email/password) are handled client-side by Supabase SDK. The callback syncs Supabase user to MySQL.

### 5.2 Card Scanning Pipeline

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/scan/upload` | Accepts card photo (multipart). Stores to cPanel. Returns `{imageUrl, scanId}`. Creates `scanned_cards` row with status pending. |
| POST | `/api/scan/:scanId/ocr` | Sends image to Google Cloud Vision → returns raw OCR text → LLM extracts structured fields → stores on `scanned_cards` row → returns `{fields, confidenceScore}` |
| POST | `/api/scan/:scanId/confirm` | User confirms/edits fields. Sets `is_confirmed = true`. Runs dedup check. If email matches a user → sets `matched_user_id`, auto-creates accepted connection, increments `scan_count`. If self-scan detected → returns `{isSelfScan: true}`. |
| POST | `/api/scan/qr` | Decodes QR payload. If snap.cards profile URL → resolves user, creates connection + scanned_card record. |
| GET | `/api/scan/nearby-events` | Accepts `?lat=…&lng=…`. Returns events within radius, sorted by proximity. |

**OCR Processing Detail:**

```
1. Image uploaded to cPanel → CDN URL returned
2. Google Cloud Vision API called with image URL
   → Returns: full text, word bounding boxes, detected languages
3. LLM post-processing:
   "Extract structured fields from this business card text: {raw_ocr_text}
    Return JSON: {first_name, last_name, job_title, company_name,
                  email, phone, website, address, social_links}"
4. Confidence score = average of Vision API confidence values
5. Language detection: Hebrew characters → store in Hebrew fields
6. Card photo always saved alongside extracted data
```

### 5.3 AI Page Builder

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/templates` | List active templates with thumbnails |
| POST | `/api/pages/generate` | `{templateId, wizardAnswers, socialUrls}`. Triggers async scraping + AI generation. Returns `{pageId}` immediately. |
| GET | `/api/pages/:pageId/status` | Returns `{status: 'scraping'|'generating'|'ready'|'failed'}` |
| GET | `/api/pages/:pageId` | Full page config for editing |
| PUT | `/api/pages/:pageId/config` | Save full page_config JSON |
| PUT | `/api/pages/:pageId/sections/:sectionId` | Update single section config |
| POST | `/api/pages/:pageId/sections/reorder` | `{sectionIds: [...]}` |
| POST | `/api/pages/:pageId/publish` | Sets `is_published = true`, triggers ISR revalidation |
| POST | `/api/pages/:pageId/regenerate-section` | `{sectionType, instructions}` — AI regenerates one section |
| DELETE | `/api/pages/:pageId` | Unpublish and soft-delete |

### 5.4 Social Media Scraping

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/scrape/social` | `{urls: ["https://facebook.com/…", …]}`. For each URL: identifies platform, scrapes public images (profile photo, cover, recent posts). Stores to cPanel, returns CDN URLs. Rate-limited per user. |

**Approach**: Server-side fetch with appropriate headers. Best-effort — if a platform blocks, return empty result and prompt user to upload manually. Cache scraped images immediately (never hotlink).

### 5.5 Social Feed & Moderation

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/feed` | `?cursor=…&limit=20`. Approved posts, chronological. Respects connection privacy. |
| POST | `/api/posts` | Create post. If `trust_score < THRESHOLD` → `moderation_status='pending'`, triggers async AI review. If trusted → `'approved'` immediately. |
| POST | `/api/posts/:postId/like` | Toggle like. Updates denormalized counter. |
| POST | `/api/posts/:postId/comment` | Same moderation logic as posts. |
| POST | `/api/posts/:postId/share` | Creates share post with `shared_post_id`. |
| DELETE | `/api/posts/:postId` | Soft-delete own post. |

**Internal moderation endpoint** (called async):

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/internal/moderate` | Sends content to LLM with moderation prompt. If approved → update status, increment `trust_score`. If rejected → update status + reason, send notification. |

### 5.6 Messaging & AI Chatbot

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/conversations` | List user's conversations, sorted by `updated_at DESC`. Includes last message preview + unread count. |
| GET | `/api/conversations/:convId/messages` | `?cursor=…&limit=50` |
| POST | `/api/conversations/:convId/messages` | Send message. Triggers push notification. |
| GET | `/api/conversations/poll` | `?since=<timestamp>`. Returns updated conversations. Called every 30s. |
| POST | `/api/chatbot/:pageId/message` | **Public (no auth)**. Customer → business page chatbot. Sends to LLM with knowledge base context. Returns AI response. If low confidence → escalates to owner. |
| POST | `/api/chatbot/:pageId/booking` | **Public**. Checks Google Calendar availability. Returns slots. On confirmation, creates calendar event. |

**Chatbot Knowledge Base** (compiled from):
1. `wizard_answers` — business description, services, hours
2. `scraped_social_data` — recent posts, about text
3. `page_sections` config — menu items, pricing, FAQs
4. Previous conversation history (for context)

Stored as `chatbot_knowledge_base` JSON. Refreshed when page config updates.

### 5.7 Notifications

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/notifications/subscribe` | Register web push subscription |
| GET | `/api/notifications` | `?unread=true`. List notifications. |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/read-all` | Mark all as read |

### 5.8 Profile & Digital Card

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/profile/:userId` | Returns profile with privacy rules applied (see Section 6) |
| PUT | `/api/profile` | Update own profile |
| POST | `/api/profile/qr-generate` | Generates QR code encoding `https://{username}.snap.cards` |
| GET | `/api/profile/completeness` | Returns completeness score + missing fields (used after self-scan) |

---

## 6. Privacy & Connection Model

### 6.1 Core Rules

| Scenario | What the viewer sees |
|----------|---------------------|
| **Scanned their card** (any method: photo, QR, NFC) | Full profile: name, title, company, email, phone, website, social links, bio. Auto-connected. |
| **Mutual connection** (accepted request) | Full profile. |
| **Browsing / searching** (not connected) | Name + company name only. All other fields hidden. |
| **Blocked** | Not visible in search. Cannot view profile. |

### 6.2 Connection Flow

```
Physical scan → Auto-accepted connection (both parties see full data)
Search/browse → Send connection request → Pending → Accepted/Declined
Card owner joins platform later → Can see who scanned their card → Can block/remove
```

### 6.3 Deduplication Rules

- **Per-scanner uniqueness**: Each user can have only one `scanned_cards` record per unique person.
- **Match key**: Email (primary). If no email: `first_name + last_name + company_name`.
- **Re-scanning**: Updates the existing record (merges new fields, keeps card photo history).
- **Cross-scanner**: No global dedup. If 15 people scan the same card, each has their own record.

### 6.4 Scan Abuse Prevention

- **Trust but verify**: All scans are allowed freely.
- **Card owner recourse**: If someone joins the platform and sees unwanted connections, they can block/remove.
- **Rate limiting**: 50 scans/day per user (prevents mass-scanning).
- **Reporting**: Users can flag abusive scanners.

### 6.5 Self-Scan Detection

When a scanned card's email matches the scanner's email:
1. Flag `is_self_scan = true`
2. Run **profile completeness check**: compare scanned fields to profile, highlight gaps
3. **Generate digital card**: auto-create QR code linking to profile
4. **Redirect to page builder**: suggest building a business page with pre-filled data

---

## 7. Moderation System

### 7.1 Trust Score Mechanics

| Action | Score Change |
|--------|-------------|
| Post approved by AI | +1 |
| Comment approved by AI | +1 |
| Post manually approved by admin | +2 |
| Post rejected | -2 |
| Reported by another user (upheld) | -5 |
| Account age > 30 days | +1 (one-time) |

**Trusted threshold**: `trust_score >= 5` (approximately 5 approved posts).

### 7.2 Pre-Moderation Flow

```
User creates post
  │
  ├─ trust_score >= THRESHOLD?
  │   YES → moderation_status = 'approved' → visible immediately
  │   NO  → moderation_status = 'pending' → hidden from feed
  │          │
  │          ▼
  │     Async AI moderation call
  │          │
  │          ├─ AI approves → status = 'approved', trust_score += 1
  │          │                 notification: "Your post is live"
  │          │
  │          └─ AI rejects → status = 'rejected', trust_score -= 2
  │                          notification: "Post removed: {reason}"
  │
  └─ Same flow applies to comments
```

### 7.3 AI Moderation Prompt

```
Review this social media post for a business networking platform.
Reject if it contains: hate speech, explicit content, spam/scams,
personal attacks, illegal content, or clearly non-business content.

Approve if it's: business updates, professional achievements,
industry news, networking, hiring, events, opinions on business topics.

Post content: {content}

Respond with JSON: {"approved": true/false, "reason": "..." (if rejected)}
```

### 7.4 Cost Management

- Use **cheap/fast model** for moderation (Claude Haiku / GPT-4o-mini)
- Trusted users skip AI entirely → volume decreases over time
- Keyword pre-filter catches obvious spam before hitting AI
- Budget alert if daily moderation cost exceeds $20

---

## 8. Phased Delivery Plan

Estimates assume solo founder working full-time with AI-assisted development.

### Phase 1: Foundation + AI Page Builder (Weeks 1–6)

**Goal**: Users sign up and build a live AI-generated business page.

**Week 1–2: Scaffolding + Auth**
- Next.js project with TypeScript, Tailwind CSS, App Router
- RTL infrastructure (`dir` attribute, CSS logical properties, `next-intl` for i18n)
- Supabase Auth integration (Google, Apple, email/password, magic links)
- MySQL connection from Vercel serverless (connection pooling via `mysql2` or Prisma)
- Auth callback: sync Supabase → MySQL `users` table
- Basic layout: navigation, auth pages, locale switcher (EN/HE)

**Week 3–4: Templates + AI Generation**
- Seed 5–7 template schemas into `page_templates`
- Setup wizard UI (category selection → 10-question flow)
- Social URL scraping service (best-effort fetch, graceful failure)
- AI content generation service (abstracted provider: Claude or GPT)
- Async generation pipeline: scrape → generate → store
- Build section React components: hero, about, services, gallery, contact, menu, testimonials, FAQ
- `TemplateRenderer` that maps page_config to section components

**Week 5–6: Editor + Publishing**
- Visual editor: drag-and-drop section reorder, inline text editing
- Image upload to cPanel + CloudFront
- Color scheme picker, font selector
- Publish flow: slug validation, subdomain routing via middleware
- SEO: meta tags, OG image, structured data (JSON-LD)
- Profile page at `snap.cards/u/{username}`
- QR code generation for profile

**Deliverable**: Sign up → wizard → AI-generated page live at `{slug}.snap.cards` → visual editing.

### Phase 2: Card Scanning + Contacts (Weeks 7–10)

**Goal**: Scan physical cards, manage contacts, share digital card.

**Week 7–8: OCR Pipeline**
- Camera capture UI (`<input type="file" capture="camera">` + `react-webcam` option)
- Image upload to cPanel
- Google Cloud Vision API integration
- LLM field extraction from raw OCR
- Scan confirmation UI: card photo + editable fields
- Per-scanner deduplication logic
- Self-scan detection → completeness check + digital card + builder redirect

**Week 9–10: Contact Management + Digital Card**
- Contacts list: search, filter by tags
- Contact detail view with card photo
- Tags, notes, manual editing
- QR code generation for own profile (npm `qrcode`)
- QR scanning (`html5-qrcode` library)
- NFC read (Web NFC API, Chrome/Android only, graceful fallback)
- Auto-connection from scan
- GPS capture + nearby event suggestion
- Connection request flow for non-scan connections

**Deliverable**: Full scan → confirm → save flow. Contact list. QR/NFC sharing.

### Phase 3: Social Feed + Messaging (Weeks 11–15)

**Goal**: Post, comment, like, share, message.

**Week 11–12: Feed**
- Post composer (text + image)
- Chronological feed with cursor pagination
- Like, comment, share
- Denormalized counters
- Privacy filtering (connected vs non-connected)
- Threaded comments

**Week 13: Moderation**
- Trust score tracking
- AI moderation service (async)
- Moderation notifications
- Admin review page

**Week 14–15: Messaging**
- Conversations list
- Message thread UI
- Send/receive between connections
- 30-second polling
- Unread indicators
- Web push notifications (Service Worker)
- Email notifications (Resend or SendGrid)

**Deliverable**: Social feed with moderation. Messaging. Push + email notifications.

### Phase 4: AI Chatbot + Calendar (Weeks 16–19)

**Goal**: Business pages have AI chatbot with booking.

**Week 16–17: Chatbot**
- ChatbotWidget component for business pages
- Knowledge base compiler (wizard + social + sections)
- Chatbot API with conversation context
- Confidence detection + escalation to owner
- Lead capture from chatbot conversations

**Week 18–19: Calendar + AI Assistant**
- Google Calendar OAuth for business owners
- Availability API
- Booking flow: detect intent → show slots → create event
- AI assistant in messaging (drafting, business advice)

**Deliverable**: Live chatbot on published pages. Google Calendar booking. Lead capture.

### Phase 5: Monetization + Launch (Weeks 20–24)

**Goal**: Pro tier, polish, launch.

**Week 20–21: Pro + Payments**
- Stripe integration ($20/mo Pro)
- Subscription management UI
- Feature gating (custom domain, chatbot, analytics, campaigns)
- Custom domain: DNS verification, SSL via Vercel

**Week 22–23: Analytics + Polish**
- Page analytics dashboard (views, visitors, leads, QR scans)
- Daily aggregation cron job
- Export contacts as CSV
- Performance optimization (Core Web Vitals)
- Error monitoring (Sentry)
- Rate limiting on all API routes
- Security audit (input sanitization, CSRF, SQL injection)

**Week 24: Launch**
- Marketing landing page for snap.cards
- Soft launch to Israeli tech community
- PWA wrapper for mobile (optional)

**Deliverable**: Monetized product. Pro tier with custom domains. Production-ready.

---

## 9. Technical Risks & Mitigations

### 9.1 Social Media Scraping Reliability

**Risk**: Platforms actively block scraping. Facebook, Instagram, LinkedIn have anti-bot measures. Scraped URLs may expire.

**Mitigation**:
- Treat scraping as best-effort. "Upload your own images" is always the primary option.
- Cache scraped images immediately to cPanel (never hotlink).
- Start with easiest targets (Facebook OG tags, public Instagram).
- Degrade gracefully: if blocked, prompt upload. No error shown to user.

### 9.2 MySQL on cPanel Performance at Scale

**Risk**: Shared cPanel MySQL may hit connection limits at 50K users. No read replicas.

**Mitigation**:
- Connection pooling in app layer (Prisma or `mysql2` pool).
- Aggressive caching: business page configs cached at Vercel edge (ISR).
- Denormalized counters reduce join-heavy queries.
- All indexes specified upfront.
- **Migration path**: PlanetScale (MySQL-compatible, serverless) if cPanel becomes a bottleneck. Minimal code changes.

### 9.3 Multi-Tenant Page Performance

**Risk**: Every business page hits DB for page_config. Heavy concurrent traffic across many pages.

**Mitigation**:
- Next.js ISR: static generation on first request, cached at CDN edge, on-demand revalidation on publish.
- page_config is a single JSON blob — one query, no joins.
- CloudFront CDN for all static assets.

### 9.4 OCR Accuracy for Hebrew Cards

**Risk**: Hebrew OCR accuracy lower for stylized fonts. RTL/LTR mixing (emails, URLs) creates parsing issues.

**Mitigation**:
- Google Cloud Vision has solid Hebrew support — test with real Israeli cards.
- LLM post-processing handles mixed-direction text well.
- Card photo always shown alongside fields for user verification.
- All fields are editable. Confirmation step catches errors.
- Log corrections to improve prompts over time.

### 9.5 AI Cost Management

**Risk**: Content generation + moderation + chatbot = significant LLM costs at scale.

**Mitigation**:
- Page generation: one-time cost, well-amortized.
- Moderation: trust score system means volume decreases over time.
- Chatbot: rate-limit customer messages (50/conversation/day). Cache common Q&A.
- Use cheap models (Haiku/GPT-4o-mini) for moderation + chatbot. Full models for page content.
- Track cost per user. Alert on anomalies.
- **Budget targets**: Moderation < $10/day, Chatbot < $20/day at 10K users.

### 9.6 Solo Founder Bus Factor

**Risk**: All system knowledge in one person. No code review.

**Mitigation**:
- This spec document.
- Standard patterns: Next.js App Router, Prisma, REST APIs.
- Integration tests for critical paths (scan pipeline, page generation, auth).
- Managed services (Supabase Auth, Vercel, Cloud Vision) reduce ops burden.
- Simple monolith architecture — no microservices.

### 9.7 Real-Time Messaging Limitations

**Risk**: 30-second polling feels slow for messaging. Users expect instant.

**Mitigation**:
- Acceptable for MVP. Business networking messages aren't time-critical.
- Optimize: long-polling could reduce latency to ~1-2 seconds.
- **Migration path**: Switch to Supabase Realtime (WebSockets, built-in) or Pusher when needed. Data model already supports it.

### 9.8 cPanel File Storage Reliability

**Risk**: cPanel isn't designed as object storage. No redundancy, no S3 API.

**Mitigation**:
- Upload via SFTP or cPanel API from Vercel functions.
- CloudFront CDN fronts all reads — cPanel rarely hit directly.
- Regular backups (cPanel built-in tools).
- **Migration path**: AWS S3 + CloudFront. Change upload target; CDN URLs preserved.
