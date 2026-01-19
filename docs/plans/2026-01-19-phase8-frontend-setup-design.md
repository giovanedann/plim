# Phase 8: Frontend Setup - Design Document

## Overview

Set up the frontend foundation for MyFinances App including shadcn/ui, dark mode, routing, and the auth layout with animated panel.

## Project Structure

```
apps/web/src/
├── components/
│   ├── ui/                          # shadcn primitives (auto-generated)
│   ├── theme-provider.tsx           # Dark mode context
│   └── layouts/
│       ├── auth/
│       │   ├── auth.layout.tsx      # Split screen layout
│       │   └── animated-panel.tsx   # Left side with floating icons
│       └── app/
│           └── app.layout.tsx       # Main app layout (sidebar, header)
├── pages/
│   ├── sign-in.page.tsx
│   ├── sign-up.page.tsx
│   ├── auth-callback.page.tsx
│   └── dashboard.page.tsx           # Placeholder
├── lib/
│   ├── supabase.ts                  # Supabase client
│   ├── query-client.ts              # React Query setup
│   └── utils.ts                     # cn() helper from shadcn
├── stores/
│   └── ui.store.ts                  # Theme preference, sidebar state
├── router.tsx                       # React Router config
├── app.tsx                          # Root with providers
├── main.tsx
└── index.css                        # Tailwind + shadcn CSS variables
```

## shadcn Configuration

- **Style**: Default
- **Base color**: Slate
- **CSS variables**: Yes
- **Initial components**: button, input, label, card, form

## Dark Mode Implementation

### Provider Stack

```tsx
<ThemeProvider defaultTheme="system">
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
</ThemeProvider>
```

### No-Flash Script

Inline script in `index.html` before React:

```html
<script>
  const theme = localStorage.getItem('theme');
  if (theme === 'dark' || (!theme && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
</script>
```

### Theme Modes

- `light`: Light backgrounds, dark text
- `dark`: Slate-950 backgrounds, light text
- `system`: Follows OS preference (default)

## Auth Layout Design

### Split Screen Layout

```
┌─────────────────────────────────────────────────────────┐
│                           │                             │
│   [Animated Dark Panel]   │      [Auth Form Area]       │
│                           │                             │
│   - Dark background       │   - White/dark bg (themed)  │
│   - Floating Lucide icons │   - Logo at top             │
│   - CSS keyframe anims    │   - Form card centered      │
│   - Always dark (no theme)│   - Sign in / Sign up       │
│                           │   - Social buttons          │
│                           │   - Link to other auth page │
│                           │                             │
└─────────────────────────────────────────────────────────┘
         50%                           50%
```

### Animated Panel

- **Background**: Fixed `bg-slate-950` (always dark, ignores theme)
- **Icons**: Lucide React icons
  - Wallet, CreditCard, PiggyBank, TrendingUp
  - Banknote, Receipt, Coins, BadgeDollarSign
- **Positioning**: Absolutely positioned, scattered across panel
- **Animations**: CSS keyframes
  - Float up/down with slight rotation
  - Staggered delays (0s to 2s)
  - Varied durations (3s to 6s)
- **Opacity**: 20-40% to avoid distraction
- **Gradient overlay**: Subtle depth effect

### CSS Animation

```css
@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}
```

## React Router Configuration

```tsx
const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/sign-in" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-up', element: <SignUpPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/expenses', element: <ExpensesPage /> },
    ],
  },
  {
    path: '/auth/callback',
    element: <AuthCallbackPage />,
  },
]);
```

## Dependencies

### To Add

- `lucide-react` - Icons
- `react-hook-form` - Form handling (for Phase 9)
- `@hookform/resolvers` - Zod integration (for Phase 9)

### shadcn CLI Handles

- `clsx`, `tailwind-merge` - cn() utility
- `class-variance-authority` - Component variants
- `@radix-ui/*` - Primitive components

## Deliverables

1. shadcn/ui initialized with default slate theme
2. Components: button, input, label, card, form
3. ThemeProvider with no-flash script and toggle
4. React Router v7 configured
5. React Query client setup
6. Zustand UI store skeleton
7. Supabase client for auth
8. Auth layout with animated panel
9. Placeholder pages (sign-in, sign-up, dashboard)

## Not Included (Phase 9)

- Actual sign-in/sign-up form logic
- Supabase auth integration
- Protected route guards
- Form validation
