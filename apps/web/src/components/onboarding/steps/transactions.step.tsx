import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { CreditCard, Info, Receipt, Repeat, TrendingUp } from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding.step'

function TransactionTypeCard({
  icon,
  label,
  example,
  delay,
  prefersReducedMotion,
}: {
  icon: React.ReactNode
  label: string
  example: string
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
      className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border text-left"
    >
      <div className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{example}</p>
      </div>
    </motion.div>
  )
}

export function TransactionsStep() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <OnboardingStep
      icon={<Receipt className="h-20 w-20" />}
      iconColorClass="text-amber-500"
      title="Registre suas movimentações"
      description="Na tela de Transações, você adiciona despesas e receitas. Existem tipos diferentes:"
    >
      <div className="space-y-4 mt-2 w-full">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
            Despesas
          </p>
          <div className="space-y-2">
            <TransactionTypeCard
              icon={<Receipt className="h-5 w-5" />}
              label="Única"
              example="Ex: café na padaria, uber, mercado"
              delay={0.25}
              prefersReducedMotion={prefersReducedMotion}
            />
            <TransactionTypeCard
              icon={<Repeat className="h-5 w-5" />}
              label="Recorrente"
              example="Ex: Netflix, aluguel, academia"
              delay={0.3}
              prefersReducedMotion={prefersReducedMotion}
            />
            <TransactionTypeCard
              icon={<CreditCard className="h-5 w-5" />}
              label="Parcelada"
              example="Ex: celular em 12x no cartão"
              delay={0.35}
              prefersReducedMotion={prefersReducedMotion}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-left">
            Receitas
          </p>
          <TransactionTypeCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Receita"
            example="Ex: salário, freelance, rendimento"
            delay={0.4}
            prefersReducedMotion={prefersReducedMotion}
          />
        </div>

        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: prefersReducedMotion ? 0 : 0.5,
            duration: prefersReducedMotion ? 0 : 0.2,
          }}
          className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
        >
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">Dica:</span> você também pode filtrar por
            categoria, forma de pagamento e tipo de transação.
          </p>
        </motion.div>
      </div>
    </OnboardingStep>
  )
}
