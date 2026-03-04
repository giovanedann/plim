import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { Compass, CreditCard, FileText, Home, LayoutDashboard, Receipt, Tags } from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding.step'

const NAV_ITEMS = [
  {
    icon: Home,
    name: 'Início',
    description: 'Atalhos rápidos para o dia a dia',
    color: 'text-emerald-500',
  },
  {
    icon: LayoutDashboard,
    name: 'Dashboard',
    description: 'Gráficos e resumo das suas finanças',
    color: 'text-blue-500',
  },
  {
    icon: Receipt,
    name: 'Transações',
    description: 'Registre e acompanhe despesas e receitas',
    color: 'text-amber-500',
  },
  {
    icon: Tags,
    name: 'Categorias',
    description: 'Organize seus gastos por tipo',
    color: 'text-purple-500',
  },
  {
    icon: CreditCard,
    name: 'Cartões',
    description: 'Gerencie seus cartões de crédito',
    color: 'text-pink-500',
  },
  {
    icon: FileText,
    name: 'Faturas',
    description: 'Acompanhe faturas do cartão',
    color: 'text-cyan-500',
    isPro: true,
  },
]

export function NavigationTourStep() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <OnboardingStep
      icon={<Compass className="h-20 w-20" />}
      iconColorClass="text-blue-400"
      title="Conheça o Plim por dentro"
      description="Tudo que você precisa está na barra lateral. Vamos conhecer cada seção:"
    >
      <div className="flex flex-col gap-2 mt-2 w-full">
        {NAV_ITEMS.map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.name}
              initial={prefersReducedMotion ? { opacity: 1 } : { x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{
                delay: prefersReducedMotion ? 0 : 0.2 + index * 0.07,
                duration: prefersReducedMotion ? 0 : 0.2,
              }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <Icon className={`h-5 w-5 shrink-0 ${item.color}`} />
              <div className="text-left min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                  {item.isPro && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </OnboardingStep>
  )
}
