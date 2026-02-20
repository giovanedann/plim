import { Receipt, Sparkles, Tags, Wallet } from 'lucide-react'

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

export function OnboardingSection() {
  return (
    <section className="landing-section flex min-h-screen w-full items-center bg-background py-24 md:py-32">
      <div className="relative z-10 mx-auto max-w-6xl px-4 md:px-8">
        {/* Header */}
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl">
            Comece em minutos
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-400 md:text-xl">
            Um passo a passo simples para organizar suas finanças
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <div className="grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                {/* Step number badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-slate-950">
                    {index + 1}
                  </span>
                </div>

                {/* Icon container */}
                <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-800 border border-slate-700 text-amber-500 transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                  {step.icon}
                </div>

                {/* Text content */}
                <h3 className="mb-1 text-lg font-semibold text-white">{step.title}</h3>
                <p className="text-sm text-slate-400">{step.description}</p>

                {/* Mobile connector - vertical line between steps */}
                {index < steps.length - 1 && (
                  <div className="md:hidden absolute -bottom-4 left-1/2 h-8 w-0.5 -translate-x-1/2 bg-gradient-to-b from-amber-500/30 to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA text */}
        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-sm text-amber-400">
            <Sparkles className="h-4 w-4" />
            Leva menos de 2 minutos
          </p>
        </div>
      </div>
    </section>
  )
}
