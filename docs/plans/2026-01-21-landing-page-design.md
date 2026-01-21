# Landing Page Design - Plim

## Overview

Public marketing landing page for Plim finance app. Features scroll-snap sections with alternating image/text layout that animates between sections. All content in pt-BR.

**Target:** Convert visitors to sign-ups by showcasing the app's value through a problem→solution narrative.

---

## Page Structure

```
┌─────────────────────────────────────┐
│  Sticky Header (appears on scroll)  │
├─────────────────────────────────────┤
│  1. Hero Section                    │
├─────────────────────────────────────┤
│  2. Dashboard Feature               │  ← Image LEFT, text RIGHT
├─────────────────────────────────────┤
│  3. Expenses Feature                │  ← Image RIGHT, text LEFT
├─────────────────────────────────────┤
│  4. Categories Feature              │  ← Image LEFT, text RIGHT
├─────────────────────────────────────┤
│  5. Profile Feature                 │  ← Image RIGHT, text LEFT
├─────────────────────────────────────┤
│  6. Pricing Section                 │
├─────────────────────────────────────┤
│  7. Final CTA Section               │
├─────────────────────────────────────┤
│  8. Footer                          │
└─────────────────────────────────────┘
```

---

## Section Details

### 1. Hero Section

**Layout:** Full viewport height, centered content

**Content (pt-BR):**
- **Headline:** "Domine suas finanças pessoais"
- **Subheadline:** "Acompanhe gastos, visualize padrões e economize mais todo mês. Simples, visual e gratuito."
- **CTA Button:** "Começar agora — é grátis"
- **Secondary link:** "Já tem conta? Entrar"

**Visual:**
- Animated Plim logo (float-wave animation, larger size)
- Floating finance icons in background (reuse auth panel pattern)
- Dark gradient background (slate-950 → slate-900)

**Mobile:** Stack vertically, reduce icon count

---

### 2. Dashboard Feature Section

**Layout:** Image LEFT, text RIGHT (reverses on mobile)

**Content (pt-BR):**
- **Badge:** "Visão Geral"
- **Headline:** "Veja o panorama completo"
- **Description:** "Dashboard interativo com gráficos que mostram para onde vai seu dinheiro. Acompanhe receitas, despesas e taxa de economia em tempo real."
- **Bullet points:**
  - "Gráficos de gastos por categoria"
  - "Comparação receita vs despesas"
  - "Taxa de economia mensal"

**Image:** Dashboard screenshot placeholder (styled box with chart icons)

---

### 3. Expenses Feature Section

**Layout:** Image RIGHT, text LEFT

**Content (pt-BR):**
- **Badge:** "Despesas"
- **Headline:** "Controle total dos gastos"
- **Description:** "Registre despesas únicas, recorrentes ou parceladas. Nunca mais perca uma parcela do cartão de crédito."
- **Bullet points:**
  - "Gastos únicos, recorrentes e parcelados"
  - "Filtros por categoria e forma de pagamento"
  - "Histórico completo por mês"

**Image:** Expenses page screenshot placeholder

---

### 4. Categories Feature Section

**Layout:** Image LEFT, text RIGHT

**Content (pt-BR):**
- **Badge:** "Categorias"
- **Headline:** "Organize do seu jeito"
- **Description:** "Categorias padrão já inclusas ou crie as suas. Personalize com ícones e cores para identificar rapidamente seus gastos."
- **Bullet points:**
  - "8 categorias padrão inclusas"
  - "Crie categorias personalizadas"
  - "54 ícones e 12 cores para escolher"

**Image:** Categories page screenshot placeholder

---

### 5. Profile Feature Section

**Layout:** Image RIGHT, text LEFT

**Content (pt-BR):**
- **Badge:** "Perfil"
- **Headline:** "Sua experiência, suas regras"
- **Description:** "Configure seu salário, moeda preferida e personalize seu avatar. O Plim se adapta a você."
- **Bullet points:**
  - "Histórico de salários"
  - "Avatar personalizado"
  - "Configurações de moeda e localização"

**Image:** Profile page screenshot placeholder

---

### 6. Pricing Section

**Layout:** Centered, two-column card comparison

**Content (pt-BR):**

#### Grátis (Free Tier)
- **Price:** R$ 0 / mês
- **Features:**
  - ✓ Despesas ilimitadas
  - ✓ Dashboard completo
  - ✓ Categorias personalizadas
  - ✓ Histórico de salários
- **CTA:** "Começar grátis"

#### Premium (Paid Tier)
- **Price:** R$ 9,90 / mês
- **Badge:** "Em breve"
- **Features:**
  - ✓ Tudo do plano Grátis
  - ✓ Insights com IA
  - ✓ Exportar para CSV/PDF
  - ✓ Relatórios avançados
  - ✓ Suporte prioritário
- **CTA:** "Avise-me quando lançar" (disabled/waitlist style)

---

### 7. Final CTA Section

**Layout:** Full-width, centered, dark background

**Content (pt-BR):**
- **Headline:** "Pronto para organizar suas finanças?"
- **Subheadline:** "Comece agora e veja a diferença em poucos minutos."
- **CTA Button:** "Criar conta grátis"
- **Trust text:** "Sem cartão de crédito. Cancele quando quiser."

---

### 8. Footer

**Layout:** Simple, centered

**Content:**
- Plim logo (small)
- Copyright: "© 2026 Plim. Todos os direitos reservados."
- Links: "Termos de Uso" | "Privacidade" (can be placeholder links for now)

---

## Animation Specification

### Scroll-Snap Behavior

```css
/* Container */
.landing-container {
  scroll-snap-type: y mandatory;
  overflow-y: scroll;
  height: 100vh;
}

/* Each section */
.landing-section {
  scroll-snap-align: start;
  min-height: 100vh;
}
```

### Alternating Image Animation

The image container alternates position (left/right) between sections. On scroll:

1. **Section enters viewport** → Image slides in from its side
2. **Scroll to next section** → Image slides out, new image slides in from opposite side

**CSS approach:**
```css
/* Image wrapper with transition */
.feature-image {
  transition: transform 0.6s ease-out, opacity 0.4s ease-out;
}

/* Position variants */
.image-left { transform: translateX(0); }
.image-right { transform: translateX(0); }

/* Entry animations (triggered by scroll-snap) */
.feature-section:not(:target) .feature-image {
  opacity: 0;
  transform: translateX(-100px); /* or +100px for right */
}
```

### Sticky Header

- Appears after scrolling past hero (use CSS `position: sticky` with offset)
- Contains: Plim logo (small) + "Começar agora" CTA button
- Transparent → solid background transition on scroll

---

## Visual Design

### Color Scheme

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Hero background | slate-950 | slate-950 |
| Section backgrounds | Alternating white/slate-50 | Alternating slate-900/slate-950 |
| Text primary | slate-900 | slate-50 |
| Text secondary | slate-600 | slate-400 |
| Accent/CTA | amber-500 | amber-400 |
| Badge background | amber-100 | amber-900/30 |

### Typography

- **Headlines:** text-4xl md:text-5xl font-bold (Sora)
- **Subheadlines:** text-xl md:text-2xl font-medium
- **Body:** text-base md:text-lg
- **Badges:** text-sm font-medium uppercase tracking-wide

### Screenshot Placeholders

Styled boxes that indicate where screenshots will go:

```tsx
<div className="aspect-video rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300
  dark:from-slate-700 dark:to-slate-800 flex items-center justify-center
  shadow-2xl border border-slate-200 dark:border-slate-700">
  <div className="text-center text-slate-500 dark:text-slate-400">
    <MonitorIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
    <p className="text-sm">Screenshot: Dashboard</p>
  </div>
</div>
```

---

## File Structure

```
apps/web/src/
├── routes/
│   └── landing.tsx              # Route definition
├── pages/
│   └── landing/
│       ├── landing.page.tsx     # Main page component
│       ├── components/
│       │   ├── hero-section.tsx
│       │   ├── feature-section.tsx    # Reusable for all features
│       │   ├── pricing-section.tsx
│       │   ├── cta-section.tsx
│       │   ├── landing-header.tsx     # Sticky header
│       │   └── landing-footer.tsx
│       └── index.ts
```

---

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | Stack image above text, reduce floating icons, smaller typography |
| Tablet (768-1024px) | Side-by-side layout maintained, adjusted spacing |
| Desktop (>1024px) | Full layout with all animations |

---

## Accessibility

- Respect `prefers-reduced-motion` — disable scroll-snap and slide animations
- Proper heading hierarchy (h1 in hero, h2 in sections)
- All images have alt text
- CTA buttons have clear focus states
- Sufficient color contrast (WCAG AA)

---

## Route Configuration

The landing page should be accessible at `/` for unauthenticated users:

```typescript
// routes/index.tsx
export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => {
    // If authenticated, redirect to dashboard
    if (context.auth.user) {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: LandingPage,
})
```

This replaces the current behavior that redirects `/` to `/sign-in`.

---

## Verification

1. **Visual check:** All sections render correctly in light/dark mode
2. **Animation check:** Scroll-snap works, images alternate sides smoothly
3. **Mobile check:** Responsive layout works on mobile viewport
4. **Navigation check:** CTAs navigate to /sign-in or /sign-up correctly
5. **Auth redirect:** Authenticated users at `/` redirect to `/dashboard`
6. **Build check:** `pnpm typecheck && pnpm lint && pnpm test`
