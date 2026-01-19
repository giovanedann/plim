# Premium Onboarding Experience - Design Document

**Date:** 2026-01-19
**Phase:** 10
**Status:** Approved

## Overview

A premium, animated onboarding experience that educates new users about MyFinances features while optionally collecting initial setup data (salary). The flow is skippable and can be replayed from Settings.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Step count | 6 steps | Thorough education without being too long |
| Animation library | Framer Motion + Lucide-Animated | Premium feel, consistent with existing auth panel |
| Visuals | Animated Lucide icons | Consistent with auth panel, no external assets needed |
| Tone | Friendly and encouraging (pt-BR) | Reduces finance anxiety, welcoming |
| Data collection | Hybrid with optional inputs | Respects user choice, encourages engagement |
| Skip mechanism | Confirmation modal required | Prevents accidental skips |
| Replay location | Settings page only | Clean UI, extensible to help menu later |

## Onboarding Flow

### Step Structure

| Step | Icon | Title | Optional Action |
|------|------|-------|-----------------|
| 1 | Sparkles | Bem-vindo ao MyFinances! | — |
| 2 | Wallet | Controle todos os tipos de gastos | — |
| 3 | TrendingUp | Por que registrar seu salário? | Salary input |
| 4 | Tags | Organize por categorias | Customize categories |
| 5 | BarChart3 | Insights que fazem diferença | — |
| 6 | PartyPopper | Tudo pronto! | "Começar a usar" |

### Step Content Details

**Step 1 - Welcome**
- **Description:** "Seu novo parceiro para organizar suas finanças pessoais. Vamos te mostrar como aproveitar ao máximo a plataforma em poucos passos."

**Step 2 - Expense Types**
- **Description:** "Registre despesas únicas, contas recorrentes como aluguel e streaming, ou compras parceladas no cartão. Tudo organizado em um só lugar."
- **Visual:** Three icon badges (Receipt, Repeat, CreditCard) showing expense types

**Step 3 - Salary**
- **Description:** "Com sua renda cadastrada, você visualiza quanto sobra no fim do mês e recebe alertas quando os gastos estiverem altos. Seus dados ficam seguros e privados."
- **Action:** BRL salary input + "Adicionar" button | "Configurar depois" link

**Step 4 - Categories**
- **Description:** "Já criamos categorias essenciais para você: Alimentação, Transporte, Moradia e mais. Depois, você pode criar as suas próprias."
- **Visual:** Grid showing 8 default category chips with icons
- **Action:** "Personalizar categorias" button | "Usar padrões" link

**Step 5 - Dashboard**
- **Description:** "Acompanhe seus gastos por categoria, veja a evolução mensal e entenda para onde seu dinheiro está indo. Informação clara para decisões melhores."
- **Visual:** Mini mock of dashboard cards (simplified, static)

**Step 6 - Ready**
- **Description:** "Sua jornada financeira começa agora. Lembre-se: pequenos registros hoje, grandes resultados amanhã."
- **Action:** "Começar a usar" primary button (large, prominent)

## Navigation

- Progress dots at bottom showing current step
- "Pular tutorial" link visible on all steps → opens confirmation modal
- Back/Next buttons for step navigation
- Keyboard support: Arrow keys, Enter
- Escape key → opens confirmation modal

### Skip Confirmation Modal

```
"Tem certeza que deseja pular o tutorial?"
"Você pode revê-lo mais tarde nas Configurações."

[Continuar tutorial] [Pular]
```

## Visual Design

### Layout
- Full-screen overlay (immersive, not a modal)
- Dark gradient background (`slate-950` → `slate-900`)
- Content centered vertically and horizontally
- Max-width container (~500px)
- Responsive: stacks on mobile

### Step Layout
1. Animated icon (Lucide-Animated) - large, centered
2. Title - Bold, 24-28px, white
3. Description - 16-18px, `slate-300`, 2-3 sentences
4. Optional action area
5. Navigation footer - Progress dots + buttons

### Animation Choreography
- Step transitions: horizontal slide (150ms) with fade
- On step enter: icon → title (stagger 100ms) → description → action area
- Button hover: scale 1.02
- Button tap: scale 0.98

## Technical Implementation

### Dependencies
- `motion` (Framer Motion)
- Lucide-Animated icons (via shadcn CLI): Sparkles, Wallet, TrendingUp, Tags, BarChart3, PartyPopper, Receipt, Repeat, CreditCard

### File Structure
```
apps/web/src/
├── components/
│   └── onboarding/
│       ├── onboarding-overlay.tsx
│       ├── onboarding-step.tsx
│       ├── onboarding-progress.tsx
│       ├── onboarding-navigation.tsx
│       ├── skip-confirmation-modal.tsx
│       └── steps/
│           ├── welcome-step.tsx
│           ├── expense-types-step.tsx
│           ├── salary-step.tsx
│           ├── categories-step.tsx
│           ├── dashboard-step.tsx
│           └── ready-step.tsx
├── hooks/
│   └── use-onboarding.ts
```

### State Management
- Zustand store (`useOnboarding`)
- State: `currentStep`, `isOpen`, `skipped`, `salaryAdded`, `categoriesCustomized`
- Persist `currentStep` to localStorage for resume on refresh
- Persist completion to Supabase `profile.onboarded`

### Entry Point
- After sign-in, check `profile.onboarded`
- If `false`, render `<OnboardingOverlay />` over dashboard
- Use `AnimatePresence` for smooth mount/unmount

### Replay from Settings
- Settings page button calls `onboardingStore.open()`
- Sets `isReplay: true` flag
- Steps with configured data show "✓ Já configurado" with "Atualizar" option

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Refresh mid-onboarding | Resume from `localStorage.currentStep` |
| Browser close mid-onboarding | Resume on next visit |
| Salary validation | Positive numbers only, BRL format in real-time |
| Network error saving salary | Inline error, allow retry, don't block navigation |
| Replay with existing salary | Show "✓ Salário já cadastrado (R$ X.XXX)" + "Atualizar" |
| Mobile viewport | Stack layout, 44px min touch targets, swipe gestures |

## Accessibility

- Focus trap inside overlay
- `aria-live` announcements for step changes
- Full keyboard navigation
- WCAG AA color contrast
- Respect `prefers-reduced-motion` (disable animations)

## Performance

- Lazy load onboarding components
- Individual Lucide-Animated packages (minimal bundle)
- Framer Motion tree-shaking
