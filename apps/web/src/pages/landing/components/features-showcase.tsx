import { cn } from '@/lib/utils'
import {
  ArrowLeftRight,
  Check,
  Crown,
  FileText,
  LayoutDashboard,
  Tags,
  TrendingUp,
  User,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import * as motion from 'motion/react-client'
import { useState } from 'react'

interface FeatureTab {
  id: string
  label: string
  badge: string
  headline: string
  description: string
  bulletPoints: string[]
  icon: LucideIcon
  iconColor: string
  glowColor: string
  isPro?: boolean
}

const tabs: FeatureTab[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    badge: 'Visão Geral',
    headline: 'Veja o panorama completo',
    description:
      'Dashboard interativo com gráficos que mostram para onde vai seu dinheiro. Acompanhe receitas, despesas e taxa de economia em tempo real.',
    bulletPoints: [
      'Gráficos de gastos por categoria',
      'Comparação receita vs despesas',
      'Taxa de economia mensal',
    ],
    icon: LayoutDashboard,
    iconColor: 'text-amber-400',
    glowColor: 'bg-amber-500/20',
  },
  {
    id: 'expenses',
    label: 'Transações',
    badge: 'Transações',
    headline: 'Controle total dos gastos',
    description:
      'Registre despesas únicas, recorrentes ou parceladas. Nunca mais perca uma parcela do cartão de crédito.',
    bulletPoints: [
      'Gastos únicos, recorrentes e parcelados',
      'Filtros por categoria e forma de pagamento',
      'Histórico completo por mês',
    ],
    icon: ArrowLeftRight,
    iconColor: 'text-blue-400',
    glowColor: 'bg-blue-500/20',
  },
  {
    id: 'categories',
    label: 'Categorias',
    badge: 'Categorias',
    headline: 'Organize do seu jeito',
    description:
      'Categorias padrão já inclusas ou crie as suas. Personalize com ícones e cores para identificar rapidamente seus gastos.',
    bulletPoints: [
      '8 categorias padrão inclusas',
      'Crie categorias personalizadas',
      '54 ícones e 12 cores para escolher',
    ],
    icon: Tags,
    iconColor: 'text-emerald-400',
    glowColor: 'bg-emerald-500/20',
  },
  {
    id: 'profile',
    label: 'Perfil',
    badge: 'Perfil',
    headline: 'Sua experiência, suas regras',
    description:
      'Configure seu salário, moeda preferida e personalize seu avatar. O Plim se adapta a você.',
    bulletPoints: [
      'Histórico de salários',
      'Avatar personalizado',
      'Configurações de moeda e localização',
    ],
    icon: User,
    iconColor: 'text-violet-400',
    glowColor: 'bg-violet-500/20',
  },
  {
    id: 'incomes',
    label: 'Receitas',
    badge: 'Receitas',
    headline: 'Registre o que entra',
    description:
      'Salário, freelances, rendimentos — registre todas as suas receitas no mesmo lugar das despesas e tenha uma visão completa das suas finanças.',
    bulletPoints: [
      'Receitas únicas e recorrentes',
      'Alimenta gráficos de Receita vs Despesas',
      'Acompanhe sua taxa de economia',
    ],
    icon: TrendingUp,
    iconColor: 'text-green-400',
    glowColor: 'bg-green-500/20',
  },
  {
    id: 'invoices',
    label: 'Faturas',
    badge: 'Pro',
    headline: 'Faturas sob controle',
    description:
      'Acompanhe as faturas de cada cartão de crédito mês a mês. Veja o total, o que já pagou e o saldo restante — tudo automático.',
    bulletPoints: [
      'Fatura gerada automaticamente por cartão',
      'Pagamento parcial ou total',
      'Saldo restante transferido para próxima fatura',
    ],
    icon: FileText,
    iconColor: 'text-amber-400',
    glowColor: 'bg-amber-500/20',
    isPro: true,
  },
]

export function FeaturesShowcase() {
  const [activeTab, setActiveTab] = useState(0)
  const feature = tabs[activeTab]

  if (!feature) return null

  const IconComponent = feature.icon

  return (
    <section className="w-full bg-slate-950 py-16 md:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-amber-400">
            Funcionalidades
          </span>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
            Tudo que você precisa
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
            Explore cada área do Plim e veja como ele organiza suas finanças.
          </p>
        </div>

        {/* Tab bar */}
        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(index)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                activeTab === index
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300'
              )}
            >
              {tab.label}
              {tab.isPro && <Crown className="h-3.5 w-3.5 text-amber-600" />}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="min-h-[320px] md:min-h-[360px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 md:p-10"
            >
              <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
                {/* Icon with glow */}
                <div className="relative shrink-0">
                  <div
                    className={cn('absolute -inset-3 rounded-full blur-xl', feature.glowColor)}
                  />
                  <div className={cn('relative', feature.iconColor)}>
                    <IconComponent className="h-12 w-12 md:h-16 md:w-16" />
                  </div>
                </div>

                {/* Text content */}
                <div className="flex-1">
                  <span
                    className={cn(
                      'mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium uppercase tracking-wide',
                      feature.isPro
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-amber-500/10 text-amber-400'
                    )}
                  >
                    {feature.badge}
                    {feature.isPro && <Crown className="h-3.5 w-3.5" />}
                  </span>

                  <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                    {feature.headline}
                  </h2>

                  <p className="mb-6 text-base text-slate-400 md:text-lg">{feature.description}</p>

                  <ul className="space-y-3">
                    {feature.bulletPoints.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                          <Check className="h-3 w-3 text-emerald-400" />
                        </div>
                        <span className="text-slate-300">{point}</span>
                      </li>
                    ))}
                  </ul>

                  {feature.isPro && (
                    <p className="mt-4 flex items-center gap-1.5 text-sm text-amber-400">
                      <Crown className="h-4 w-4" />
                      Exclusivo do plano Pro
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
