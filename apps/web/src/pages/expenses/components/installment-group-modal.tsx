import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { expenseService } from '@/services/expense.service'
import { useUIStore } from '@/stores'
import { formatBRL } from '@plim/shared'
import type { Expense } from '@plim/shared'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Check, FastForward } from 'lucide-react'
import { toast } from 'sonner'

interface InstallmentGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  expense: Expense | null
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function isFutureMonth(dateString: string): boolean {
  const expenseDate = new Date(`${dateString}T00:00:00`)
  const today = new Date()
  const nextMonthStart = new Date(today.getFullYear(), today.getMonth() + 1, 1)

  return expenseDate >= nextMonthStart
}

export function InstallmentGroupModal({ open, onOpenChange, expense }: InstallmentGroupModalProps) {
  const hideValues = useUIStore((state) => state.hideValues)
  const queryClient = useQueryClient()

  const { data: installments, isLoading } = useQuery({
    queryKey: ['installment-group', expense?.installment_group_id],
    queryFn: async () => {
      if (!expense?.installment_group_id) return []
      const result = await expenseService.getInstallmentGroup(expense.installment_group_id)
      return result.data ?? []
    },
    enabled: open && !!expense?.installment_group_id,
  })

  const anticipateMutation = useMutation({
    mutationFn: async (installmentId: string) => {
      const today = new Date().toISOString().split('T')[0]
      return expenseService.updateExpense(installmentId, { date: today })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installment-group'] })
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
      toast.success('Parcela antecipada com sucesso!')
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao antecipar parcela')
    },
  })

  const totalAmount = installments?.reduce((sum, i) => sum + i.amount_cents, 0) ?? 0
  const futureInstallments = installments?.filter((i) => isFutureMonth(i.date)) ?? []
  const paidOrCurrentCount = (installments?.length ?? 0) - futureInstallments.length
  const totalCount = installments?.length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-purple-400" />
            {expense?.description}
          </DialogTitle>
          <DialogDescription>Antecipe parcelas futuras para pagá-las neste mês.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : futureInstallments.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <Check className="mx-auto h-8 w-8 text-emerald-400 mb-2" />
              <p className="text-muted-foreground">
                Todas as parcelas já foram pagas ou estão no mês atual.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {futureInstallments.map((installment) => (
                <div
                  key={installment.id}
                  className="flex items-center justify-between rounded-lg border bg-background border-border hover:border-primary/50 p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <span className="text-sm font-medium">{installment.installment_current}</span>
                    </div>
                    <div>
                      <span className="font-medium">
                        Parcela {installment.installment_current}/{installment.installment_total}
                      </span>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(installment.date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      {hideValues ? '••••••' : formatBRL(installment.amount_cents)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => anticipateMutation.mutate(installment.id)}
                      disabled={anticipateMutation.isPending}
                      className="gap-1.5"
                    >
                      <FastForward className="h-3.5 w-3.5" />
                      Antecipar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {paidOrCurrentCount} de {totalCount} parcelas
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(paidOrCurrentCount / totalCount) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-sm pt-1">
              <span className="text-muted-foreground">Valor total</span>
              <span className="font-semibold">
                {hideValues ? '••••••' : formatBRL(totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
