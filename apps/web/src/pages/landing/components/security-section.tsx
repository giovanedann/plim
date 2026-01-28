import { Check, Database, KeyRound, Lock, ShieldCheck } from 'lucide-react'
import type { Variants } from 'motion/react'
import * as motion from 'motion/react-client'

interface SecurityFeature {
  icon: React.ReactNode
  title: string
  description: string
}

const securityFeatures: SecurityFeature[] = [
  {
    icon: <Lock className="h-6 w-6" />,
    title: 'Criptografia AES-256',
    description:
      'Seus dados financeiros são criptografados com o mesmo padrão usado por bancos e governos.',
  },
  {
    icon: <KeyRound className="h-6 w-6" />,
    title: 'Chaves Seguras',
    description:
      'As chaves de criptografia ficam em um cofre digital separado. Mesmo em caso de vazamento, seus dados financeiros permanecem protegidos.',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Isolamento de Dados',
    description: 'Cada usuário só acessa seus próprios dados. Seu vizinho nunca verá suas contas.',
  },
  {
    icon: <Database className="h-6 w-6" />,
    title: 'Dados Protegidos',
    description:
      'Salários e despesas são criptografados antes de chegar ao banco de dados. Mesmo em caso de vazamento, seus valores ficam ilegíveis.',
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

const shieldVariants: Variants = {
  offscreen: {
    scale: 0.8,
    opacity: 0,
  },
  onscreen: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      bounce: 0.4,
      duration: 0.8,
    },
  },
}

export function SecuritySection() {
  return (
    <section className="landing-section flex min-h-screen w-full items-center bg-slate-950 py-16">
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
              className="mb-4 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-emerald-400"
            >
              Segurança
            </motion.span>
            <motion.h2
              variants={itemVariants}
              className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
            >
              Seus dados, sua privacidade
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg"
            >
              Dados financeiros são sensíveis. Por isso, usamos as mesmas tecnologias de segurança
              que protegem transações bancárias.
            </motion.p>
          </div>

          {/* Content */}
          <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
            {/* Shield illustration */}
            <motion.div variants={shieldVariants} className="flex justify-center">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl" />

                {/* Shield */}
                <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent md:h-80 md:w-80">
                  <div className="flex h-48 w-48 items-center justify-center rounded-full border border-emerald-500/40 bg-gradient-to-br from-emerald-500/20 to-transparent md:h-60 md:w-60">
                    <div className="flex h-32 w-32 items-center justify-center rounded-full border border-emerald-500/50 bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 md:h-40 md:w-40">
                      <ShieldCheck className="h-16 w-16 text-emerald-400 md:h-20 md:w-20" />
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -left-4 top-8 rounded-lg border border-emerald-500/30 bg-slate-900/90 px-3 py-2 text-xs font-medium text-emerald-400 backdrop-blur-sm md:-left-8 md:text-sm">
                  <Lock className="mr-1.5 inline-block h-3 w-3 md:h-4 md:w-4" />
                  AES-256
                </div>
                <div className="absolute -right-4 top-1/3 rounded-lg border border-emerald-500/30 bg-slate-900/90 px-3 py-2 text-xs font-medium text-emerald-400 backdrop-blur-sm md:-right-8 md:text-sm">
                  <KeyRound className="mr-1.5 inline-block h-3 w-3 md:h-4 md:w-4" />
                  Vault
                </div>
                <div className="absolute -bottom-2 left-1/4 rounded-lg border border-emerald-500/30 bg-slate-900/90 px-3 py-2 text-xs font-medium text-emerald-400 backdrop-blur-sm md:bottom-0 md:text-sm">
                  <ShieldCheck className="mr-1.5 inline-block h-3 w-3 md:h-4 md:w-4" />
                  RLS
                </div>
              </div>
            </motion.div>

            {/* Features list */}
            <motion.div variants={containerVariants} className="space-y-6">
              {securityFeatures.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={itemVariants}
                  className="flex gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:border-emerald-500/30 hover:bg-slate-900/80"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-white">{feature.title}</h3>
                    <p className="text-sm text-slate-400">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Trust indicators */}
          <motion.div
            variants={itemVariants}
            className="mt-12 border-t border-slate-800 pt-12 md:mt-16 md:pt-16"
          >
            <div className="mx-auto flex w-fit flex-wrap items-center justify-center gap-x-8 gap-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Dados nunca compartilhados</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Check className="h-4 w-4 text-emerald-400" />
                <span>Hospedado na Supabase</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
