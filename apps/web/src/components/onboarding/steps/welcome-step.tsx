import { SparklesIcon } from '@/components/ui/sparkles'
import { OnboardingStep } from '../onboarding-step'

export function WelcomeStep() {
  return (
    <OnboardingStep
      icon={<SparklesIcon size={80} />}
      title="Bem-vindo ao MyFinances!"
      description="Seu novo parceiro para organizar suas finanças pessoais. Vamos te mostrar como aproveitar ao máximo a plataforma em poucos passos."
    />
  )
}
