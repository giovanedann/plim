import { useReducedMotion } from '@/hooks/use-reduced-motion'
import { CreditCard, FileText, Info } from 'lucide-react'
import { motion } from 'motion/react'
import { OnboardingStep } from '../onboarding.step'

export function CreditCardsStep() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <OnboardingStep
      icon={<CreditCard className="h-20 w-20" />}
      iconColorClass="text-pink-500"
      title="Gerencie seus cartões"
      description="Cadastre seus cartões de crédito para acompanhar gastos parcelados e controlar faturas."
    >
      <div className="space-y-3 mt-2 w-full">
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.25,
              duration: prefersReducedMotion ? 0 : 0.2,
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 border border-border text-center"
          >
            <CreditCard className="h-8 w-8 text-pink-500" />
            <span className="text-sm font-medium text-foreground">Cartões</span>
            <p className="text-xs text-muted-foreground">
              Adicione cartões, veja limites e gastos por cartão
            </p>
          </motion.div>
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{
              delay: prefersReducedMotion ? 0 : 0.3,
              duration: prefersReducedMotion ? 0 : 0.2,
            }}
            className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 border border-border text-center"
          >
            <FileText className="h-8 w-8 text-cyan-500" />
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">Faturas</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                PRO
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Acompanhe o valor de cada fatura mês a mês
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: prefersReducedMotion ? 0 : 0.4,
            duration: prefersReducedMotion ? 0 : 0.2,
          }}
          className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20"
        >
          <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground text-left">
            <span className="font-medium text-foreground">Dica:</span> ao registrar uma despesa
            parcelada, selecione o cartão e o Plim calcula todas as parcelas automaticamente.
          </p>
        </motion.div>
      </div>
    </OnboardingStep>
  )
}
