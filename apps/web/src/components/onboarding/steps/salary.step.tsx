import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TrendingUpIcon } from '@/components/ui/trending-up'
import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { OnboardingStep } from '../onboarding.step'

interface SalaryStepProps {
  existingSalary?: number | null
  onSave: (salary: number) => Promise<void>
  isReplay?: boolean
}

export function SalaryStep({ existingSalary, onSave, isReplay }: SalaryStepProps) {
  const [value, setValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasExistingSalary = existingSalary != null && existingSalary > 0

  const formatBRL = (input: string) => {
    const numbers = input.replace(/\D/g, '')
    if (!numbers) return ''
    const cents = Number.parseInt(numbers, 10)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    setValue(raw)
    setError(null)
  }

  const handleSave = async () => {
    const cents = Number.parseInt(value, 10)
    if (!cents || cents <= 0) {
      setError('Digite um valor válido')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      await onSave(cents)
      setIsSaved(true)
    } catch {
      setError('Erro ao salvar. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OnboardingStep
      icon={<TrendingUpIcon size={80} />}
      iconColorClass="text-emerald-500"
      title="Cadastre seu salário"
      description="Com sua renda cadastrada, o Plim calcula seu saldo mensal comparando receitas e despesas. Seus dados ficam seguros e privados."
    >
      <AnimatePresence mode="wait">
        {hasExistingSalary && isReplay ? (
          <motion.div
            key="existing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-emerald-400 justify-center"
          >
            <Check className="h-5 w-5" />
            <span>
              Salário já cadastrado (
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(existingSalary / 100)}
              )
            </span>
          </motion.div>
        ) : isSaved ? (
          <motion.div
            key="saved"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 text-emerald-400 justify-center"
          >
            <Check className="h-5 w-5" />
            <span>Salário salvo com sucesso!</span>
          </motion.div>
        ) : (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <Input
                type="text"
                inputMode="numeric"
                placeholder="R$ 0,00"
                value={value ? formatBRL(value) : ''}
                onChange={handleChange}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button onClick={handleSave} disabled={isLoading || !value}>
                {isLoading ? 'Salvando...' : 'Adicionar'}
              </Button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <p className="text-sm text-muted-foreground text-center">
              Digite seu salário líquido (o que cai na conta, já com descontos).
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </OnboardingStep>
  )
}
