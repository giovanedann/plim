---
name: frontend-engineering
description: Use when writing any frontend code - React components, hooks, state management, styling, or UI logic
---

# Frontend Engineering Standards

## Role

Staff frontend engineer focused on React and performant, accessible websites. Building a finance application where **user experience and trust are paramount**.

## Core Priorities (In Order)

1. **Security** — Never expose sensitive data, sanitize inputs
2. **User Experience** — Intuitive, responsive, fast feedback
3. **Accessibility** — Finance apps must be usable by everyone
4. **Performance** — Fast loads, smooth animations, no jank
5. **Visual Quality** — Clean, professional UI that builds trust

## Stack

- **Build:** Vite
- **Framework:** React 19+
- **Routing:** React Router v7
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui + Aceternity UI (animations)
- **Forms:** React Hook Form + Zod
- **Server State:** React Query (TanStack Query)
- **Client State:** Zustand
- **Validation:** Zod (shared with backend)

## Type Safety — Single Source of Truth

**ALL domain types and schemas MUST come from `@plim/shared`.** Never create duplicate type definitions in the frontend.

### Why This Matters

- Prevents field name mismatches (e.g., `amount` vs `amount_cents`)
- Zod schemas validate at runtime AND provide TypeScript types
- Changes propagate to both frontend and backend automatically
- No drift between what API expects and what frontend sends

### Rules

```typescript
// CORRECT: Import types from shared package
import type { Profile, CreateSalary, SalaryHistory } from '@plim/shared'
import { createExpenseSchema } from '@plim/shared'

// WRONG: Never create local type definitions for API entities
// apps/web/src/lib/api-types.ts  ← DELETE THIS FILE
interface Profile { ... }  // ← NEVER DO THIS
```

### What Goes in Shared vs Frontend

| Location | What |
|----------|------|
| `@plim/shared` | All entity types (Profile, Expense, Category, Salary), Zod schemas, validation rules, constants |
| Frontend only | UI-specific types (component props, form state), React Query types, Zustand store types |

### Service Layer Pattern

```typescript
// apps/web/src/services/profile.service.ts
import { api } from '@/lib/api-client'
import type { Profile, UpdateProfile } from '@plim/shared'

export const profileService = {
  async getProfile() {
    return api.get<Profile>('/profile')
  },
  async updateProfile(data: UpdateProfile) {
    return api.patch<Profile>('/profile', data)
  },
}
```

## Component Organization (Co-location)

All related files (component, hook, test) live together in the same folder.

```
apps/web/src/
├── components/
│   ├── ui/                          # shadcn primitives (button, input, card)
│   ├── forms/
│   │   └── create-transaction/
│   │       ├── create-transaction.form.tsx
│   │       ├── use-create-transaction.form.ts
│   │       └── create-transaction.form.test.ts
│   └── layouts/
│       └── dashboard/
│           ├── dashboard.layout.tsx
│           ├── use-dashboard.layout.ts
│           └── dashboard.layout.test.ts
├── pages/                           # Route components
├── hooks/                           # Global shared hooks only
├── lib/                             # Utilities, helpers
└── stores/                          # Zustand stores
```

### File Naming Convention

```
{name}.{type}.{ext}
```

| Type | Extension | Example |
|------|-----------|---------|
| Component | `.tsx` | `create-transaction.form.tsx` |
| Hook | `.ts` | `use-create-transaction.form.ts` |
| Test | `.test.ts` | `create-transaction.form.test.ts` |
| Types | `.types.ts` | `create-transaction.types.ts` |
| Utils | `.utils.ts` | `create-transaction.utils.ts` |

### Rules

- **Kebab-case** for all file and folder names
- **Co-locate** component + hook + test in same folder
- **Global hooks** only in `hooks/` — component-specific hooks stay with component
- Hook files always prefixed with `use-`

### shadcn Standards

- Keep `components/ui/` for shadcn primitives only
- Customize via Tailwind, don't modify shadcn source directly
- Use CSS variables for theming (shadcn default approach)

## Theming & Dark Mode

### Styling Approach

**Use standard shadcn/ui styles initially.** Do not customize the default CSS variables or color palette until explicitly requested. This ensures:
- Consistent, battle-tested design out of the box
- Faster development without design decisions
- Easy future customization by updating CSS variables in `globals.css`

### Dark Mode Implementation

Use shadcn's recommended `next-themes` pattern (works with Vite/React too):

```typescript
// components/theme-provider.tsx
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system'
    }
    return 'system'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    localStorage.setItem('theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
```

### Theme Toggle Component

```typescript
// components/ui/theme-toggle.tsx
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

### CSS Setup

Ensure `globals.css` includes both light and dark variables (shadcn CLI generates these):

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    /* ... other light mode variables */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... other dark mode variables */
  }
}
```

### Rules

- **Default to system preference** — Respect user's OS setting on first visit
- **Persist choice** — Save to localStorage after manual toggle
- **No flash** — Add `class="dark"` to `<html>` in index.html with inline script if needed
- **Accessible toggle** — Always include aria-label on theme toggle button

### Theme-Aware Styling (CRITICAL)

**NEVER use hardcoded colors.** All components MUST work in both light and dark modes.

```typescript
// WRONG: Hardcoded colors that only work in dark mode
className="bg-slate-800 border-slate-700 text-white text-slate-400"

// CORRECT: CSS variables that adapt to theme
className="bg-muted border-border text-foreground text-muted-foreground"
```

| Hardcoded (WRONG) | CSS Variable (CORRECT) |
|-------------------|------------------------|
| `bg-slate-800`, `bg-slate-900` | `bg-background`, `bg-muted` |
| `bg-slate-800/50` | `bg-muted/50` |
| `border-slate-700` | `border-border` |
| `text-white` | `text-foreground` |
| `text-slate-300`, `text-slate-400` | `text-muted-foreground` |
| `text-slate-500` | `text-muted-foreground` |
| `placeholder:text-slate-500` | `placeholder:text-muted-foreground` |

**Accent colors are OK:** Colors like `text-emerald-500`, `text-amber-400`, `text-blue-400` for icons and highlights are acceptable since they work in both modes.

**Rule of thumb:** If a Tailwind class contains a specific shade number (e.g., `slate-800`), replace it with a CSS variable equivalent.

## State Management Rules

### When to Use What

| State Type      | Tool            | Examples                              |
| --------------- | --------------- | ------------------------------------- |
| **Server data** | React Query     | Expenses, categories, user profile    |
| **Global UI**   | Zustand         | Sidebar open, theme, user preferences |
| **Form state**  | React Hook Form | All forms                             |
| **Local UI**    | useState        | Modal open, dropdown expanded         |

### React Query Patterns

```typescript
// features/expenses/api.ts
export function useExpenses(filters: ExpenseFilters) {
  return useQuery({
    queryKey: ["expenses", filters],
    queryFn: () => expenseService.list(filters),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: expenseService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });
}
```

### Zustand Patterns

```typescript
// stores/ui.ts
interface UIStore {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

## React Best Practices

### useEffect — Use Sparingly

```typescript
// BAD: useEffect for derived state
const [fullName, setFullName] = useState('')
useEffect(() => {
  setFullName(`${firstName} ${lastName}`)
}, [firstName, lastName])

// GOOD: Derive during render
const fullName = `${firstName} ${lastName}`

// BAD: useEffect to sync with props
useEffect(() => {
  setLocalValue(prop)
}, [prop])

// GOOD: Use prop directly or key prop to reset
<Component key={id} initialValue={prop} />
```

**Valid useEffect uses:**

- Subscriptions (WebSocket, event listeners)
- Syncing with external systems (analytics, third-party widgets)
- Data fetching (prefer React Query instead)

### useMemo/useCallback — Use Judiciously

```typescript
// DON'T: Memoize everything
const name = useMemo(() => user.name, [user.name]); // Pointless
const handleClick = useCallback(() => onClick(), [onClick]); // Usually unnecessary

// DO: Memoize expensive computations
const sortedExpenses = useMemo(
  () => expenses.sort((a, b) => b.date - a.date),
  [expenses],
);

// DO: Memoize when passed to memoized children
const handleSubmit = useCallback(
  (data: FormData) => {
    mutation.mutate(data);
  },
  [mutation],
);

// Used in: <MemoizedForm onSubmit={handleSubmit} />
```

**When to memoize:**

- Expensive calculations (sorting, filtering large lists)
- References passed to `React.memo` components
- References used in dependency arrays

**When NOT to memoize:**

- Simple values or string concatenations
- Functions that only run on user interaction (not in render)
- Components that re-render anyway due to parent

## Forms with React Hook Form + Zod

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createExpenseSchema, type CreateExpense } from '@plim/shared'

export function ExpenseForm({ onSuccess }: { onSuccess: () => void }) {
  const createExpense = useCreateExpense()

  const form = useForm<CreateExpense>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: {
      amount: 0,
      description: '',
      category: 'other',
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    createExpense.mutate(data, { onSuccess })
  })

  return (
    <form onSubmit={onSubmit}>
      {/* Use shadcn Form components */}
    </form>
  )
}
```

## Loading & Error States

### Every Async Operation Needs Both

```typescript
function ExpenseList() {
  const { data, isLoading, error } = useExpenses()

  if (isLoading) return <ExpenseListSkeleton />
  if (error) return <ErrorState message="Failed to load expenses" retry={refetch} />
  if (!data?.length) return <EmptyState message="No expenses yet" />

  return <ExpenseTable data={data} />
}
```

### Skeleton Components

- Match the layout of actual content
- Use shadcn's Skeleton component
- Avoid layout shift when content loads

## Accessibility (a11y)

### Baseline Requirements

- All interactive elements keyboard accessible
- Proper heading hierarchy (h1 > h2 > h3)
- Form inputs have labels (use shadcn Form)
- Color contrast meets WCAG AA (4.5:1 for text)
- Focus indicators visible
- Screen reader announcements for dynamic content

```typescript
// Announce success/error to screen readers
<div role="status" aria-live="polite">
  {mutation.isSuccess && 'Expense created successfully'}
</div>
```

### Finance-Specific a11y

- Numbers should be readable by screen readers
- Currency formatting consistent
- Tables have proper headers and scope

## Performance

### Bundle Size

- Lazy load routes: `React.lazy()` + Suspense
- Tree-shake imports: `import { Button } from '@/components/ui/button'`
- Analyze bundle: `vite-bundle-visualizer`

### Runtime Performance

- Virtualize long lists (expenses list) with `@tanstack/react-virtual`
- Debounce search inputs
- Avoid unnecessary re-renders (React DevTools Profiler)

## Code Style

### No Comments Unless Strictly Necessary

Code should be self-documenting through clear naming and structure. Only add comments when:
- Explaining **why** something unusual is done (not what)
- Documenting complex algorithms or business rules
- Warning about non-obvious side effects

```typescript
// BAD: Obvious from code
// Check if user is logged in
if (!user) return <Navigate to="/login" />

// BAD: Describes what hook does
// Custom hook for expense form
function useExpenseForm() {}

// GOOD: Explains workaround
// Workaround for React 19 StrictMode double-mount in dev
const mountedRef = useRef(false)

// GOOD: Non-obvious business logic
// Must match backend validation: max 12 installments for credit card
const MAX_INSTALLMENTS = 12
```

## Animations (Aceternity UI)

- Use for delight, not distraction
- Respect `prefers-reduced-motion`
- Keep animations under 300ms for interactions
- Reserve elaborate animations for onboarding/empty states

```typescript
// Respect user preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

<motion.div
  animate={{ opacity: 1 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
>
```

## Testing

### What to Test

```typescript
// Component behavior
describe("ExpenseForm", () => {
  it("submits valid data", async () => {});
  it("shows validation errors for invalid data", async () => {});
  it("disables submit while loading", async () => {});
  it("shows success message on completion", async () => {});
});

// User flows
describe("expense creation flow", () => {
  it("creates expense and shows in list", async () => {});
  it("shows error and allows retry on failure", async () => {});
});

// Accessibility
describe("accessibility", () => {
  it("has no axe violations", async () => {});
  it("is keyboard navigable", async () => {});
});
```

### Testing Stack

- **Test Runner:** Vitest
- **Component Testing:** React Testing Library
- **a11y Testing:** jest-axe
- **E2E (later):** Playwright

### Test Structure (Co-located)

Tests live with their components:

```
apps/web/src/
├── components/
│   └── forms/
│       └── create-expense/
│           ├── create-expense.form.tsx
│           ├── use-create-expense.form.ts
│           └── create-expense.form.test.ts   # Unit/component tests here
├── tests/
│   ├── integration/
│   │   └── expense-flow.test.ts              # Cross-component flow tests
│   └── setup.ts
```

## Security Checklist

- [ ] Never store tokens in localStorage (use httpOnly cookies or memory)
- [ ] Sanitize any user-generated content before rendering
- [ ] Validate all inputs client-side (and server-side)
- [ ] No sensitive data in URLs or logs
- [ ] CSP headers configured
- [ ] Dependencies audited (`npm audit`)
