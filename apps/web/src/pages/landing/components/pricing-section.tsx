import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Check, Gift, Share2, UserPlus } from 'lucide-react'
import type { Variants } from 'motion/react'
import * as motion from 'motion/react-client'

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
}

interface ReferralStep {
  icon: React.ReactNode
  title: string
  description: string
}

const referralSteps: ReferralStep[] = [
  {
    icon: <UserPlus className="h-5 w-5" />,
    title: 'Crie sua conta',
    description: 'Cadastre-se gratuitamente em menos de um minuto.',
  },
  {
    icon: <Share2 className="h-5 w-5" />,
    title: 'Compartilhe seu link',
    description: 'Envie seu link de convite para amigos e familiares.',
  },
  {
    icon: <Gift className="h-5 w-5" />,
    title: 'Ambos ganham Pro',
    description: 'Vocês dois recebem 7 dias de Pro grátis.',
  },
]

const tiers: PricingTier[] = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: '/mês',
    description: 'Tudo que você precisa para começar',
    features: [
      'Transações ilimitadas',
      'Dashboard — últimos 30 dias',
      'Até 5 categorias personalizadas',
      'Até 2 cartões de crédito',
      'Histórico de salários',
    ],
    cta: 'Começar grátis',
    highlighted: true,
  },
  {
    name: 'Pro',
    price: 'R$ 24,90',
    period: '/mês',
    description: 'Para quem quer o máximo da IA',
    features: [
      'Tudo do plano Grátis',
      'Categorias ilimitadas',
      'Cartões de crédito ilimitados',
      'Faturas de cartão com controle de saldo restante',
      'Dashboard com mais gráficos, ranges e insights',
      '100 requisições de texto por semana',
      '20 requisições de imagem por semana',
      '15 requisições de voz por semana',
    ],
    cta: 'Assinar Pro',
  },
]

const containerVariants: Variants = {
  offscreen: {},
  onscreen: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const itemVariants: Variants = {
  offscreen: {
    y: 30,
    opacity: 0,
    scale: 0.85,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      bounce: 0.45,
      duration: 0.7,
    },
  },
}

export function PricingSection() {
  return (
    <section className="flex w-full items-center bg-slate-950 py-16 md:py-24">
      <motion.div
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="mx-auto w-full max-w-5xl px-4 md:px-8"
      >
        {/* Header */}
        <div className="mb-12 text-center md:mb-16">
          <motion.span
            variants={itemVariants}
            className="mb-4 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-amber-400"
          >
            Preços
          </motion.span>
          <motion.h2
            variants={itemVariants}
            className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent"
          >
            Simples e transparente
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg"
          >
            Comece grátis e tenha acesso a todas as funcionalidades essenciais. Atualize quando
            precisar de mais.
          </motion.p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {tiers.map((tier) => (
            <motion.div
              key={tier.name}
              variants={itemVariants}
              className={cn(
                'relative flex flex-col rounded-2xl p-6 md:p-8 transition-all duration-300',
                tier.highlighted
                  ? 'border border-amber-500/30 bg-amber-500/5 backdrop-blur-sm shadow-lg shadow-amber-500/5 hover:border-amber-500/50'
                  : 'bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 hover:bg-white/10'
              )}
            >
              {/* Tier name */}
              <h3 className="mb-2 text-xl font-semibold text-white">{tier.name}</h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-white">{tier.price}</span>
                <span className="text-slate-400">{tier.period}</span>
              </div>

              {/* Description */}
              <p className="mb-6 text-slate-400">{tier.description}</p>

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span className="text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                asChild
                size="lg"
                className={cn(
                  'w-full',
                  tier.highlighted && 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                )}
              >
                <Link to={tier.highlighted ? '/sign-up' : '/upgrade'}>{tier.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Referral */}
        <motion.div
          variants={itemVariants}
          className="mt-12 rounded-2xl bg-white/5 backdrop-blur-sm border border-emerald-500/20 p-6 md:mt-16 md:p-8"
        >
          <div className="mb-8 text-center">
            <span className="mb-3 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-emerald-400">
              Indique e ganhe
            </span>
            <h3 className="mb-2 text-2xl font-bold text-white md:text-3xl">
              Ou ganhe Pro de graça
            </h3>
            <p className="mx-auto max-w-xl text-slate-400">
              Convide amigos para o Plim. Quando eles criarem uma conta, vocês dois ganham 7 dias de
              Pro grátis.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3 md:gap-6">
            {referralSteps.map((step, index) => (
              <div key={step.title} className="relative text-center">
                <span className="absolute top-0 right-2 text-xs font-medium text-slate-600">
                  {index + 1}
                </span>
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  {step.icon}
                </div>
                <h4 className="mb-1 text-sm font-semibold text-white">{step.title}</h4>
                <p className="text-xs leading-relaxed text-slate-400">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <Button
              asChild
              size="lg"
              className="bg-emerald-500 text-white hover:bg-emerald-400 px-8"
            >
              <Link to="/sign-up">Criar conta grátis</Link>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
