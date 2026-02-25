import {
  Bot,
  BrainCircuit,
  Database,
  KeyRound,
  Lock,
  MessageSquareText,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import type { Variants } from 'motion/react'
import * as motion from 'motion/react-client'

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
}

const securityFeatures: Feature[] = [
  {
    icon: <Lock className="h-5 w-5" />,
    title: 'Criptografia AES-256',
    description: 'Mesmo padrão usado por bancos e governos para proteger dados financeiros.',
  },
  {
    icon: <KeyRound className="h-5 w-5" />,
    title: 'Chaves Seguras',
    description:
      'Chaves de criptografia em cofre digital separado. Dados protegidos mesmo em caso de vazamento.',
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: 'Isolamento de Dados',
    description: 'Cada usuário só acessa seus próprios dados. Privacidade total.',
  },
  {
    icon: <Database className="h-5 w-5" />,
    title: 'Dados Protegidos',
    description: 'Salários e despesas criptografados antes de chegar ao banco de dados.',
  },
]

const aiFeatures: Feature[] = [
  {
    icon: <MessageSquareText className="h-5 w-5" />,
    title: 'Converse com seus dados',
    description:
      'Pergunte em linguagem natural e receba respostas instantâneas sobre suas finanças.',
  },
  {
    icon: <BrainCircuit className="h-5 w-5" />,
    title: 'Aprendizado contínuo',
    description:
      'A IA aprende padrões das suas perguntas e melhora as respostas ao longo do tempo.',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Respostas inteligentes',
    description:
      'Consulta, cria e analisa suas despesas automaticamente com base no que você pedir.',
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

export function TrustSection() {
  return (
    <section className="w-full bg-slate-950 py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8">
        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: false, amount: 0.2 }}
          variants={containerVariants}
        >
          {/* Header */}
          <div className="mb-12 text-center">
            <motion.span
              variants={itemVariants}
              className="mb-4 inline-block rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium uppercase tracking-wide text-emerald-400"
            >
              Segurança e IA
            </motion.span>
            <motion.h2
              variants={itemVariants}
              className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl bg-gradient-to-r from-white via-white to-slate-400 bg-clip-text text-transparent"
            >
              Confiança em cada detalhe
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg"
            >
              Segurança de nível bancário e inteligência artificial trabalhando juntas para proteger
              e potencializar suas finanças.
            </motion.p>
          </div>

          {/* Two-column layout */}
          <div className="grid gap-10 md:grid-cols-2 md:gap-12">
            {/* Security column */}
            <motion.div variants={containerVariants}>
              <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Segurança</h3>
              </motion.div>
              <div className="space-y-4">
                {securityFeatures.map((feature) => (
                  <motion.div
                    key={feature.title}
                    variants={itemVariants}
                    className="flex gap-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="mb-0.5 font-semibold text-white text-sm">{feature.title}</h4>
                      <p className="text-sm text-slate-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* AI column */}
            <motion.div variants={containerVariants}>
              <motion.div variants={itemVariants} className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <Bot className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-semibold text-white">Inteligência Artificial</h3>
              </motion.div>
              <div className="space-y-4">
                {aiFeatures.map((feature) => (
                  <motion.div
                    key={feature.title}
                    variants={itemVariants}
                    className="flex gap-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 p-4 transition-all duration-300 hover:border-violet-500/20 hover:bg-white/10"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                      {feature.icon}
                    </div>
                    <div>
                      <h4 className="mb-0.5 font-semibold text-white text-sm">{feature.title}</h4>
                      <p className="text-sm text-slate-400">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* AI Disclaimer */}
              <motion.div
                variants={itemVariants}
                className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm px-5 py-4"
              >
                <p className="text-xs leading-relaxed text-slate-400">
                  <span className="font-medium text-violet-400">Transparência: </span>O Plim é uma
                  plataforma agentic — a IA pode consultar dados, criar despesas e executar ações
                  com base nas suas solicitações. Nenhum dado financeiro é usado para treinar
                  modelos de IA.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
