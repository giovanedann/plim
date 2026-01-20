import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { CreditCard, Receipt, Repeat, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding.step'

function ExpenseTypeBadge({
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
      initial={prefersReducedMotion ? { opacity: 1 } : { y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        delay: prefersReducedMotion ? 0 : delay,
        duration: prefersReducedMotion ? 0 : 0.2,
      }}
      className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 border border-border"
    >
      <div className="text-amber-500 dark:text-amber-400">{icon}</div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </motion.div>
  )
}

export function ExpenseTypesStep() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <OnboardingStep
      icon={<Wallet className="h-20 w-20" />}
      iconColorClass="text-amber-500"
      title="Controle todos os tipos de gastos"
      description="Registre despesas únicas, contas recorrentes como aluguel e streaming, ou compras parceladas no cartão. Tudo organizado em um só lugar."
    >
      <div className="grid grid-cols-3 gap-3 mt-4">
        <ExpenseTypeBadge
          icon={<Receipt className="h-8 w-8" />}
          label="Única"
          delay={0.25}
          prefersReducedMotion={prefersReducedMotion}
        />
        <ExpenseTypeBadge
          icon={<Repeat className="h-8 w-8" />}
          label="Recorrente"
          delay={0.3}
          prefersReducedMotion={prefersReducedMotion}
        />
        <ExpenseTypeBadge
          icon={<CreditCard className="h-8 w-8" />}
          label="Parcelada"
          delay={0.35}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    </OnboardingStep>
  )
}
