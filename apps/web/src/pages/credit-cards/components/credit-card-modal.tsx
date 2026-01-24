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
import type { CardBank, CardColor, CardFlag, CreateCreditCard, CreditCard } from '@plim/shared'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
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
  { value: 'will_bank', label: 'Will Bank' },
  { value: 'other', label: 'Outro' },
]

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
  const [name, setName] = useState('')
  const [color, setColor] = useState<CardColor>('black')
  const [flag, setFlag] = useState<CardFlag>('visa')
  const [bank, setBank] = useState<CardBank>('nubank')
  const [last4Digits, setLast4Digits] = useState('')

  const isEditing = !!creditCard

  useEffect(() => {
    if (creditCard) {
      setName(creditCard.name)
      setColor(creditCard.color)
      setFlag(creditCard.flag)
      setBank(creditCard.bank)
      setLast4Digits(creditCard.last_4_digits || '')
    } else {
      setName('')
      setColor('black')
      setFlag('visa')
      setBank('nubank')
      setLast4Digits('')
    }
  }, [creditCard])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    await onSubmit({
      name: name.trim(),
      color,
      flag,
      bank,
      last_4_digits: last4Digits || undefined,
    })
  }

  const handleLast4DigitsChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    setLast4Digits(digits)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Cartão' : 'Novo Cartão'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações do seu cartão.'
              : 'Adicione um cartão para organizar suas despesas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 3D Card Preview */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${color}-${flag}-${bank}`}
              initial={{ opacity: 0, scale: 0.9, rotateY: -15 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateY: 15 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center py-4"
            >
              <CreditCard3D
                name={name || 'Seu Cartão'}
                color={color}
                flag={flag}
                bank={bank}
                last4Digits={last4Digits || undefined}
                size="md"
              />
            </motion.div>
          </AnimatePresence>

          <div className="grid gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nome do cartão</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Nubank Platinum"
                maxLength={50}
              />
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`
                      h-8 w-8 rounded-full transition-all
                      ${c.className}
                      ${color === c.value ? 'ring-2 ring-primary ring-offset-2' : 'hover:scale-110'}
                    `}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Bank */}
              <div className="space-y-2">
                <Label htmlFor="bank">Banco</Label>
                <Select value={bank} onValueChange={(v) => setBank(v as CardBank)}>
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
              </div>

              {/* Flag */}
              <div className="space-y-2">
                <Label htmlFor="flag">Bandeira</Label>
                <Select value={flag} onValueChange={(v) => setFlag(v as CardFlag)}>
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
              </div>
            </div>

            {/* Last 4 Digits */}
            <div className="space-y-2">
              <Label htmlFor="last4">Últimos 4 dígitos (opcional)</Label>
              <Input
                id="last4"
                value={last4Digits}
                onChange={(e) => handleLast4DigitsChange(e.target.value)}
                placeholder="1234"
                maxLength={4}
                inputMode="numeric"
              />
              <p className="text-xs text-muted-foreground">
                Os dígitos são criptografados para sua segurança.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isPending}>
              {isPending ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
