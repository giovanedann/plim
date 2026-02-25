import { Star } from 'lucide-react'
import * as motion from 'motion/react-client'
import { useRef, useState } from 'react'

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

const duplicated = [...testimonials, ...testimonials]

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
  const [isPaused, setIsPaused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <section className="flex w-full items-center bg-slate-950 py-16 md:py-20 overflow-hidden">
      <div className="w-full">
        {/* Header */}
        <div className="mb-10 text-center px-4 md:px-8">
          <span className="mb-4 inline-block rounded-full bg-amber-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-amber-400">
            Depoimentos
          </span>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent">
            Quem usa, recomenda
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg">
            Veja o que pessoas reais estão falando sobre o Plim.
          </p>
        </div>

        {/* Auto-scrolling marquee */}
        <div
          ref={containerRef}
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <motion.div
            className="flex gap-6 px-4"
            animate={{ x: ['0%', '-50%'] }}
            transition={{
              x: {
                repeat: Number.POSITIVE_INFINITY,
                repeatType: 'loop',
                duration: 25,
                ease: 'linear',
              },
            }}
            style={isPaused ? { animationPlayState: 'paused' } : undefined}
          >
            {duplicated.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="min-w-[320px] max-w-[360px] shrink-0 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-6 transition-all duration-300 hover:border-amber-500/20 hover:bg-white/10"
              >
                <StarRating rating={testimonial.rating} />
                <p className="mt-4 text-slate-300">&ldquo;{testimonial.quote}&rdquo;</p>
                <p className="mt-4 font-semibold text-white">{testimonial.name}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
