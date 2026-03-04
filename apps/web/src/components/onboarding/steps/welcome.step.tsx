import { SparklesIcon } from '@/components/ui/sparkles'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { BarChart3, CreditCard, Receipt } from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding.step'

interface WelcomeStepProps {
  firstName?: string
}

function FeaturePill({
  icon,
  label,
  delay,
  prefersReducedMotion,
}: {
  icon: React.ReactNode
  label: string
  delay: number
  prefersReducedMotion: boolean
}) {
  return (
    <motion.div
      initial={prefersReducedMotion ? { opacity: 1 } : { y: 15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay: prefersReducedMotion ? 0 : delay,
        duration: prefersReducedMotion ? 0 : 0.2,
      }}
      className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border"
    >
      <div className="text-primary">{icon}</div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </motion.div>
  )
}

export function WelcomeStep({ firstName }: WelcomeStepProps) {
  const prefersReducedMotion = useReducedMotion()
  const greeting = firstName ? `Olá, ${firstName}!` : 'Bem-vindo ao Plim!'

  return (
    <OnboardingStep
      icon={<SparklesIcon size={80} />}
      iconColorClass="text-yellow-400"
      title={greeting}
      description="Seu parceiro para organizar suas finanças pessoais. Vamos te mostrar como aproveitar ao máximo a plataforma."
    >
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        <FeaturePill
          icon={<Receipt className="h-4 w-4" />}
          label="Despesas"
          delay={0.25}
          prefersReducedMotion={prefersReducedMotion}
        />
        <FeaturePill
          icon={<CreditCard className="h-4 w-4" />}
          label="Cartões"
          delay={0.3}
          prefersReducedMotion={prefersReducedMotion}
        />
        <FeaturePill
          icon={<BarChart3 className="h-4 w-4" />}
          label="Insights"
          delay={0.35}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    </OnboardingStep>
  )
}
