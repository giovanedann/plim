import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { BarChart3, PieChart, TrendingUp, Wallet } from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding.step'

function MockCard({
  icon,
  title,
  value,
  delay,
  prefersReducedMotion,
}: {
  icon: React.ReactNode
  title: string
  value: string
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
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
    >
      <div className="text-blue-400">{icon}</div>
      <div className="text-left">
        <p className="text-xs text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    </motion.div>
  )
}

export function DashboardStep() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <OnboardingStep
      icon={<BarChart3 className="h-20 w-20" />}
      iconColorClass="text-blue-400"
      title="Insights que fazem diferença"
      description="Acompanhe seus gastos por categoria, veja a evolução mensal e entenda para onde seu dinheiro está indo. Informação clara para decisões melhores."
    >
      <div className="grid grid-cols-2 gap-3 mt-4">
        <MockCard
          icon={<Wallet className="h-5 w-5" />}
          title="Saldo do mês"
          value="R$ 1.250,00"
          delay={0.25}
          prefersReducedMotion={prefersReducedMotion}
        />
        <MockCard
          icon={<TrendingUp className="h-5 w-5" />}
          title="Receita"
          value="R$ 5.000,00"
          delay={0.3}
          prefersReducedMotion={prefersReducedMotion}
        />
        <MockCard
          icon={<PieChart className="h-5 w-5" />}
          title="Maior gasto"
          value="Alimentação"
          delay={0.35}
          prefersReducedMotion={prefersReducedMotion}
        />
        <MockCard
          icon={<BarChart3 className="h-5 w-5" />}
          title="Total gastos"
          value="R$ 3.750,00"
          delay={0.4}
          prefersReducedMotion={prefersReducedMotion}
        />
      </div>
    </OnboardingStep>
  )
}
