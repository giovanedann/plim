import { CreditCard, Receipt, Repeat, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding-step'

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
        <ExpenseTypeBadge icon={<Receipt className="h-8 w-8" />} label="Única" delay={0.25} />
        <ExpenseTypeBadge icon={<Repeat className="h-8 w-8" />} label="Recorrente" delay={0.3} />
        <ExpenseTypeBadge
          icon={<CreditCard className="h-8 w-8" />}
          label="Parcelada"
          delay={0.35}
        />
      </div>
    </OnboardingStep>
  )
}
