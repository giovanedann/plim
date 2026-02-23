import { CategoryIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  type ExpenseChange,
  applyOptimisticDashboardUpdate,
  applyOptimisticExpenseGroupRemove,
  applyOptimisticExpenseRemove,
  applyOptimisticRecurrentGroupRemove,
  rollbackDashboardUpdate,
  rollbackExpensesUpdate,
} from '@/lib/optimistic-updates'
import { queryKeys } from '@/lib/query-config'
import { expenseService } from '@/services/expense.service'
import { useUIStore } from '@/stores'
import { formatBRL } from '@plim/shared'
import type {
  Category,
  CreditCard,
  EffectiveSpendingLimit,
  Expense,
  TransactionType,
} from '@plim/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ExpenseModal } from './expense-modal'
import { InstallmentGroupModal } from './installment-group-modal'

interface ExpenseTableProps {
  expenses: Expense[]
  categories: Category[]
  creditCards: CreditCard[]
  isLoading: boolean
  selectedMonth: string
  spendingLimit?: EffectiveSpendingLimit | null
  totalExpenses?: number
}

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; className: string }> = {
  credit_card: { label: 'Crédito', className: 'border-amber-500/50 text-amber-400' },
  debit_card: { label: 'Débito', className: 'border-cyan-500/50 text-cyan-400' },
  pix: { label: 'PIX', className: 'border-emerald-500/50 text-emerald-400' },
  cash: { label: 'Dinheiro', className: 'border-muted-foreground/50 text-muted-foreground' },
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function formatSignedAmount(amountCents: number, type: TransactionType): string {
  const formatted = formatBRL(amountCents)
  return type === 'income' ? `+ ${formatted}` : `- ${formatted}`
}

function getAmountClassName(type: TransactionType): string {
  return type === 'income' ? 'text-emerald-500' : 'text-red-500'
}

export function ExpenseTable({
  expenses,
  categories,
  creditCards,
  isLoading,
  selectedMonth,
  spendingLimit,
  totalExpenses,
}: ExpenseTableProps) {
  const hideValues = useUIStore((state) => state.hideValues)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [installmentExpense, setInstallmentExpense] = useState<Expense | null>(null)
  const queryClient = useQueryClient()

  const isRecurrentExpense = expenseToDelete?.is_recurrent && expenseToDelete?.recurrent_group_id
  const isInstallmentExpense =
    expenseToDelete?.installment_total && expenseToDelete.installment_total > 1

  const getExpenseChange = (exp: Expense): ExpenseChange => {
    const category = categories.find((c) => c.id === exp.category_id)
    const creditCard = creditCards.find((c) => c.id === exp.credit_card_id)
    return {
      amount_cents: exp.amount_cents,
      category_id: exp.category_id,
      category_name: category?.name,
      category_color: category?.color,
      category_icon: category?.icon,
      payment_method: exp.payment_method,
      credit_card_id: exp.credit_card_id,
      credit_card_name: creditCard?.name,
      credit_card_color: creditCard?.color,
      credit_card_bank: creditCard?.bank,
      credit_card_flag: creditCard?.flag,
      date: exp.date,
      installment_total: exp.installment_total ?? undefined,
      operation: 'remove',
    }
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onMutate: async (id) => {
      if (!expenseToDelete) return {}

      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses() })

      const change = getExpenseChange(expenseToDelete)
      const previousDashboards = applyOptimisticDashboardUpdate(queryClient, change)
      const previousExpenses = applyOptimisticExpenseRemove(queryClient, id)

      return { previousDashboards, previousExpenses }
    },
    onSuccess: () => {
      toast.success('Despesa excluída com sucesso!')
      setExpenseToDelete(null)
    },
    onError: (error, _variables, context) => {
      if (context?.previousDashboards) {
        rollbackDashboardUpdate(queryClient, context.previousDashboards)
      }
      if (context?.previousExpenses) {
        rollbackExpensesUpdate(queryClient, context.previousExpenses)
      }
      toast.error(error.message || 'Erro ao excluir despesa')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })

  const cancelRecurrenceMutation = useMutation({
    mutationFn: ({ id, endDate }: { id: string; endDate: string }) =>
      expenseService.cancelRecurrence(id, endDate),
    onMutate: async ({ id }) => {
      if (!expenseToDelete) return {}

      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses() })

      const change = getExpenseChange(expenseToDelete)
      const previousDashboards = applyOptimisticDashboardUpdate(queryClient, change)
      const previousExpenses = applyOptimisticExpenseRemove(queryClient, id)

      return { previousDashboards, previousExpenses }
    },
    onSuccess: () => {
      toast.success('Recorrência cancelada com sucesso!')
      setExpenseToDelete(null)
    },
    onError: (error, _variables, context) => {
      if (context?.previousDashboards) {
        rollbackDashboardUpdate(queryClient, context.previousDashboards)
      }
      if (context?.previousExpenses) {
        rollbackExpensesUpdate(queryClient, context.previousExpenses)
      }
      toast.error(error.message || 'Erro ao cancelar recorrência')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })

  const deleteInstallmentGroupMutation = useMutation({
    mutationFn: (groupId: string) => expenseService.deleteInstallmentGroup(groupId),
    onMutate: async (groupId) => {
      if (!expenseToDelete) return {}

      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses() })

      const totalAmount = expenseToDelete.amount_cents * (expenseToDelete.installment_total ?? 1)
      const change: ExpenseChange = {
        ...getExpenseChange(expenseToDelete),
        amount_cents: totalAmount,
        installment_total: expenseToDelete.installment_total ?? undefined,
      }
      const previousDashboards = applyOptimisticDashboardUpdate(queryClient, change)
      const previousExpenses = applyOptimisticExpenseGroupRemove(queryClient, groupId)

      return { previousDashboards, previousExpenses }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installment-group'] })
      toast.success('Todas as parcelas foram excluídas!')
      setExpenseToDelete(null)
    },
    onError: (error, _variables, context) => {
      if (context?.previousDashboards) {
        rollbackDashboardUpdate(queryClient, context.previousDashboards)
      }
      if (context?.previousExpenses) {
        rollbackExpensesUpdate(queryClient, context.previousExpenses)
      }
      toast.error(error.message || 'Erro ao excluir parcelas')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })

  const deleteRecurrentGroupMutation = useMutation({
    mutationFn: (groupId: string) => expenseService.deleteRecurrentGroup(groupId),
    onMutate: async (groupId) => {
      if (!expenseToDelete) return {}

      await queryClient.cancelQueries({ queryKey: queryKeys.dashboard.all })
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses() })

      const change = getExpenseChange(expenseToDelete)
      const previousDashboards = applyOptimisticDashboardUpdate(queryClient, change)
      const previousExpenses = applyOptimisticRecurrentGroupRemove(queryClient, groupId)

      return { previousDashboards, previousExpenses }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurrent-group'] })
      toast.success('Despesa recorrente excluída com sucesso!')
      setExpenseToDelete(null)
    },
    onError: (error, _variables, context) => {
      if (context?.previousDashboards) {
        rollbackDashboardUpdate(queryClient, context.previousDashboards)
      }
      if (context?.previousExpenses) {
        rollbackExpensesUpdate(queryClient, context.previousExpenses)
      }
      toast.error(error.message || 'Erro ao excluir despesa recorrente')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses() })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })

  const handleDeleteAll = () => {
    if (!expenseToDelete) return

    if (expenseToDelete.installment_group_id) {
      deleteInstallmentGroupMutation.mutate(expenseToDelete.installment_group_id)
    } else if (expenseToDelete.recurrent_group_id) {
      deleteRecurrentGroupMutation.mutate(expenseToDelete.recurrent_group_id)
    } else {
      const idToDelete = expenseToDelete.source_expense_id || expenseToDelete.id
      deleteMutation.mutate(idToDelete)
    }
  }

  const handleDeleteSingle = () => {
    if (!expenseToDelete) return
    deleteMutation.mutate(expenseToDelete.id)
  }

  const isPending =
    deleteMutation.isPending ||
    cancelRecurrenceMutation.isPending ||
    deleteInstallmentGroupMutation.isPending ||
    deleteRecurrentGroupMutation.isPending

  const getCategory = (categoryId: string | null) => {
    if (!categoryId) return undefined
    return categories.find((c) => c.id === categoryId)
  }

  if (isLoading) {
    return (
      <div className="rounded-md border mb-20">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}>
                  <div className="h-8 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="rounded-md border mb-20 p-8 text-center">
        <p className="text-muted-foreground">
          Nenhuma despesa ou receita encontrada para este mês.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique em &quot;Nova Despesa&quot; para adicionar sua primeira despesa ou receita.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* mb-20 ensures the last row is accessible above the fixed AI chat FAB */}
      <div className="rounded-md border mb-20" data-tutorial-id="expense-list">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => {
              const category = getCategory(expense.category_id)
              const paymentConfig = PAYMENT_METHOD_CONFIG[expense.payment_method]
              return (
                <TableRow
                  key={expense.id}
                  className="transition-colors duration-150 hover:bg-muted border-l-2 border-l-transparent hover:border-l-primary"
                >
                  <TableCell className="py-2 px-4 font-medium">
                    {formatDate(expense.date)}
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <span>{expense.description}</span>
                      {expense.is_recurrent && (
                        <Badge
                          variant="outline"
                          className="border-blue-500/50 text-blue-400 text-xs px-1.5"
                        >
                          Recorrente
                        </Badge>
                      )}
                      {expense.installment_total && (
                        <Badge
                          variant="outline"
                          className="border-purple-500/50 text-purple-400 text-xs px-1.5"
                        >
                          {expense.installment_current}/{expense.installment_total}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    {expense.type === 'income' ? (
                      <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">
                        Receita
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="gap-1.5"
                        style={{
                          backgroundColor: category?.color ? `${category.color}20` : undefined,
                          borderColor: category?.color ? `${category.color}50` : undefined,
                          borderWidth: '1px',
                        }}
                      >
                        <CategoryIcon name={category?.icon} color={category?.color} size="sm" />
                        {category?.name ?? 'Sem categoria'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    <Badge variant="outline" className={paymentConfig?.className}>
                      {paymentConfig?.label ?? expense.payment_method}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`py-2 px-4 text-right font-medium ${hideValues ? '' : getAmountClassName(expense.type)}`}
                  >
                    {hideValues ? '••••••' : formatSignedAmount(expense.amount_cents, expense.type)}
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {expense.installment_group_id && (
                          <DropdownMenuItem onClick={() => setInstallmentExpense(expense)}>
                            <CalendarClock className="mr-2 h-4 w-4" />
                            Ver parcelas
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setExpenseToEdit(expense)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setExpenseToDelete(expense)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <ExpenseModal
        open={expenseToEdit !== null}
        onOpenChange={(open) => !open && setExpenseToEdit(null)}
        categories={categories}
        creditCards={creditCards}
        selectedMonth={selectedMonth}
        expense={expenseToEdit ?? undefined}
        spendingLimit={spendingLimit}
        totalExpenses={totalExpenses}
      />

      <AlertDialog
        open={expenseToDelete !== null}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRecurrentExpense
                ? 'Excluir despesa recorrente'
                : isInstallmentExpense
                  ? 'Excluir despesa parcelada'
                  : 'Excluir despesa'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRecurrentExpense ? (
                <>
                  A despesa &quot;{expenseToDelete?.description}&quot; é recorrente. Como deseja
                  proceder?
                </>
              ) : isInstallmentExpense ? (
                <>
                  A despesa &quot;{expenseToDelete?.description}&quot; é parcelada (
                  {expenseToDelete?.installment_current}/{expenseToDelete?.installment_total}). Como
                  deseja proceder?
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir a despesa &quot;{expenseToDelete?.description}
                  &quot;? Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter
            className={
              isRecurrentExpense || isInstallmentExpense ? 'flex-col gap-2 sm:flex-col' : ''
            }
          >
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            {isRecurrentExpense ? (
              <>
                <Button variant="outline" onClick={handleDeleteSingle} disabled={isPending}>
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir apenas este mês'}
                </Button>
                <Button variant="destructive" onClick={handleDeleteAll} disabled={isPending}>
                  {deleteRecurrentGroupMutation.isPending
                    ? 'Excluindo...'
                    : 'Excluir todas as ocorrências'}
                </Button>
              </>
            ) : isInstallmentExpense ? (
              <>
                <Button variant="outline" onClick={handleDeleteSingle} disabled={isPending}>
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir apenas esta parcela'}
                </Button>
                <Button variant="destructive" onClick={handleDeleteAll} disabled={isPending}>
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir todas as parcelas'}
                </Button>
              </>
            ) : (
              <Button variant="destructive" onClick={handleDeleteSingle} disabled={isPending}>
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <InstallmentGroupModal
        open={installmentExpense !== null}
        onOpenChange={(open) => !open && setInstallmentExpense(null)}
        expense={installmentExpense}
      />
    </>
  )
}
