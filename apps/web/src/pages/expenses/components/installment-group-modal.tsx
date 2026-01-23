import { Badge } from '@/components/ui/badge'
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
  selectedMonth: string
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

function isPastOrCurrentMonth(dateString: string, selectedMonth: string): boolean {
  const expenseDate = new Date(`${dateString}T00:00:00`)
  const parts = selectedMonth.split('-').map(Number)
  const year = parts[0] ?? 0
  const month = parts[1] ?? 1
  const selectedDate = new Date(year, month - 1, 1)

  return expenseDate <= selectedDate
}

export function InstallmentGroupModal({
  open,
  onOpenChange,
  expense,
  selectedMonth,
}: InstallmentGroupModalProps) {
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
  const paidCount =
    installments?.filter((i) => isPastOrCurrentMonth(i.date, selectedMonth)).length ?? 0
  const totalCount = installments?.length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-purple-400" />
            {expense?.description}
          </DialogTitle>
          <DialogDescription>
            Gerencie as parcelas desta despesa. Você pode antecipar pagamentos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {installments?.map((installment) => {
                const isPaidOrCurrent = isPastOrCurrentMonth(installment.date, selectedMonth)
                const isFuture = !isPaidOrCurrent

                return (
                  <div
                    key={installment.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      isPaidOrCurrent
                        ? 'bg-muted/30 border-muted'
                        : 'bg-background border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          isPaidOrCurrent
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {isPaidOrCurrent ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-medium">
                            {installment.installment_current}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Parcela {installment.installment_current}/
                            {installment.installment_total}
                          </span>
                          {isPaidOrCurrent && (
                            <Badge
                              variant="outline"
                              className="border-emerald-500/50 text-emerald-400 text-xs"
                            >
                              {installment.date <= (new Date().toISOString().split('T')[0] ?? '')
                                ? 'Pago'
                                : 'Este mês'}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(installment.date)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-medium ${isPaidOrCurrent ? 'text-muted-foreground' : ''}`}
                      >
                        {hideValues ? '••••••' : formatBRL(installment.amount_cents)}
                      </span>
                      {isFuture && (
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
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="rounded-lg bg-muted/50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {paidCount} de {totalCount} parcelas
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(paidCount / totalCount) * 100}%` }}
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
