import { Bot, BrainCircuit, MessageSquareText, Zap } from 'lucide-react'
import type { Variants } from 'motion/react'
import * as motion from 'motion/react-client'

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

interface AiFeature {
  icon: React.ReactNode
  title: string
  description: string
}

const aiFeatures: AiFeature[] = [
  {
    icon: <MessageSquareText className="h-5 w-5" />,
    title: 'Converse com seus dados',
    description:
      'Pergunte em linguagem natural: "Quanto gastei com alimentação esse mês?" e receba respostas instantâneas.',
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

export function AiDisclaimerSection(): React.JSX.Element {
  return (
    <section className="landing-section flex min-h-screen w-full items-center bg-slate-950 py-24 md:py-32">
      <div className="mx-auto w-full max-w-5xl px-4 md:px-8">
        <motion.div
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: false, amount: 0.3 }}
          variants={containerVariants}
        >
          {/* Badge */}
          <div className="mb-12 text-center md:mb-16">
            <motion.span
              variants={itemVariants}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-4 py-1.5 text-sm font-medium uppercase tracking-wide text-violet-400"
            >
              <Bot className="h-4 w-4" />
              Plataforma com IA
            </motion.span>

            <motion.h2
              variants={itemVariants}
              className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
            >
              Inteligência artificial a seu favor
            </motion.h2>

            <motion.p
              variants={itemVariants}
              className="mx-auto max-w-2xl text-base text-slate-400 md:text-lg"
            >
              O Plim utiliza IA generativa para entender suas perguntas e executar ações nas suas
              finanças. Você conversa, e a IA faz o trabalho pesado.
            </motion.p>
          </div>

          {/* Features grid */}
          <motion.div
            variants={containerVariants}
            className="mb-12 grid gap-6 md:grid-cols-3 md:mb-16"
          >
            {aiFeatures.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition-colors hover:border-violet-500/30 hover:bg-slate-900/80"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  {feature.icon}
                </div>
                <h3 className="mb-1.5 font-semibold text-white">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Disclaimer notice */}
          <motion.div
            variants={itemVariants}
            className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-6 py-5"
          >
            <p className="text-center text-sm leading-relaxed text-slate-400">
              <span className="font-medium text-violet-400">Transparência: </span>O Plim é uma
              plataforma agentic — a IA pode consultar dados, criar despesas e executar ações com
              base nas suas solicitações. Toda ação é feita sob sua conta e com seu consentimento.
              Nenhum dado financeiro é usado para treinar modelos de IA.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
