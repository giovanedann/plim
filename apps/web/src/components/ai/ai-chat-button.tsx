import { HoverBorderGradient } from '@/components/ui/hover-border-gradient'
import { cn } from '@/lib/utils'
import { useAIStore } from '@/stores'
import { Sparkles } from 'lucide-react'
import { AnimatePresence, m } from 'motion/react'
import { useEffect, useState } from 'react'

const EXAMPLE_PROMPTS = [
  'Gastei 50 reais no almoço',
  'Quanto gastei esse mês?',
  'Paguei 200 de luz',
  'Comprei um café de 12 reais',
]

export function AIChatButton(): React.ReactElement {
  const { toggleDrawer, isPulsing, usage } = useAIStore()
  const [promptIndex, setPromptIndex] = useState(0)

  const usageDisplay = usage ? `${usage.used}/${usage.limit}` : null

  useEffect(() => {
    const interval = setInterval(() => {
      setPromptIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.5 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <HoverBorderGradient
        as="button"
        containerClassName="rounded-2xl"
        className="rounded-[15px] bg-background px-4 py-3 w-[220px]"
        duration={2}
        onClick={toggleDrawer}
        aria-label="Abrir assistente de IA"
      >
        <div className={cn('flex items-center gap-3', isPulsing && 'animate-pulse')}>
          <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />

          <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                Pedir ajuda pra IA
              </span>
              {usageDisplay && (
                <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400/70 bg-amber-500/10 px-1.5 py-0.5 rounded">
                  {usageDisplay}
                </span>
              )}
            </div>
            <div className="h-4 overflow-hidden w-full">
              <AnimatePresence mode="wait">
                <m.span
                  key={promptIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="block text-xs text-muted-foreground truncate"
                >
                  "{EXAMPLE_PROMPTS[promptIndex]}"
                </m.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </HoverBorderGradient>
    </m.div>
  )
}
