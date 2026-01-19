# Premium Onboarding Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a 6-step animated onboarding experience that educates new users about MyFinances features and optionally collects salary data.

**Architecture:** Full-screen overlay rendered inside AppLayout, controlled by Zustand store with localStorage persistence. Uses Framer Motion for step transitions and Lucide-Animated for icon animations. Integrates with existing Supabase profile to check/set `onboarded` flag.

**Tech Stack:** React 19, Framer Motion (motion), Lucide-Animated icons, Zustand, Tailwind CSS, Supabase

---

## Task 1: Install Dependencies

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install motion (Framer Motion)**

Run:
```bash
cd apps/web && pnpm add motion
```

**Step 2: Verify installation**

Run:
```bash
pnpm ls motion
```
Expected: `motion@x.x.x` listed

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml pnpm-lock.yaml
git commit -m "chore(web): add motion (framer motion) for onboarding animations"
```

---

## Task 2: Install Lucide-Animated Icons

**Files:**
- Create: `apps/web/src/components/icons/` directory
- Multiple icon files via shadcn CLI

**Step 1: Install required animated icons**

Run each command in sequence from `apps/web` directory:
```bash
cd apps/web
pnpm dlx shadcn@latest add https://lucide-animated.com/r/sparkles
pnpm dlx shadcn@latest add https://lucide-animated.com/r/wallet
pnpm dlx shadcn@latest add https://lucide-animated.com/r/trending-up
pnpm dlx shadcn@latest add https://lucide-animated.com/r/tag
pnpm dlx shadcn@latest add https://lucide-animated.com/r/bar-chart-3
pnpm dlx shadcn@latest add https://lucide-animated.com/r/party-popper
pnpm dlx shadcn@latest add https://lucide-animated.com/r/receipt
pnpm dlx shadcn@latest add https://lucide-animated.com/r/repeat
pnpm dlx shadcn@latest add https://lucide-animated.com/r/credit-card
```

Note: If shadcn prompts for component location, use `src/components/icons/`.
Note: If certain icons aren't available on lucide-animated.com, we'll use regular lucide-react icons with Framer Motion animations as fallback.

**Step 2: Verify icons installed**

Run:
```bash
ls -la apps/web/src/components/icons/
```
Expected: Icon component files present

**Step 3: Commit**

```bash
git add apps/web/src/components/icons/
git commit -m "chore(web): add lucide-animated icons for onboarding"
```

---

## Task 3: Create Onboarding Store

**Files:**
- Create: `apps/web/src/stores/onboarding.store.ts`
- Modify: `apps/web/src/stores/index.ts` (if exists, create if not)

**Step 1: Create the onboarding store**

Create `apps/web/src/stores/onboarding.store.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6

interface OnboardingState {
  isOpen: boolean
  currentStep: OnboardingStep
  isReplay: boolean
  showSkipConfirmation: boolean

  // Actions
  open: (isReplay?: boolean) => void
  close: () => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: OnboardingStep) => void
  complete: () => void
  requestSkip: () => void
  cancelSkip: () => void
  confirmSkip: () => void
  reset: () => void
}

const TOTAL_STEPS = 6

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      currentStep: 1,
      isReplay: false,
      showSkipConfirmation: false,

      open: (isReplay = false) => {
        set({
          isOpen: true,
          isReplay,
          currentStep: 1,
          showSkipConfirmation: false,
        })
      },

      close: () => {
        set({
          isOpen: false,
          showSkipConfirmation: false,
        })
      },

      nextStep: () => {
        const { currentStep } = get()
        if (currentStep < TOTAL_STEPS) {
          set({ currentStep: (currentStep + 1) as OnboardingStep })
        }
      },

      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 1) {
          set({ currentStep: (currentStep - 1) as OnboardingStep })
        }
      },

      goToStep: (step) => {
        if (step >= 1 && step <= TOTAL_STEPS) {
          set({ currentStep: step })
        }
      },

      complete: () => {
        set({
          isOpen: false,
          currentStep: 1,
          showSkipConfirmation: false,
        })
      },

      requestSkip: () => {
        set({ showSkipConfirmation: true })
      },

      cancelSkip: () => {
        set({ showSkipConfirmation: false })
      },

      confirmSkip: () => {
        set({
          isOpen: false,
          currentStep: 1,
          showSkipConfirmation: false,
        })
      },

      reset: () => {
        set({
          isOpen: false,
          currentStep: 1,
          isReplay: false,
          showSkipConfirmation: false,
        })
      },
    }),
    {
      name: 'onboarding-storage',
      partialize: (state) => ({
        currentStep: state.currentStep,
      }),
    }
  )
)
```

**Step 2: Create stores barrel export if not exists**

Create or update `apps/web/src/stores/index.ts`:

```typescript
export { useAuthStore } from './auth.store'
export { useOnboardingStore, type OnboardingStep } from './onboarding.store'
```

**Step 3: Run typecheck to verify**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 4: Commit**

```bash
git add apps/web/src/stores/
git commit -m "feat(web): add onboarding zustand store with localStorage persistence"
```

---

## Task 4: Create Onboarding Step Wrapper Component

**Files:**
- Create: `apps/web/src/components/onboarding/onboarding-step.tsx`

**Step 1: Create the animated step wrapper**

Create `apps/web/src/components/onboarding/onboarding-step.tsx`:

```typescript
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface OnboardingStepProps {
  icon: ReactNode
  title: string
  description: string
  children?: ReactNode
  className?: string
}

export function OnboardingStep({
  icon,
  title,
  description,
  children,
  className,
}: OnboardingStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center text-center px-6 py-8 max-w-md mx-auto',
        className
      )}
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.2 }}
        className="mb-6 text-primary"
      >
        {icon}
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.2 }}
        className="text-2xl font-bold text-white mb-4"
      >
        {title}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.2 }}
        className="text-slate-300 text-lg leading-relaxed mb-8"
      >
        {description}
      </motion.p>

      {/* Optional action area */}
      {children && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.2 }}
          className="w-full"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/
git commit -m "feat(web): add onboarding step wrapper with framer motion animations"
```

---

## Task 5: Create Progress Dots Component

**Files:**
- Create: `apps/web/src/components/onboarding/onboarding-progress.tsx`

**Step 1: Create progress dots component**

Create `apps/web/src/components/onboarding/onboarding-progress.tsx`:

```typescript
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import type { OnboardingStep } from '@/stores/onboarding.store'

interface OnboardingProgressProps {
  currentStep: OnboardingStep
  totalSteps?: number
}

export function OnboardingProgress({
  currentStep,
  totalSteps = 6,
}: OnboardingProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <motion.div
          key={step}
          className={cn(
            'h-2 rounded-full transition-colors duration-200',
            step === currentStep
              ? 'bg-primary w-6'
              : step < currentStep
                ? 'bg-primary/60 w-2'
                : 'bg-slate-600 w-2'
          )}
          initial={false}
          animate={{
            width: step === currentStep ? 24 : 8,
          }}
          transition={{ duration: 0.2 }}
        />
      ))}
    </div>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/onboarding-progress.tsx
git commit -m "feat(web): add onboarding progress dots component"
```

---

## Task 6: Create Navigation Component

**Files:**
- Create: `apps/web/src/components/onboarding/onboarding-navigation.tsx`

**Step 1: Create navigation component**

Create `apps/web/src/components/onboarding/onboarding-navigation.tsx`:

```typescript
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { motion } from 'motion/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface OnboardingNavigationProps {
  onNext: () => void
  onPrev: () => void
  onSkip: () => void
  isFirstStep: boolean
  isLastStep: boolean
  nextLabel?: string
  className?: string
}

export function OnboardingNavigation({
  onNext,
  onPrev,
  onSkip,
  isFirstStep,
  isLastStep,
  nextLabel,
  className,
}: OnboardingNavigationProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="flex items-center gap-3">
        {!isFirstStep && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Button
              variant="ghost"
              size="lg"
              onClick={onPrev}
              className="text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Voltar
            </Button>
          </motion.div>
        )}

        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Button
            size="lg"
            onClick={onNext}
            className="min-w-[140px]"
          >
            {nextLabel || (isLastStep ? 'Começar a usar' : 'Próximo')}
            {!isLastStep && <ChevronRight className="h-5 w-5 ml-1" />}
          </Button>
        </motion.div>
      </div>

      {!isLastStep && (
        <button
          type="button"
          onClick={onSkip}
          className="text-sm text-slate-500 hover:text-slate-300 transition-colors underline-offset-4 hover:underline"
        >
          Pular tutorial
        </button>
      )}
    </div>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/onboarding-navigation.tsx
git commit -m "feat(web): add onboarding navigation component"
```

---

## Task 7: Create Skip Confirmation Modal

**Files:**
- Create: `apps/web/src/components/onboarding/skip-confirmation-modal.tsx`

**Step 1: Create the confirmation modal**

Create `apps/web/src/components/onboarding/skip-confirmation-modal.tsx`:

```typescript
import { Button } from '@/components/ui/button'
import { motion, AnimatePresence } from 'motion/react'

interface SkipConfirmationModalProps {
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function SkipConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
}: SkipConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-900 border border-slate-700 rounded-lg p-6 max-w-sm mx-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Tem certeza que deseja pular o tutorial?
            </h3>
            <p className="text-slate-400 mb-6">
              Você pode revê-lo mais tarde nas Configurações.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                onClick={onCancel}
                className="text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Continuar tutorial
              </Button>
              <Button
                variant="secondary"
                onClick={onConfirm}
              >
                Pular
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/skip-confirmation-modal.tsx
git commit -m "feat(web): add skip confirmation modal for onboarding"
```

---

## Task 8: Create Welcome Step

**Files:**
- Create: `apps/web/src/components/onboarding/steps/welcome-step.tsx`

**Step 1: Create welcome step**

Create `apps/web/src/components/onboarding/steps/welcome-step.tsx`:

```typescript
import { OnboardingStep } from '../onboarding-step'
import { Sparkles } from 'lucide-react'

export function WelcomeStep() {
  return (
    <OnboardingStep
      icon={<Sparkles className="h-20 w-20" />}
      title="Bem-vindo ao MyFinances!"
      description="Seu novo parceiro para organizar suas finanças pessoais. Vamos te mostrar como aproveitar ao máximo a plataforma em poucos passos."
    />
  )
}
```

Note: If Lucide-Animated Sparkles was installed, import from `@/components/icons/sparkles` instead and trigger animation on mount.

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/steps/
git commit -m "feat(web): add welcome step for onboarding"
```

---

## Task 9: Create Expense Types Step

**Files:**
- Create: `apps/web/src/components/onboarding/steps/expense-types-step.tsx`

**Step 1: Create expense types step**

Create `apps/web/src/components/onboarding/steps/expense-types-step.tsx`:

```typescript
import { OnboardingStep } from '../onboarding-step'
import { Wallet, Receipt, Repeat, CreditCard } from 'lucide-react'
import { motion } from 'motion/react'

function ExpenseTypeBadge({
  icon,
  label,
  delay,
}: {
  icon: React.ReactNode
  label: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-800/50 border border-slate-700"
    >
      <div className="text-primary">{icon}</div>
      <span className="text-sm text-slate-300">{label}</span>
    </motion.div>
  )
}

export function ExpenseTypesStep() {
  return (
    <OnboardingStep
      icon={<Wallet className="h-20 w-20" />}
      title="Controle todos os tipos de gastos"
      description="Registre despesas únicas, contas recorrentes como aluguel e streaming, ou compras parceladas no cartão. Tudo organizado em um só lugar."
    >
      <div className="grid grid-cols-3 gap-3 mt-4">
        <ExpenseTypeBadge
          icon={<Receipt className="h-8 w-8" />}
          label="Única"
          delay={0.25}
        />
        <ExpenseTypeBadge
          icon={<Repeat className="h-8 w-8" />}
          label="Recorrente"
          delay={0.3}
        />
        <ExpenseTypeBadge
          icon={<CreditCard className="h-8 w-8" />}
          label="Parcelada"
          delay={0.35}
        />
      </div>
    </OnboardingStep>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/steps/expense-types-step.tsx
git commit -m "feat(web): add expense types step for onboarding"
```

---

## Task 10: Create Salary Step

**Files:**
- Create: `apps/web/src/components/onboarding/steps/salary-step.tsx`

**Step 1: Create salary step with optional input**

Create `apps/web/src/components/onboarding/steps/salary-step.tsx`:

```typescript
import { useState } from 'react'
import { OnboardingStep } from '../onboarding-step'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrendingUp, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

interface SalaryStepProps {
  existingSalary?: number | null
  onSave: (salary: number) => Promise<void>
  isReplay?: boolean
}

export function SalaryStep({ existingSalary, onSave, isReplay }: SalaryStepProps) {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasExistingSalary = existingSalary != null && existingSalary > 0

  const formatBRL = (input: string) => {
    const numbers = input.replace(/\D/g, '')
    if (!numbers) return ''
    const cents = Number.parseInt(numbers, 10)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setValue(raw)
    setError(null)
  }

  const handleSave = async () => {
    const cents = Number.parseInt(value, 10)
    if (!cents || cents <= 0) {
      setError('Digite um valor válido')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await onSave(cents)
      setIsSaved(true)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingStep
      icon={<TrendingUp className="h-20 w-20" />}
      title="Por que registrar seu salário?"
      description="Com sua renda cadastrada, você visualiza quanto sobra no fim do mês e recebe alertas quando os gastos estiverem altos. Seus dados ficam seguros e privados."
    >
      <AnimatePresence mode="wait">
        {hasExistingSalary && isReplay ? (
          <motion.div
            key="existing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-emerald-400 justify-center"
          >
            <Check className="h-5 w-5" />
            <span>
              Salário já cadastrado (
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(existingSalary / 100)}
              )
            </span>
          </motion.div>
        ) : isSaved ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-emerald-400 justify-center"
          >
            <Check className="h-5 w-5" />
            <span>Salário salvo com sucesso!</span>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={value ? formatBRL(value) : ''}
                onChange={handleChange}
                className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button onClick={handleSave} disabled={isLoading || !value}>
                {isLoading ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <p className="text-sm text-slate-500 text-center">
              Você pode configurar isso depois nas configurações
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingStep>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/steps/salary-step.tsx
git commit -m "feat(web): add salary step with optional BRL input for onboarding"
```

---

## Task 11: Create Categories Step

**Files:**
- Create: `apps/web/src/components/onboarding/steps/categories-step.tsx`

**Step 1: Create categories step**

Create `apps/web/src/components/onboarding/steps/categories-step.tsx`:

```typescript
import { OnboardingStep } from '../onboarding-step'
import { motion } from 'motion/react'
import {
  Tags,
  Utensils,
  Car,
  Home,
  Heart,
  Gamepad2,
  GraduationCap,
  ShoppingBag,
  MoreHorizontal,
} from 'lucide-react'

const DEFAULT_CATEGORIES = [
  { name: 'Alimentação', icon: Utensils, color: 'text-orange-400' },
  { name: 'Transporte', icon: Car, color: 'text-blue-400' },
  { name: 'Moradia', icon: Home, color: 'text-amber-400' },
  { name: 'Saúde', icon: Heart, color: 'text-red-400' },
  { name: 'Lazer', icon: Gamepad2, color: 'text-purple-400' },
  { name: 'Educação', icon: GraduationCap, color: 'text-cyan-400' },
  { name: 'Compras', icon: ShoppingBag, color: 'text-pink-400' },
  { name: 'Outros', icon: MoreHorizontal, color: 'text-slate-400' },
]

export function CategoriesStep() {
  return (
    <OnboardingStep
      icon={<Tags className="h-20 w-20" />}
      title="Organize por categorias"
      description="Já criamos categorias essenciais para você: Alimentação, Transporte, Moradia e mais. Depois, você pode criar as suas próprias."
    >
      <div className="grid grid-cols-4 gap-2 mt-4">
        {DEFAULT_CATEGORIES.map((category, index) => {
          const Icon = category.icon
          return (
            <motion.div
              key={category.name}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.25 + index * 0.05, duration: 0.2 }}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
            >
              <Icon className={`h-6 w-6 ${category.color}`} />
              <span className="text-xs text-slate-300 text-center leading-tight">
                {category.name}
              </span>
            </motion.div>
          )
        })}
      </div>
    </OnboardingStep>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/steps/categories-step.tsx
git commit -m "feat(web): add categories step showing default categories for onboarding"
```

---

## Task 12: Create Dashboard Preview Step

**Files:**
- Create: `apps/web/src/components/onboarding/steps/dashboard-step.tsx`

**Step 1: Create dashboard preview step**

Create `apps/web/src/components/onboarding/steps/dashboard-step.tsx`:

```typescript
import { OnboardingStep } from '../onboarding-step'
import { motion } from 'motion/react'
import { BarChart3, TrendingUp, PieChart, Wallet } from 'lucide-react'

function MockCard({
  icon,
  title,
  value,
  delay,
}: {
  icon: React.ReactNode
  title: string
  value: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, duration: 0.2 }}
      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700"
    >
      <div className="text-primary">{icon}</div>
      <div className="text-left">
        <p className="text-xs text-slate-400">{title}</p>
        <p className="text-sm font-semibold text-white">{value}</p>
      </div>
    </motion.div>
  )
}

export function DashboardStep() {
  return (
    <OnboardingStep
      icon={<BarChart3 className="h-20 w-20" />}
      title="Insights que fazem diferença"
      description="Acompanhe seus gastos por categoria, veja a evolução mensal e entenda para onde seu dinheiro está indo. Informação clara para decisões melhores."
    >
      <div className="grid grid-cols-2 gap-3 mt-4">
        <MockCard
          icon={<Wallet className="h-5 w-5" />}
          title="Saldo do mês"
          value="R$ 1.250,00"
          delay={0.25}
        />
        <MockCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Receita"
          value="R$ 5.000,00"
          delay={0.3}
        />
        <MockCard
          icon={<PieChart className="h-5 w-5" />}
          title="Maior gasto"
          value="Alimentação"
          delay={0.35}
        />
        <MockCard
          icon={<BarChart3 className="h-5 w-5" />}
          title="Total gastos"
          value="R$ 3.750,00"
          delay={0.4}
        />
      </div>
    </OnboardingStep>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/steps/dashboard-step.tsx
git commit -m "feat(web): add dashboard preview step for onboarding"
```

---

## Task 13: Create Ready Step

**Files:**
- Create: `apps/web/src/components/onboarding/steps/ready-step.tsx`

**Step 1: Create ready/completion step**

Create `apps/web/src/components/onboarding/steps/ready-step.tsx`:

```typescript
import { OnboardingStep } from '../onboarding-step'
import { PartyPopper } from 'lucide-react'

export function ReadyStep() {
  return (
    <OnboardingStep
      icon={<PartyPopper className="h-20 w-20" />}
      title="Tudo pronto!"
      description="Sua jornada financeira começa agora. Lembre-se: pequenos registros hoje, grandes resultados amanhã."
    />
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/steps/ready-step.tsx
git commit -m "feat(web): add ready step for onboarding completion"
```

---

## Task 14: Create Steps Index Export

**Files:**
- Create: `apps/web/src/components/onboarding/steps/index.ts`

**Step 1: Create barrel export for steps**

Create `apps/web/src/components/onboarding/steps/index.ts`:

```typescript
export { WelcomeStep } from './welcome-step'
export { ExpenseTypesStep } from './expense-types-step'
export { SalaryStep } from './salary-step'
export { CategoriesStep } from './categories-step'
export { DashboardStep } from './dashboard-step'
export { ReadyStep } from './ready-step'
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/steps/index.ts
git commit -m "feat(web): add steps barrel export for onboarding"
```

---

## Task 15: Create Main Onboarding Overlay

**Files:**
- Create: `apps/web/src/components/onboarding/onboarding-overlay.tsx`

**Step 1: Create the main overlay component**

Create `apps/web/src/components/onboarding/onboarding-overlay.tsx`:

```typescript
import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { OnboardingProgress } from './onboarding-progress'
import { OnboardingNavigation } from './onboarding-navigation'
import { SkipConfirmationModal } from './skip-confirmation-modal'
import {
  WelcomeStep,
  ExpenseTypesStep,
  SalaryStep,
  CategoriesStep,
  DashboardStep,
  ReadyStep,
} from './steps'

interface OnboardingOverlayProps {
  existingSalary?: number | null
  onSaveSalary: (salary: number) => Promise<void>
  onComplete: () => Promise<void>
}

export function OnboardingOverlay({
  existingSalary,
  onSaveSalary,
  onComplete,
}: OnboardingOverlayProps) {
  const {
    isOpen,
    currentStep,
    isReplay,
    showSkipConfirmation,
    nextStep,
    prevStep,
    complete,
    requestSkip,
    cancelSkip,
    confirmSkip,
  } = useOnboardingStore()

  const handleNext = useCallback(async () => {
    if (currentStep === 6) {
      await onComplete()
      complete()
    } else {
      nextStep()
    }
  }, [currentStep, nextStep, complete, onComplete])

  const handleConfirmSkip = useCallback(async () => {
    await onComplete()
    confirmSkip()
  }, [confirmSkip, onComplete])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (showSkipConfirmation) {
        if (e.key === 'Escape') {
          cancelSkip()
        }
        return
      }

      switch (e.key) {
        case 'ArrowRight':
        case 'Enter':
          handleNext()
          break
        case 'ArrowLeft':
          if (currentStep > 1) {
            prevStep()
          }
          break
        case 'Escape':
          requestSkip()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentStep, showSkipConfirmation, handleNext, prevStep, requestSkip, cancelSkip])

  // Prevent body scroll when overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />
      case 2:
        return <ExpenseTypesStep />
      case 3:
        return (
          <SalaryStep
            existingSalary={existingSalary}
            onSave={onSaveSalary}
            isReplay={isReplay}
          />
        )
      case 4:
        return <CategoriesStep />
      case 5:
        return <DashboardStep />
      case 6:
        return <ReadyStep />
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex flex-col bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900"
        >
          {/* Content area */}
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
            <AnimatePresence mode="wait">
              <div key={currentStep}>
                {renderStep()}
              </div>
            </AnimatePresence>
          </div>

          {/* Footer with progress and navigation */}
          <div className="shrink-0 pb-8 px-6">
            <div className="max-w-md mx-auto space-y-6">
              <OnboardingProgress currentStep={currentStep} />
              <OnboardingNavigation
                onNext={handleNext}
                onPrev={prevStep}
                onSkip={requestSkip}
                isFirstStep={currentStep === 1}
                isLastStep={currentStep === 6}
              />
            </div>
          </div>

          {/* Skip confirmation modal */}
          <SkipConfirmationModal
            isOpen={showSkipConfirmation}
            onConfirm={handleConfirmSkip}
            onCancel={cancelSkip}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/onboarding-overlay.tsx
git commit -m "feat(web): add main onboarding overlay with step rendering and keyboard nav"
```

---

## Task 16: Create Onboarding Index Export

**Files:**
- Create: `apps/web/src/components/onboarding/index.ts`

**Step 1: Create barrel export**

Create `apps/web/src/components/onboarding/index.ts`:

```typescript
export { OnboardingOverlay } from './onboarding-overlay'
export { useOnboardingStore } from '@/stores/onboarding.store'
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/index.ts
git commit -m "feat(web): add onboarding barrel export"
```

---

## Task 17: Integrate Onboarding into App Layout

**Files:**
- Modify: `apps/web/src/components/layouts/app/app.layout.tsx`

**Step 1: Add onboarding overlay to app layout**

Update `apps/web/src/components/layouts/app/app.layout.tsx`:

```typescript
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Outlet } from 'react-router'
import { OnboardingOverlay } from '@/components/onboarding'
import { useOnboardingStore } from '@/stores/onboarding.store'
import { useAuthStore } from '@/stores/auth.store'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function AppLayout() {
  const { user } = useAuthStore()
  const { open, isOpen } = useOnboardingStore()
  const [profile, setProfile] = useState<{ onboarded: boolean; salary?: number } | null>(null)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  // Fetch profile to check onboarded status
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return

      try {
        const { data } = await supabase
          .from('profile')
          .select('onboarded')
          .eq('user_id', user.id)
          .single()

        setProfile(data)

        // Open onboarding if user hasn't completed it
        if (data && !data.onboarded) {
          open(false)
        }
      } catch {
        // Profile might not exist yet
        open(false)
      } finally {
        setIsLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [user, open])

  const handleSaveSalary = useCallback(async (salaryInCents: number) => {
    if (!user) return

    const now = new Date()
    const effectiveDate = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]

    await supabase.from('salary_history').upsert(
      {
        user_id: user.id,
        amount: salaryInCents,
        effective_date: effectiveDate,
      },
      { onConflict: 'user_id,effective_date' }
    )
  }, [user])

  const handleComplete = useCallback(async () => {
    if (!user) return

    await supabase
      .from('profile')
      .update({ onboarded: true })
      .eq('user_id', user.id)

    setProfile((prev) => (prev ? { ...prev, onboarded: true } : null))
  }, [user])

  if (isLoadingProfile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header placeholder */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between">
          <div className="font-semibold">MyFinances</div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <main className="container py-6">
        <Outlet />
      </main>

      {/* Onboarding overlay */}
      <OnboardingOverlay
        existingSalary={null}
        onSaveSalary={handleSaveSalary}
        onComplete={handleComplete}
      />
    </div>
  )
}
```

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Run build to check for issues**

Run:
```bash
pnpm --filter @myfinances/web build
```
Expected: Build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/components/layouts/app/app.layout.tsx
git commit -m "feat(web): integrate onboarding overlay into app layout"
```

---

## Task 18: Test Onboarding Flow Manually

**Files:** None (manual testing)

**Step 1: Start development server**

Run:
```bash
pnpm dev
```

**Step 2: Test the onboarding flow**

1. Sign in with a new user or clear localStorage
2. Verify onboarding appears automatically
3. Navigate through all 6 steps using Next button
4. Test Back button navigation
5. Test keyboard navigation (Arrow keys, Enter, Escape)
6. Test skip confirmation modal (click Skip, press Escape)
7. Test salary input with BRL formatting
8. Complete onboarding and verify it doesn't reappear on refresh

**Step 3: Fix any issues discovered**

Address any bugs or visual issues found during testing.

**Step 4: Final commit if changes were made**

```bash
git add -A
git commit -m "fix(web): address issues found during onboarding manual testing"
```

---

## Task 19: Add Reduced Motion Support

**Files:**
- Modify: `apps/web/src/components/onboarding/onboarding-step.tsx`
- Modify: `apps/web/src/components/onboarding/onboarding-overlay.tsx`

**Step 1: Update onboarding-step.tsx to respect reduced motion**

Add at the top of the file:

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

const animationProps = prefersReducedMotion
  ? {}
  : {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 },
      transition: { duration: 0.15, ease: 'easeOut' },
    }
```

And use `{...animationProps}` on motion components.

**Step 2: Run typecheck**

Run:
```bash
pnpm --filter @myfinances/web typecheck
```
Expected: No errors

**Step 3: Commit**

```bash
git add apps/web/src/components/onboarding/
git commit -m "feat(web): add prefers-reduced-motion support for onboarding"
```

---

## Task 20: Update PLAN.md to Mark Phase 10 Complete

**Files:**
- Modify: `PLAN.md`

**Step 1: Update Phase 10 status**

Find the Phase 10 section in PLAN.md and update its status to complete, adding any implementation notes.

**Step 2: Commit**

```bash
git add PLAN.md
git commit -m "docs: mark Phase 10 (onboarding) as complete"
```

---

## Summary

This plan creates a premium 6-step onboarding experience with:
- Framer Motion animations for smooth transitions
- Zustand store with localStorage persistence
- Keyboard navigation (arrow keys, Enter, Escape)
- Skip confirmation modal
- Optional salary input with BRL formatting
- Profile integration to track onboarded status
- Reduced motion accessibility support

Total tasks: 20
Estimated commits: 18-20
