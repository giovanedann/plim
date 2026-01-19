# Phase 8: Frontend Setup - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up the frontend foundation with shadcn/ui, dark mode, routing, and auth layout with animated panel.

**Architecture:** Provider-wrapped React app with ThemeProvider (dark mode), QueryClientProvider (React Query), and RouterProvider (React Router v7). Auth pages use a split-screen layout with an always-dark animated left panel and themed right panel for forms.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind CSS, shadcn/ui (default slate theme), React Router v7, React Query, Zustand, Lucide React icons

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install runtime dependencies**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm add lucide-react clsx tailwind-merge class-variance-authority
```

**Step 2: Install shadcn/ui dependencies**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm add @radix-ui/react-slot @radix-ui/react-label
```

**Step 3: Verify installation**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm list lucide-react clsx tailwind-merge
```
Expected: All packages listed with versions

**Step 4: Commit**

```bash
git add apps/web/package.json pnpm-lock.yaml
git commit -m "chore(web): add shadcn and animation dependencies"
```

---

## Task 2: Configure Tailwind for shadcn

**Files:**
- Modify: `apps/web/tailwind.config.js`
- Modify: `apps/web/src/index.css`

**Step 1: Update Tailwind config**

Replace `apps/web/tailwind.config.js` with:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        "float-reverse": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(20px) rotate(-5deg)" },
        },
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "float-reverse": "float-reverse 5s ease-in-out infinite",
      },
    },
  },
  plugins: [],
}
```

**Step 2: Update index.css with shadcn variables**

Replace `apps/web/src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 3: Verify Tailwind works**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm build
```
Expected: Build succeeds without errors

**Step 4: Commit**

```bash
git add apps/web/tailwind.config.js apps/web/src/index.css
git commit -m "feat(web): configure tailwind for shadcn with dark mode"
```

---

## Task 3: Create Utility Functions

**Files:**
- Create: `apps/web/src/lib/utils.ts`

**Step 1: Create cn utility**

Create `apps/web/src/lib/utils.ts`:

```typescript
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

**Step 2: Verify TypeScript**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/lib/utils.ts
git commit -m "feat(web): add cn utility for class merging"
```

---

## Task 4: Create shadcn UI Components

**Files:**
- Create: `apps/web/src/components/ui/button.tsx`
- Create: `apps/web/src/components/ui/input.tsx`
- Create: `apps/web/src/components/ui/label.tsx`
- Create: `apps/web/src/components/ui/card.tsx`

**Step 1: Create Button component**

Create `apps/web/src/components/ui/button.tsx`:

```tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

**Step 2: Create Input component**

Create `apps/web/src/components/ui/input.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
```

**Step 3: Create Label component**

Create `apps/web/src/components/ui/label.tsx`:

```tsx
import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
```

**Step 4: Create Card component**

Create `apps/web/src/components/ui/card.tsx`:

```tsx
import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

**Step 5: Configure path alias**

Modify `apps/web/tsconfig.json` to add paths:

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

**Step 6: Configure Vite path alias**

Modify `apps/web/vite.config.ts`:

```typescript
import path from "node:path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**Step 7: Verify TypeScript**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm typecheck
```
Expected: No errors

**Step 8: Commit**

```bash
git add apps/web/src/components/ui apps/web/tsconfig.json apps/web/vite.config.ts
git commit -m "feat(web): add shadcn button, input, label, card components"
```

---

## Task 5: Create Theme Provider

**Files:**
- Create: `apps/web/src/components/theme-provider.tsx`
- Modify: `apps/web/index.html`

**Step 1: Create ThemeProvider**

Create `apps/web/src/components/theme-provider.tsx`:

```tsx
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme
    }
    return defaultTheme
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      localStorage.setItem(storageKey, newTheme)
      setTheme(newTheme)
    },
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
```

**Step 2: Add no-flash script to index.html**

Replace `apps/web/index.html`:

```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MyFinances</title>
    <script>
      const theme = localStorage.getItem("theme");
      if (theme === "dark" || (!theme && matchMedia("(prefers-color-scheme: dark)").matches)) {
        document.documentElement.classList.add("dark");
      }
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 3: Create theme toggle component**

Create `apps/web/src/components/ui/theme-toggle.tsx`:

```tsx
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
      setTheme(systemTheme === "dark" ? "light" : "dark")
    } else {
      setTheme(theme === "dark" ? "light" : "dark")
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

**Step 4: Verify TypeScript**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm typecheck
```
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/src/components/theme-provider.tsx apps/web/src/components/ui/theme-toggle.tsx apps/web/index.html
git commit -m "feat(web): add theme provider with dark mode support"
```

---

## Task 6: Create Supabase Client

**Files:**
- Create: `apps/web/src/lib/supabase.ts`

**Step 1: Create Supabase client**

Create `apps/web/src/lib/supabase.ts`:

```typescript
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

**Step 2: Create env example file**

Create `apps/web/.env.example`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 3: Create .env.local with actual values**

Create `apps/web/.env.local`:

```
VITE_SUPABASE_URL=https://ymssxvjjskecmwntlcuy.supabase.co
VITE_SUPABASE_ANON_KEY=<get from supabase dashboard>
```

Note: Get the anon key from Supabase dashboard > Settings > API

**Step 4: Update .gitignore if needed**

Verify `.env.local` is in root `.gitignore`

**Step 5: Commit**

```bash
git add apps/web/src/lib/supabase.ts apps/web/.env.example
git commit -m "feat(web): add supabase client configuration"
```

---

## Task 7: Create React Query Client

**Files:**
- Create: `apps/web/src/lib/query-client.ts`

**Step 1: Create query client**

Create `apps/web/src/lib/query-client.ts`:

```typescript
import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

**Step 2: Commit**

```bash
git add apps/web/src/lib/query-client.ts
git commit -m "feat(web): add react query client configuration"
```

---

## Task 8: Create Zustand UI Store

**Files:**
- Create: `apps/web/src/stores/ui.store.ts`

**Step 1: Create UI store**

Create `apps/web/src/stores/ui.store.ts`:

```typescript
import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}))
```

**Step 2: Commit**

```bash
git add apps/web/src/stores/ui.store.ts
git commit -m "feat(web): add zustand ui store"
```

---

## Task 9: Create Auth Layout with Animated Panel

**Files:**
- Create: `apps/web/src/components/layouts/auth/animated-panel.tsx`
- Create: `apps/web/src/components/layouts/auth/auth.layout.tsx`

**Step 1: Create animated panel**

Create `apps/web/src/components/layouts/auth/animated-panel.tsx`:

```tsx
import {
  Wallet,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Banknote,
  Receipt,
  Coins,
  BadgeDollarSign,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FloatingIconProps {
  icon: React.ReactNode
  className?: string
  delay?: string
  duration?: string
}

function FloatingIcon({
  icon,
  className,
  delay = "0s",
  duration = "4s",
}: FloatingIconProps) {
  return (
    <div
      className={cn(
        "absolute text-slate-700 opacity-20",
        className
      )}
      style={{
        animation: `float ${duration} ease-in-out infinite`,
        animationDelay: delay,
      }}
    >
      {icon}
    </div>
  )
}

export function AnimatedPanel() {
  return (
    <div className="relative hidden h-full w-full overflow-hidden bg-slate-950 lg:block">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />

      {/* Floating icons */}
      <FloatingIcon
        icon={<Wallet className="h-16 w-16" />}
        className="left-[10%] top-[15%]"
        delay="0s"
        duration="4s"
      />
      <FloatingIcon
        icon={<CreditCard className="h-12 w-12" />}
        className="left-[70%] top-[10%]"
        delay="0.5s"
        duration="5s"
      />
      <FloatingIcon
        icon={<PiggyBank className="h-20 w-20" />}
        className="left-[25%] top-[45%]"
        delay="1s"
        duration="6s"
      />
      <FloatingIcon
        icon={<TrendingUp className="h-14 w-14" />}
        className="left-[60%] top-[35%]"
        delay="1.5s"
        duration="4.5s"
      />
      <FloatingIcon
        icon={<Banknote className="h-10 w-10" />}
        className="left-[15%] top-[70%]"
        delay="0.3s"
        duration="5.5s"
      />
      <FloatingIcon
        icon={<Receipt className="h-12 w-12" />}
        className="left-[75%] top-[60%]"
        delay="0.8s"
        duration="4s"
      />
      <FloatingIcon
        icon={<Coins className="h-16 w-16" />}
        className="left-[45%] top-[75%]"
        delay="1.2s"
        duration="5s"
      />
      <FloatingIcon
        icon={<BadgeDollarSign className="h-14 w-14" />}
        className="left-[85%] top-[85%]"
        delay="0.6s"
        duration="6s"
      />

      {/* Branding */}
      <div className="absolute bottom-8 left-8">
        <h2 className="text-2xl font-bold text-white">MyFinances</h2>
        <p className="text-slate-400">Gerencie suas finanças com simplicidade</p>
      </div>
    </div>
  )
}
```

**Step 2: Create auth layout**

Create `apps/web/src/components/layouts/auth/auth.layout.tsx`:

```tsx
import { Outlet } from "react-router"
import { AnimatedPanel } from "./animated-panel"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left side - Animated panel (always dark) */}
      <AnimatedPanel />

      {/* Right side - Auth form area */}
      <div className="relative flex flex-col items-center justify-center p-8">
        {/* Theme toggle in top right */}
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        {/* Auth form content */}
        <div className="w-full max-w-md space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
```

**Step 3: Create index export**

Create `apps/web/src/components/layouts/auth/index.ts`:

```typescript
export { AuthLayout } from "./auth.layout"
export { AnimatedPanel } from "./animated-panel"
```

**Step 4: Verify TypeScript**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm typecheck
```
Expected: No errors

**Step 5: Commit**

```bash
git add apps/web/src/components/layouts/auth
git commit -m "feat(web): add auth layout with animated finance icons panel"
```

---

## Task 10: Create App Layout (Placeholder)

**Files:**
- Create: `apps/web/src/components/layouts/app/app.layout.tsx`

**Step 1: Create app layout placeholder**

Create `apps/web/src/components/layouts/app/app.layout.tsx`:

```tsx
import { Outlet } from "react-router"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header placeholder */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold">MyFinances</div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  )
}
```

**Step 2: Create index export**

Create `apps/web/src/components/layouts/app/index.ts`:

```typescript
export { AppLayout } from "./app.layout"
```

**Step 3: Commit**

```bash
git add apps/web/src/components/layouts/app
git commit -m "feat(web): add app layout placeholder"
```

---

## Task 11: Create Pages

**Files:**
- Create: `apps/web/src/pages/sign-in.page.tsx`
- Create: `apps/web/src/pages/sign-up.page.tsx`
- Create: `apps/web/src/pages/auth-callback.page.tsx`
- Create: `apps/web/src/pages/dashboard.page.tsx`

**Step 1: Create sign-in page**

Create `apps/web/src/pages/sign-in.page.tsx`:

```tsx
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SignInPage() {
  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Bem-vindo de volta</h1>
        <p className="text-muted-foreground">
          Entre na sua conta para continuar
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
          <CardDescription>
            Use sua conta Google para entrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/sign-up" className="text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  )
}
```

**Step 2: Create sign-up page**

Create `apps/web/src/pages/sign-up.page.tsx`:

```tsx
import { Link } from "react-router"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SignUpPage() {
  return (
    <>
      <div className="text-center">
        <h1 className="text-3xl font-bold">Criar conta</h1>
        <p className="text-muted-foreground">
          Comece a gerenciar suas finanças hoje
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar</CardTitle>
          <CardDescription>
            Use sua conta Google para se registrar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </Button>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/sign-in" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  )
}
```

**Step 3: Create auth callback page**

Create `apps/web/src/pages/auth-callback.page.tsx`:

```tsx
import { useEffect } from "react"
import { useNavigate } from "react-router"
import { supabase } from "@/lib/supabase"

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const handleCallback = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(
        window.location.href
      )

      if (error) {
        console.error("Auth callback error:", error)
        navigate("/sign-in")
        return
      }

      navigate("/dashboard")
    }

    handleCallback()
  }, [navigate])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
        <p className="mt-4 text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  )
}
```

**Step 4: Create dashboard page placeholder**

Create `apps/web/src/pages/dashboard.page.tsx`:

```tsx
export function DashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground mt-2">
        Em breve: visão geral das suas finanças
      </p>
    </div>
  )
}
```

**Step 5: Create pages index**

Create `apps/web/src/pages/index.ts`:

```typescript
export { SignInPage } from "./sign-in.page"
export { SignUpPage } from "./sign-up.page"
export { AuthCallbackPage } from "./auth-callback.page"
export { DashboardPage } from "./dashboard.page"
```

**Step 6: Verify TypeScript**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm typecheck
```
Expected: No errors

**Step 7: Commit**

```bash
git add apps/web/src/pages
git commit -m "feat(web): add auth and dashboard pages"
```

---

## Task 12: Create Router Configuration

**Files:**
- Create: `apps/web/src/router.tsx`

**Step 1: Create router**

Create `apps/web/src/router.tsx`:

```tsx
import { createBrowserRouter, Navigate } from "react-router"
import { AuthLayout } from "@/components/layouts/auth"
import { AppLayout } from "@/components/layouts/app"
import {
  SignInPage,
  SignUpPage,
  AuthCallbackPage,
  DashboardPage,
} from "@/pages"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/sign-in" replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "/sign-in", element: <SignInPage /> },
      { path: "/sign-up", element: <SignUpPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
    ],
  },
  {
    path: "/auth/callback",
    element: <AuthCallbackPage />,
  },
])
```

**Step 2: Commit**

```bash
git add apps/web/src/router.tsx
git commit -m "feat(web): add react router configuration"
```

---

## Task 13: Wire Up App Entry Point

**Files:**
- Modify: `apps/web/src/app.tsx`
- Modify: `apps/web/src/main.tsx`

**Step 1: Update app.tsx**

Replace `apps/web/src/app.tsx`:

```tsx
import { QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router"
import { ThemeProvider } from "@/components/theme-provider"
import { queryClient } from "@/lib/query-client"
import { router } from "@/router"

export function App() {
  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
```

**Step 2: Update main.tsx**

Replace `apps/web/src/main.tsx`:

```tsx
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { App } from "./app"
import "./index.css"

const rootElement = document.getElementById("root")
if (!rootElement) throw new Error("Root element not found")

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Step 3: Verify TypeScript**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm typecheck
```
Expected: No errors

**Step 4: Verify build**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm build
```
Expected: Build succeeds

**Step 5: Commit**

```bash
git add apps/web/src/app.tsx apps/web/src/main.tsx
git commit -m "feat(web): wire up providers and router in app entry"
```

---

## Task 14: Test the Application

**Step 1: Create .env.local with Supabase credentials**

Get the anon key from Supabase dashboard and create `apps/web/.env.local`:

```
VITE_SUPABASE_URL=https://ymssxvjjskecmwntlcuy.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

**Step 2: Start development server**

Run:
```bash
cd /Users/giovanedaniel/projects/myfinances-app/apps/web && pnpm dev
```

**Step 3: Verify in browser**

Open http://localhost:5173 and verify:
- [ ] Sign-in page loads with split layout
- [ ] Left panel shows animated floating icons (dark background)
- [ ] Right panel shows sign-in card
- [ ] Theme toggle works (light/dark)
- [ ] Navigate to /sign-up works
- [ ] Links between sign-in and sign-up work

**Step 4: Update PLAN.md**

Mark Phase 8 tasks as complete in PLAN.md

**Step 5: Final commit**

```bash
git add PLAN.md
git commit -m "docs: mark Phase 8 frontend setup as complete"
```

---

## Summary

After completing all tasks, Phase 8 delivers:

1. **shadcn/ui** initialized with default slate theme and CSS variables
2. **Components**: Button, Input, Label, Card
3. **Dark mode**: ThemeProvider with no-flash script and toggle
4. **React Router v7**: Configured with auth and app route groups
5. **React Query**: QueryClient with sensible defaults
6. **Zustand**: UI store skeleton
7. **Supabase client**: Configured for auth
8. **Auth layout**: Split screen with animated Lucide icons panel
9. **Pages**: Sign-in, sign-up, auth-callback, dashboard (placeholders)
