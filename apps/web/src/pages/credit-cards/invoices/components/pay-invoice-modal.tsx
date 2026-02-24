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
import { centsToDecimal, decimalToCents, formatBRL } from '@plim/shared'
import { useState } from 'react'

interface PayInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  remaining: number
  onConfirm: (amountCents: number) => void
  isPending: boolean
}

export function PayInvoiceModal({
  open,
  onOpenChange,
  remaining,
  onConfirm,
  isPending,
}: PayInvoiceModalProps) {
  const [amount, setAmount] = useState('')

  const handleOpenChange = (isOpen: boolean): void => {
    if (isOpen) {
      setAmount(centsToDecimal(remaining).toFixed(2).replace('.', ','))
    }
    onOpenChange(isOpen)
  }

  const handlePayFull = (): void => {
    setAmount(centsToDecimal(remaining).toFixed(2).replace('.', ','))
  }

  const handleConfirm = (): void => {
    const parsed = Number.parseFloat(amount.replace(/\./g, '').replace(',', '.'))
    if (Number.isNaN(parsed) || parsed <= 0) return
    const amountCents = decimalToCents(parsed)
    onConfirm(amountCents)
  }

  const parsedAmount = Number.parseFloat(amount.replace(/\./g, '').replace(',', '.'))
  const isValid = !Number.isNaN(parsedAmount) && parsedAmount > 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar Fatura</DialogTitle>
          <DialogDescription>
            Restante: {formatBRL(remaining)}. Informe o valor que deseja pagar.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="pay-amount">Valor (R$)</Label>
            <Input
              id="pay-amount"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          <Button variant="outline" type="button" onClick={handlePayFull} className="w-full">
            Pagar total ({formatBRL(remaining)})
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending || !isValid}>
            {isPending ? 'Pagando...' : 'Confirmar pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
