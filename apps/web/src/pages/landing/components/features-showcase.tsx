import { Check } from 'lucide-react'
import type { Variants } from 'motion/react'
import * as motion from 'motion/react-client'

interface FeatureData {
  id: string
  badge: string
  headline: string
  description: string
  bulletPoints: string[]
  imageSrc: string
  imageAlt: string
}

const features: FeatureData[] = [
  {
    id: 'dashboard',
    badge: 'Visão Geral',
    headline: 'Veja o panorama completo',
    description:
      'Dashboard interativo com gráficos que mostram para onde vai seu dinheiro. Acompanhe receitas, despesas e taxa de economia em tempo real.',
    bulletPoints: [
      'Gráficos de gastos por categoria',
      'Comparação receita vs despesas',
      'Taxa de economia mensal',
    ],
    imageSrc: '/landing/dashboard.png',
    imageAlt: 'Screenshot do Dashboard do Plim',
  },
  {
    id: 'expenses',
    badge: 'Despesas',
    headline: 'Controle total dos gastos',
    description:
      'Registre despesas únicas, recorrentes ou parceladas. Nunca mais perca uma parcela do cartão de crédito.',
    bulletPoints: [
      'Gastos únicos, recorrentes e parcelados',
      'Filtros por categoria e forma de pagamento',
      'Histórico completo por mês',
    ],
    imageSrc: '/landing/expenses.png',
    imageAlt: 'Screenshot da página de Despesas do Plim',
  },
  {
    id: 'categories',
    badge: 'Categorias',
    headline: 'Organize do seu jeito',
    description:
      'Categorias padrão já inclusas ou crie as suas. Personalize com ícones e cores para identificar rapidamente seus gastos.',
    bulletPoints: [
      '8 categorias padrão inclusas',
      'Crie categorias personalizadas',
      '54 ícones e 12 cores para escolher',
    ],
    imageSrc: '/landing/categories.png',
    imageAlt: 'Screenshot da página de Categorias do Plim',
  },
  {
    id: 'profile',
    badge: 'Perfil',
    headline: 'Sua experiência, suas regras',
    description:
      'Configure seu salário, moeda preferida e personalize seu avatar. O Plim se adapta a você.',
    bulletPoints: [
      'Histórico de salários',
      'Avatar personalizado',
      'Configurações de moeda e localização',
    ],
    imageSrc: '/landing/profile.png',
    imageAlt: 'Screenshot da página de Perfil do Plim',
  },
]

const imageVariantsLeft: Variants = {
  offscreen: {
    x: -100,
    opacity: 0,
  },
  onscreen: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.3,
      duration: 0.8,
    },
  },
}

const imageVariantsRight: Variants = {
  offscreen: {
    x: 100,
    opacity: 0,
  },
  onscreen: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.3,
      duration: 0.8,
    },
  },
}

const textVariantsLeft: Variants = {
  offscreen: {
    x: -50,
    opacity: 0,
  },
  onscreen: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.2,
      duration: 0.6,
      delay: 0.2,
    },
  },
}

const textVariantsRight: Variants = {
  offscreen: {
    x: 50,
    opacity: 0,
  },
  onscreen: {
    x: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.2,
      duration: 0.6,
      delay: 0.2,
    },
  },
}

interface FeatureSectionProps {
  feature: FeatureData
  imagePosition: 'left' | 'right'
}

function FeatureSection({ feature, imagePosition }: FeatureSectionProps) {
  const isImageLeft = imagePosition === 'left'

  const imageContent = (
    <motion.div
      variants={isImageLeft ? imageVariantsLeft : imageVariantsRight}
      className="flex-1 flex items-center justify-center"
    >
      <img
        src={feature.imageSrc}
        alt={feature.imageAlt}
        className="w-full max-w-lg rounded-2xl border border-border shadow-2xl"
      />
    </motion.div>
  )

  const textContent = (
    <motion.div
      variants={isImageLeft ? textVariantsRight : textVariantsLeft}
      className="flex-1 flex items-center"
    >
      <div className="w-full p-4 md:p-8">
        <span className="mb-4 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-amber-600 dark:text-amber-400">
          {feature.badge}
        </span>

        <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl lg:text-5xl">
          {feature.headline}
        </h2>

        <p className="mb-6 text-base text-muted-foreground md:text-lg">{feature.description}</p>

        <ul className="space-y-3">
          {feature.bulletPoints.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-foreground">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )

  return (
    <motion.div
      className="min-h-screen flex items-center py-16 md:py-0 bg-background"
      initial="offscreen"
      whileInView="onscreen"
      viewport={{ once: false, amount: 0.4 }}
    >
      <div className="mx-auto w-full max-w-7xl px-4 md:px-8">
        {/* Desktop: side by side */}
        <div className="hidden md:flex gap-8 items-center">
          {isImageLeft ? (
            <>
              {imageContent}
              {textContent}
            </>
          ) : (
            <>
              {textContent}
              {imageContent}
            </>
          )}
        </div>

        {/* Mobile: stacked */}
        <div className="md:hidden space-y-6">
          {imageContent}
          {textContent}
        </div>
      </div>
    </motion.div>
  )
}

export function FeaturesShowcase() {
  return (
    <div>
      {features.map((feature, index) => (
        <FeatureSection
          key={feature.id}
          feature={feature}
          imagePosition={index % 2 === 0 ? 'left' : 'right'}
        />
      ))}
    </div>
  )
}
