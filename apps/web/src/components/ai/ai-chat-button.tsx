import { cn } from '@/lib/utils'
import { useAIStore } from '@/stores'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.5 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <button
        type="button"
        onClick={toggleDrawer}
        className="group relative cursor-pointer"
        aria-label="Abrir assistente de IA"
      >
        {/* Subtle animated border glow */}
        <div
          className={cn(
            'absolute -inset-[1px] rounded-2xl',
            'bg-gradient-to-r from-amber-500/40 via-amber-400/60 to-amber-500/40',
            'opacity-60 group-hover:opacity-90',
            'transition-opacity duration-500',
            'animate-[pulse_3s_ease-in-out_infinite]'
          )}
        />

        {/* Main pill button - fixed width to prevent size changes */}
        <div
          className={cn(
            'relative flex items-center gap-3 px-4 py-3 rounded-2xl w-[220px]',
            'bg-neutral-950',
            'transition-all duration-300',
            'group-hover:bg-neutral-900',
            isPulsing && 'animate-pulse'
          )}
        >
          {/* Icon */}
          <Sparkles
            className={cn('h-5 w-5 text-amber-400 shrink-0', 'transition-all duration-300')}
          />

          {/* Text content */}
          <div className="flex flex-col items-start gap-0.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 w-full">
              <span className="text-sm font-medium text-amber-50/90 whitespace-nowrap">
                Pedir ajuda pra IA
              </span>
              {usageDisplay && (
                <span className="text-[10px] font-medium text-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 rounded">
                  {usageDisplay}
                </span>
              )}
            </div>
            <div className="h-4 overflow-hidden w-full">
              <AnimatePresence mode="wait">
                <motion.span
                  key={promptIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="block text-xs text-amber-50/50 truncate"
                >
                  "{EXAMPLE_PROMPTS[promptIndex]}"
                </motion.span>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  )
}
