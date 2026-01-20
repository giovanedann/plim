import { PartyPopperIcon } from '@/components/ui/party-popper'
import { OnboardingStep } from '../onboarding.step'

export function ReadyStep() {
  return (
    <OnboardingStep
      icon={<PartyPopperIcon size={80} />}
      iconColorClass="text-pink-500"
      title="Tudo pronto!"
      description="Sua jornada financeira começa agora. Lembre-se: pequenos registros hoje, grandes resultados amanhã."
    />
  )
}
