import { PartyPopperIcon } from '@/components/ui/party-popper'
import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { BarChart3, PieChart, Star, TrendingUp, Wallet } from 'lucide-react'
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

export function ReadyStep() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <OnboardingStep
      icon={<PartyPopperIcon size={80} />}
      iconColorClass="text-pink-500"
      title="Tudo pronto para começar!"
      description="Quanto mais você registrar, mais completo fica seu dashboard. Veja o que te espera:"
    >
      <div className="space-y-3 mt-2 w-full">
        <div className="grid grid-cols-2 gap-3">
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

        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: prefersReducedMotion ? 0 : 0.5,
            duration: prefersReducedMotion ? 0 : 0.2,
          }}
          className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
        >
          <Star className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground text-left">
            Com o <span className="font-medium text-foreground">plano Pro</span>, você desbloqueia
            gráficos avançados, faturas e mais. Conheça na página de Plano.
          </p>
        </motion.div>
      </div>
    </OnboardingStep>
  )
}
