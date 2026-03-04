import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { zodResolver } from '@hookform/resolvers/zod'
import type { CardBank, CardColor, CardFlag, CreateCreditCard, CreditCard } from '@plim/shared'
import { centsToDecimal } from '@plim/shared'
import { AnimatePresence, m } from 'motion/react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { CreditCard3D } from './credit-card-3d'

const COLORS: { value: CardColor; label: string; className: string }[] = [
  { value: 'black', label: 'Preto', className: 'bg-zinc-900' },
  { value: 'dark_blue', label: 'Azul Escuro', className: 'bg-blue-900' },
  { value: 'yellow', label: 'Amarelo', className: 'bg-yellow-400' },
  { value: 'red', label: 'Vermelho', className: 'bg-red-500' },
  { value: 'orange', label: 'Laranja', className: 'bg-orange-500' },
  { value: 'light_purple', label: 'Roxo Claro', className: 'bg-purple-400' },
  { value: 'neon_green', label: 'Verde Neon', className: 'bg-green-400' },
  { value: 'neon_blue', label: 'Azul Neon', className: 'bg-cyan-400' },
  { value: 'white', label: 'Branco', className: 'bg-zinc-100 border border-zinc-300' },
  { value: 'silver', label: 'Prata', className: 'bg-zinc-400' },
  { value: 'gold', label: 'Dourado', className: 'bg-amber-400' },
  { value: 'rose_gold', label: 'Rosé', className: 'bg-rose-400' },
]

const FLAGS: { value: CardFlag; label: string }[] = [
  { value: 'visa', label: 'Visa' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'elo', label: 'Elo' },
  { value: 'american_express', label: 'American Express' },
  { value: 'hipercard', label: 'Hipercard' },
  { value: 'diners', label: 'Diners Club' },
  { value: 'other', label: 'Outra' },
]

const BANKS: { value: CardBank; label: string }[] = [
  { value: 'nubank', label: 'Nubank' },
  { value: 'inter', label: 'Banco Inter' },
  { value: 'c6_bank', label: 'C6 Bank' },
  { value: 'itau', label: 'Itaú' },
  { value: 'bradesco', label: 'Bradesco' },
  { value: 'santander', label: 'Santander' },
  { value: 'banco_do_brasil', label: 'Banco do Brasil' },
  { value: 'caixa', label: 'Caixa Econômica' },
  { value: 'original', label: 'Banco Original' },
  { value: 'neon', label: 'Neon' },
  { value: 'next', label: 'Next' },
  { value: 'picpay', label: 'PicPay' },
  { value: 'mercado_pago', label: 'Mercado Pago' },
  { value: 'other', label: 'Outro' },
]

const cardColorValues = [
  'black',
  'dark_blue',
  'yellow',
  'red',
  'orange',
  'light_purple',
  'neon_green',
  'neon_blue',
  'white',
  'silver',
  'gold',
  'rose_gold',
] as const

const cardFlagValues = [
  'visa',
  'mastercard',
  'elo',
  'american_express',
  'hipercard',
  'diners',
  'other',
] as const

const cardBankValues = [
  'nubank',
  'inter',
  'c6_bank',
  'itau',
  'bradesco',
  'santander',
  'banco_do_brasil',
  'caixa',
  'original',
  'neon',
  'next',
  'picpay',
  'mercado_pago',
  'other',
] as const

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  color: z.enum(cardColorValues),
  flag: z.enum(cardFlagValues),
  bank: z.enum(cardBankValues),
  last4Digits: z.string(),
  expirationDay: z.string(),
  closingDay: z.string(),
  creditLimit: z.string(),
})

type FormData = z.infer<typeof formSchema>

function formatCurrencyInput(decimal: string): string {
  const parts = decimal.split('.')
  const intPart = parts[0] ?? '0'
  const decPart = parts[1] ?? '00'
  const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${formatted},${decPart}`
}

function parseCurrencyInputToCents(value: string): number {
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  const decimal = Number.parseFloat(cleaned)
  if (Number.isNaN(decimal)) return 0
  return Math.round(decimal * 100)
}

interface CreditCardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  creditCard?: CreditCard | null
  onSubmit: (data: CreateCreditCard) => Promise<void>
  isPending: boolean
}

export function CreditCardModal({
  open,
  onOpenChange,
  creditCard,
  onSubmit,
  isPending,
}: CreditCardModalProps) {
  const isEditing = !!creditCard

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: creditCard?.name ?? '',
      color: creditCard?.color ?? 'black',
      flag: creditCard?.flag ?? 'visa',
      bank: creditCard?.bank ?? 'nubank',
      last4Digits: creditCard?.last_4_digits ?? '',
      expirationDay: creditCard?.expiration_day?.toString() ?? '',
      closingDay: creditCard?.closing_day?.toString() ?? '',
      creditLimit:
        creditCard?.credit_limit_cents != null
          ? formatCurrencyInput(centsToDecimal(creditCard.credit_limit_cents).toFixed(2))
          : '',
    },
  })

  const watchedName = form.watch('name')
  const watchedColor = form.watch('color')
  const watchedFlag = form.watch('flag')
  const watchedBank = form.watch('bank')
  const watchedLast4Digits = form.watch('last4Digits')

  const handleFormSubmit = async (data: FormData) => {
    const parsedExpirationDay = data.expirationDay
      ? Number.parseInt(data.expirationDay, 10)
      : undefined
    const parsedClosingDay = data.closingDay ? Number.parseInt(data.closingDay, 10) : undefined
    const parsedCreditLimitCents = data.creditLimit
      ? parseCurrencyInputToCents(data.creditLimit)
      : undefined

    await onSubmit({
      name: data.name.trim(),
      color: data.color,
      flag: data.flag,
      bank: data.bank,
      last_4_digits: data.last4Digits || undefined,
      expiration_day:
        parsedExpirationDay && parsedExpirationDay >= 1 && parsedExpirationDay <= 31
          ? parsedExpirationDay
          : undefined,
      closing_day:
        parsedClosingDay && parsedClosingDay >= 1 && parsedClosingDay <= 31
          ? parsedClosingDay
          : undefined,
      credit_limit_cents:
        parsedCreditLimitCents != null && parsedCreditLimitCents >= 0
          ? parsedCreditLimitCents
          : undefined,
    })
  }

  const handleLast4DigitsChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    form.setValue('last4Digits', digits)
  }

  const handleExpirationDayChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 2)
    const num = Number.parseInt(digits, 10)
    if (digits === '' || (num >= 0 && num <= 31)) {
      form.setValue('expirationDay', digits)
    }
  }

  const handleClosingDayChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 2)
    const num = Number.parseInt(digits, 10)
    if (digits === '' || (num >= 0 && num <= 31)) {
      form.setValue('closingDay', digits)
    }
  }

  const handleCreditLimitChange = (value: string) => {
    const digits = value.replace(/\D/g, '')
    if (digits === '') {
      form.setValue('creditLimit', '')
      return
    }
    const cents = Number.parseInt(digits, 10)
    const decimal = (cents / 100).toFixed(2)
    form.setValue('creditLimit', formatCurrencyInput(decimal))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      key={open ? (creditCard?.id ?? 'new') : 'closed'}
    >
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do seu cartão.'
              : 'Adicione um cartão para organizar suas despesas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            <m.div
              key={`${watchedColor}-${watchedFlag}-${watchedBank}`}
              initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center py-4"
            >
              <CreditCard3D
                name={watchedName || 'Seu Cartão'}
                color={watchedColor}
                flag={watchedFlag}
                bank={watchedBank}
                last4Digits={watchedLast4Digits || undefined}
                size="md"
              />
            </m.div>
          </AnimatePresence>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do cartão</Label>
              <Input
                id="name"
                {...form.register('name')}
                placeholder="Ex: Nubank Platinum"
                maxLength={50}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <Controller
                name="color"
                control={form.control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => field.onChange(c.value)}
                        className={`
                          h-8 w-8 rounded-full transition-all
                          ${c.className}
                          ${field.value === c.value ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'}
                        `}
                        title={c.label}
                      />
                    ))}
                  </div>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank">Banco</Label>
                <Controller
                  name="bank"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as CardBank)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o banco" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANKS.map((b) => (
                          <SelectItem key={b.value} value={b.value}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flag">Bandeira</Label>
                <Controller
                  name="flag"
                  control={form.control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(v) => field.onChange(v as CardFlag)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a bandeira" />
                      </SelectTrigger>
                      <SelectContent>
                        {FLAGS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="last4">Últimos 4 dígitos (opcional)</Label>
                <Controller
                  name="last4Digits"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="last4"
                      value={field.value}
                      onChange={(e) => handleLast4DigitsChange(e.target.value)}
                      placeholder="1234"
                      maxLength={4}
                      inputMode="numeric"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">Criptografados para sua segurança.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expirationDay">Dia de vencimento (opcional)</Label>
                <Controller
                  name="expirationDay"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="expirationDay"
                      value={field.value}
                      onChange={(e) => handleExpirationDayChange(e.target.value)}
                      placeholder="15"
                      maxLength={2}
                      inputMode="numeric"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">Dia do mês que a fatura vence.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="closingDay">Dia de fechamento (opcional)</Label>
                <Controller
                  name="closingDay"
                  control={form.control}
                  render={({ field }) => (
                    <Input
                      id="closingDay"
                      value={field.value}
                      onChange={(e) => handleClosingDayChange(e.target.value)}
                      placeholder="10"
                      maxLength={2}
                      inputMode="numeric"
                    />
                  )}
                />
                <p className="text-xs text-muted-foreground">Dia em que a fatura fecha.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="creditLimit">Limite de crédito (opcional)</Label>
                <Controller
                  name="creditLimit"
                  control={form.control}
                  render={({ field }) => (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="creditLimit"
                        value={field.value}
                        onChange={(e) => handleCreditLimitChange(e.target.value)}
                        placeholder="0,00"
                        inputMode="numeric"
                        className="pl-9"
                      />
                    </div>
                  )}
                />
                <p className="text-xs text-muted-foreground">Limite total do cartão.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!watchedName.trim() || isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
