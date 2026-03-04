import { useTheme } from '@/components/theme-provider'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { cn } from '@/lib/utils'
import { Check, Moon, Palette, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding.step'

export function ThemePickerStep() {
  const { theme, setTheme } = useTheme()
  const prefersReducedMotion = useReducedMotion()

  const resolvedTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme

  const isLight = resolvedTheme === 'light'
  const isDark = resolvedTheme === 'dark'

  return (
    <OnboardingStep
      icon={<Palette className="h-20 w-20" />}
      iconColorClass="text-violet-500"
      title="Escolha seu visual"
      description="O Plim se adapta ao seu estilo. Escolha como prefere usar:"
    >
      <div className="grid grid-cols-2 gap-3 mt-2 w-full">
        <motion.button
          type="button"
          initial={prefersReducedMotion ? { opacity: 1 } : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: prefersReducedMotion ? 0 : 0.25,
            duration: prefersReducedMotion ? 0 : 0.2,
          }}
          onClick={() => setTheme('light')}
          className={cn(
            'relative flex flex-col items-center gap-3 p-5 rounded-lg border-2 transition-colors cursor-pointer',
            isLight
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/50 hover:border-muted-foreground/30'
          )}
        >
          {isLight && (
            <div className="absolute top-2 right-2">
              <Check className="h-4 w-4 text-primary" />
            </div>
          )}
          <Sun className="h-8 w-8 text-amber-500" />
          <span className="text-sm font-medium text-foreground">Claro</span>
          <div className="w-full space-y-1.5">
            <div className="h-2 rounded-full bg-gray-200 w-full" />
            <div className="h-2 rounded-full bg-gray-200 w-3/4" />
            <div className="h-2 rounded-full bg-gray-100 w-1/2" />
          </div>
        </motion.button>

        <motion.button
          type="button"
          initial={prefersReducedMotion ? { opacity: 1 } : { y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: prefersReducedMotion ? 0 : 0.3,
            duration: prefersReducedMotion ? 0 : 0.2,
          }}
          onClick={() => setTheme('dark')}
          className={cn(
            'relative flex flex-col items-center gap-3 p-5 rounded-lg border-2 transition-colors cursor-pointer',
            isDark
              ? 'border-primary bg-primary/5'
              : 'border-border bg-muted/50 hover:border-muted-foreground/30'
          )}
        >
          {isDark && (
            <div className="absolute top-2 right-2">
              <Check className="h-4 w-4 text-primary" />
            </div>
          )}
          <Moon className="h-8 w-8 text-blue-400" />
          <span className="text-sm font-medium text-foreground">Escuro</span>
          <div className="w-full space-y-1.5">
            <div className="h-2 rounded-full bg-gray-700 w-full" />
            <div className="h-2 rounded-full bg-gray-700 w-3/4" />
            <div className="h-2 rounded-full bg-gray-800 w-1/2" />
          </div>
        </motion.button>
      </div>
    </OnboardingStep>
  )
}
