import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'

interface PricingTier {
  name: string
  price: string
  period: string
  description: string
  features: string[]
  cta: string
  highlighted?: boolean
}

const tiers: PricingTier[] = [
  {
    name: 'Grátis',
    price: 'R$ 0',
    period: '/mês',
    description: 'Tudo que você precisa para começar',
    features: [
      'Despesas ilimitadas',
      'Dashboard completo',
      'Categorias personalizadas',
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
      '100 requisições de texto por semana',
      '20 requisições de imagem por semana',
      '15 requisições de voz por semana',
    ],
    cta: 'Assinar Pro',
  },
]

export function PricingSection() {
  return (
    <section className="landing-section flex min-h-screen w-full items-center bg-muted/30 py-16 md:py-0">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
        {/* Header */}
        <div className="mb-12 text-center md:mb-16">
          <span className="mb-4 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
            Preços
          </span>
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
            Simples e transparente
          </h2>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg">
            Comece grátis e tenha acesso a todas as funcionalidades essenciais. Atualize quando
            precisar de mais.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 md:p-8',
                tier.highlighted
                  ? 'border-amber-500/50 bg-background shadow-lg shadow-amber-500/10'
                  : 'border-border bg-background'
              )}
            >
              {/* Tier name */}
              <h3 className="mb-2 text-xl font-semibold text-foreground">{tier.name}</h3>

              {/* Price */}
              <div className="mb-4">
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                <span className="text-muted-foreground">{tier.period}</span>
              </div>

              {/* Description */}
              <p className="mb-6 text-muted-foreground">{tier.description}</p>

              {/* Features */}
              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                      <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-foreground">{feature}</span>
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
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
