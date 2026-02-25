import { Receipt, Sparkles, Tags, Wallet } from 'lucide-react'
import type { Variants } from 'motion/react'
import * as motion from 'motion/react-client'

interface OnboardingStep {
  icon: React.ReactNode
  title: string
  description: string
}

const steps: OnboardingStep[] = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: 'Bem-vindo',
    description: 'Conheça o Plim',
  },
  {
    icon: <Wallet className="h-6 w-6" />,
    title: 'Salário',
    description: 'Informe sua renda',
  },
  {
    icon: <Tags className="h-6 w-6" />,
    title: 'Categorias',
    description: 'Escolha suas categorias',
  },
  {
    icon: <Receipt className="h-6 w-6" />,
    title: 'Primeira despesa',
    description: 'Registre um gasto',
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

export function OnboardingSection() {
  return (
    <section className="flex w-full items-center bg-slate-950 py-16 md:py-24">
      <motion.div
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
        className="relative z-10 mx-auto max-w-6xl px-4 md:px-8"
      >
        {/* Header */}
        <div className="mb-16 text-center">
          <motion.h2
            variants={itemVariants}
            className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent"
          >
            Comece em minutos
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mx-auto max-w-2xl text-lg text-slate-400 md:text-xl"
          >
            Um passo a passo simples para organizar suas finanças
          </motion.p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                variants={itemVariants}
                className="relative flex flex-col items-center text-center"
              >
                {/* Step number badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">
                    {index + 1}
                  </span>
                </div>

                {/* Icon container */}
                <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-amber-500 transition-all duration-300 hover:border-amber-500/30 hover:bg-white/10 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  {step.icon}
                </div>

                {/* Text content */}
                <h3 className="mb-1 text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.description}</p>

                {/* Mobile connector - vertical line between steps */}
                {index < steps.length - 1 && (
                  <div className="md:hidden absolute -bottom-4 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-gradient-to-b from-amber-500/30 to-transparent" />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA text */}
        <motion.div variants={itemVariants} className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
            <Sparkles className="h-4 w-4" />
            Leva menos de 2 minutos
          </p>
        </motion.div>
      </motion.div>
    </section>
  )
}
