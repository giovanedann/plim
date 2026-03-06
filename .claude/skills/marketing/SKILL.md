---
name: marketing
description: Use when creating marketing content for Plim - Instagram posts, Reels, Stories, and promotional HTML landing pages
---

# Marketing Content Standards

## Role

Marketing designer/developer focused on creating high-impact visual content for Plim, a Brazilian finance app. Produces self-contained HTML files that render as social media creatives (Instagram posts, Reels, Stories, carousels).

## Core Priorities (In Order)

1. **Visual Impact** — Stop-scrolling designs that communicate value instantly
2. **Brand Consistency** — Follow Plim's established design system exactly
3. **Content Clarity** — Portuguese (pt-BR), concise copy, clear CTAs
4. **Animation Quality** — Smooth, purposeful animations for Reels/Stories

## Plim Design System

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0b0f1a` | Main canvas |
| Page bg | `#1a1a2e` | Body/viewport background |
| Gold primary | `#f59e0b` | Accent, highlights, CTAs |
| Gold light | `#fbbf24` | Gold text, gradient endpoints |
| Purple primary | `#8b5cf6` | Secondary accent |
| Purple light | `#a78bfa` | Step numbers, secondary highlights |
| Emerald primary | `#10b981` | Success, progress bars |
| Emerald light | `#34d399` | Success text, step numbers |
| Text primary | `#fff` | Headlines, titles |
| Text muted | `#94a3b8` | Subtitles, descriptions |
| Text dim | `#64748b` | Step descriptions, footer secondary |
| Text footer | `#475569` | Footer text, dots |

### Typography

- **Font:** `'Sora', sans-serif` via Google Fonts
- **Weights:** 400 (body), 500 (medium), 600 (semibold), 700 (bold), 800 (headlines)
- **Import:** `https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap`

### Visual Effects

**Ambient Glow Blobs:**
```css
/* Gold blob */
background: radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%);

/* Purple blob */
background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);

/* Emerald blob */
background: radial-gradient(circle, rgba(16, 185, 129, 0.06) 0%, transparent 70%);
```

**Grid Overlay:**
```css
background-image:
  linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
  linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
background-size: 60px 60px;
```

**Glass-morphism Cards:**
```css
background: rgba(255, 255, 255, 0.04);
border: 1px solid rgba(255, 255, 255, 0.06);
backdrop-filter: blur(8px);
border-radius: 20px;
```

**Gold Gradient Text:**
```css
background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f59e0b 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
```

### Animations

- **Easing:** `cubic-bezier(0.22, 1, 0.36, 1)` for entrances
- **Staggered delays:** ~150ms between sequential elements
- **Blob breathing:** `transform: scale(1) → scale(1.12)` over 6–8s infinite
- **Shine sweep:** Diagonal light sweep across cards, 6s infinite
- **Logo entrance:** `scale(0.7) → scale(1.05) → scale(1)` with bounce

### Logo

Plim SVG (piggy bank with coins) — 64×64 viewBox, always with glow drop-shadow:

```css
filter: drop-shadow(0 0 20px rgba(255, 193, 7, 0.4));
```

The full SVG source is in the existing HTML files in `instagram_posts/`. Copy it from there.

## Required Pre-Creation Step

**ALWAYS ask the user which format before generating content:**

| Format | Dimensions | Description |
|--------|-----------|-------------|
| **Instagram Post** | 1080×1080px | Static or minimal animation, single-screen |
| **Instagram Reel/Story** | 1080×1920px | Multi-screen animated sequence |
| **Carousel** | 1080×1080px per slide | Multiple static screens in sequence |

## Content Structure

### Every Piece Must Include

1. Plim logo (SVG + text)
2. Headline with gold gradient on key words
3. Value proposition / feature showcase
4. CTA (call to action)
5. Footer with `plim.app.br`

### Instagram Post (1080×1080)

Single-screen layout with visual hierarchy:

```
┌────────────────────────┐
│       [Logo + Plim]    │
│                        │
│    Headline with       │
│    gold keywords       │
│                        │
│    Content / Feature   │
│    showcase area       │
│                        │
│    [CTA pill/badge]    │
│                        │
│  plim.app.br • tagline │
└────────────────────────┘
```

- `.post` container: `width: 1080px; height: 1080px;`
- Body centers the post with `display: flex; align-items: center; justify-content: center; min-height: 100vh;`

### Instagram Reel/Story (1080×1920)

Animated sequence built in **phases**. The number of phases, their duration, and their content vary per video — adapt to the message. Use CSS `animation-delay` to orchestrate the timeline.

**Phase pattern:**
- Each phase occupies the full 1080×1920 canvas (`position: absolute; inset: 0;`)
- Phases transition via fade-out of the current + fade-in of the next
- Elements within a phase use staggered entrance animations
- Total duration depends on the content — can be 10s, 15s, 20s+

**Final phase (CTA outro) — consistent across all Reels:**
```
┌────────────────────┐
│                    │
│   [Logo big]       │
│   Persuasion line  │
│   [plim.app.br]    │
│   Subtitle         │
│                    │
└────────────────────┘
```

The CTA outro always includes: large logo with glow, a compelling headline with gold gradient keywords, the `plim.app.br` URL in a pill/badge with pulse animation, and a subtitle. This is the one constant — everything before it is shaped by the content.

**Technical requirements:**

- `.post` container: `width: 1080px; height: 1920px;`
- `.post` uses `position: absolute; top: 50%; left: 50%;` with `transform-origin: center center;`
- Must include auto-scale script for browser preview:

```javascript
function scaleToFit() {
  var post = document.querySelector('.post');
  var scale = (window.innerHeight - 40) / 1920;
  post.style.transform = 'translate(-50%, -50%) scale(' + scale + ')';
}
scaleToFit();
window.addEventListener('resize', scaleToFit);
```

### Carousel (1080×1080 per slide)

Multiple slides with consistent styling, each as a separate `<div>` within a scrollable container.

## Output Rules

- **Directory:** `instagram_posts/`
- **Naming:** `instagram-{topic-slug}.html`
- **Language:** Portuguese (pt-BR) — `<html lang="pt-BR">`
- **Self-contained:** All CSS in `<style>`, JS in `<script>`, no external dependencies except Google Fonts
- **Reset:** `* { margin: 0; padding: 0; box-sizing: border-box; }`
- **Always include:** `<meta charset="UTF-8">` and `<meta name="viewport" content="width=device-width, initial-scale=1.0">`

## Strategic Marketing Templates

Use these as planning tools *before* creating HTML content. They help define messaging and positioning:

### 1. Business Clarity & Positioning
Analyze Plim's positioning as a Brazilian personal finance app. Define who we target (young adults and professionals in Brazil who want to control spending, track expenses, and manage credit card invoices), what problem we solve (financial disorganization and lack of visibility into where money goes), why we're different (simple, beautiful UI with AI-powered insights, free tier, Pro plan with advanced features), and how to position so people immediately understand our value.

### 2. Audience Deep Understanding
Study Plim's target audience — Brazilians aged 20–40 who struggle with financial control, live paycheck to paycheck, or want to build better money habits. Identify their main problems (not knowing where money goes, credit card surprises, no savings discipline), desires (financial peace, growing savings, feeling in control), fears (debt, unexpected bills, financial instability), and what makes them stop scrolling, trust an app, and convert to Pro.

### 3. Competitive Advantage Mapping
Reverse engineer Plim's top competitors in the Brazilian finance app space (Mobills, Organizze, Guiabolso, Cumbuca). Identify their strengths, weaknesses, content themes, monetization approach, and positioning gaps. Propose a strategic angle that differentiates Plim clearly — focusing on our AI insights, modern design, credit card invoice tracking, and referral program.

### 4. Revenue Aligned Content System
Create a content ecosystem for Plim's Instagram that connects awareness posts (financial tips, relatable money struggles), value posts (feature showcases, how-to guides), trust posts (user stories, before/after financial health), and conversion posts (Pro plan benefits, referral program) into a single revenue-driven flow. Map each content type to a stage of the customer journey from discovery to Pro subscription.

### 5. Algorithm-First Growth Engineering
For Instagram (Reels, Stories, Posts), design a content structure optimized for retention, engagement velocity, and distribution signals. Include hook patterns for finance content (surprising stats, relatable pain points, "you're losing money if..."), content pacing for Reels (hook in first 1.5s, value by 3s, CTA at end), and engagement triggers (polls in Stories, save-worthy tips in Posts, share-worthy Reels).

### 6. High Impact Post Creator
For a given topic related to Plim's features or financial education, create a complete Instagram post including a scroll-stopping hook, main content that delivers value or showcases a feature, and a clear call to action (download Plim, try Pro, share with a friend). All copy in Portuguese (pt-BR), aligned with Plim's brand voice: friendly, direct, empowering — never condescending about money.

### 7. The 30 Day Content Plan
Create a detailed 30-day Instagram content plan for Plim. Include daily post ideas mixing formats (Posts, Reels, Stories, Carousels), the purpose of each post (awareness, engagement, conversion), and how it moves the audience closer to downloading Plim or subscribing to Pro. Balance between financial education content, feature showcases, social proof, and direct conversion posts.
