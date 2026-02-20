import { Star } from 'lucide-react'
import type { Variants } from 'motion/react'
import * as motion from 'motion/react-client'

interface Testimonial {
  name: string
  quote: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    name: 'Nathan R.',
    quote:
      'Gostei muito da plataforma. Ela é simples, objetiva e entrega tudo o que é necessário para que eu consiga controlar minhas despesas com facilidade e organização. A experiência é intuitiva e cumpre muito bem a proposta.',
    rating: 5,
  },
  {
    name: 'Lauane O.',
    quote:
      'O Plim chegou no momento certo. Acompanhar despesas, parcelas e ter controle total do que você gasta pode ser bem difícil. Com o Plim, você consegue visualizar tudo com clareza, criar novas despesas e até simular gastos futuros, tudo em um só lugar.',
    rating: 5,
  },
  {
    name: 'Kaique M.',
    quote:
      'O aplicativo é muito intuitivo e muito direto ao ponto, é fácil se localizar e inserir os dados, os indicadores ajudam muito a ter um controle visual do que está acontecendo com seu dinheiro e a IA integrada facilita ainda mais o uso e a inserção de dados.',
    rating: 5,
  },
  {
    name: 'Rodrigo R.',
    quote:
      'O Plim é perfeito para a correria do dia a dia. Ele centraliza todas as despesas em um só lugar e o chat integrado com IA melhorou muito o gerenciamento das minhas finanças. Em poucos passos eu já tenho um panorama geral dos meus gastos. Simples, prático e sem complicação, do jeito que eu precisava!',
    rating: 5,
  },
]

const containerVariants: Variants = {
  offscreen: {},
  onscreen: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  offscreen: {
    y: 20,
    opacity: 0,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.3,
      duration: 0.6,
    },
  },
}

const starPositions = [1, 2, 3, 4, 5] as const

function StarRating({ rating }: { rating: number }): React.ReactNode {
  return (
    <div className="flex gap-0.5" role="img" aria-label={`${rating} de 5 estrelas`}>
      {starPositions.map((position) => (
        <Star
          key={position}
          className={`h-4 w-4 ${
            position <= rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-700 text-slate-700'
          }`}
        />
      ))}
    </div>
  )
}

export function TestimonialsSection(): React.ReactNode {
  return (
    <section className="landing-section flex min-h-screen w-full items-center bg-background py-24 md:py-32">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: false, amount: 0.3 }}
          variants={containerVariants}
        >
          {/* Header */}
          <div className="mb-12 text-center md:mb-16">
            <motion.span
              variants={itemVariants}
              className="mb-4 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-amber-400"
            >
              Depoimentos
            </motion.span>
            <motion.h2
              variants={itemVariants}
              className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
            >
              Quem usa, recomenda
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg"
            >
              Veja o que pessoas reais estão falando sobre o Plim.
            </motion.p>
          </div>

          {/* Testimonial cards grid */}
          <motion.div variants={containerVariants} className="grid gap-6 md:grid-cols-2">
            {testimonials.map((testimonial) => (
              <motion.div
                key={testimonial.name}
                variants={itemVariants}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition-colors hover:border-amber-500/30 hover:bg-slate-900/80"
              >
                <StarRating rating={testimonial.rating} />
                <p className="mt-4 text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="mt-4 font-semibold text-white">{testimonial.name}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
