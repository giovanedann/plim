import { CategoryIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
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
import { expenseService } from '@/services/expense.service'
import { useUIStore } from '@/stores'
import { formatBRL } from '@plim/shared'
import type { Category, CreditCard, EffectiveSpendingLimit, Expense } from '@plim/shared'
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

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getPreviousMonthEnd(currentDate: string): string {
  const date = new Date(`${currentDate}T00:00:00`)
  date.setDate(0)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
  const [projectedExpenseInfo, setProjectedExpenseInfo] = useState<Expense | null>(null)
  const [installmentExpense, setInstallmentExpense] = useState<Expense | null>(null)
  const queryClient = useQueryClient()

  const isRecurrentExpense = expenseToDelete?.is_recurrent && expenseToDelete?.is_projected
  const isInstallmentExpense =
    expenseToDelete?.installment_total && expenseToDelete.installment_total > 1

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
      toast.success('Despesa excluída com sucesso!')
      setExpenseToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir despesa')
    },
  })

  const cancelRecurrenceMutation = useMutation({
    mutationFn: ({ id, endDate }: { id: string; endDate: string }) =>
      expenseService.cancelRecurrence(id, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
      toast.success('Recorrência cancelada com sucesso!')
      setExpenseToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao cancelar recorrência')
    },
  })

  const deleteInstallmentGroupMutation = useMutation({
    mutationFn: (groupId: string) => expenseService.deleteInstallmentGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['dashboard'], refetchType: 'all' })
      queryClient.invalidateQueries({ queryKey: ['installment-group'] })
      toast.success('Todas as parcelas foram excluídas!')
      setExpenseToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao excluir parcelas')
    },
  })

  const handleDeleteAll = () => {
    if (!expenseToDelete) return

    if (expenseToDelete.installment_group_id) {
      deleteInstallmentGroupMutation.mutate(expenseToDelete.installment_group_id)
    } else {
      const idToDelete = expenseToDelete.source_expense_id || expenseToDelete.id
      deleteMutation.mutate(idToDelete)
    }
  }

  const handleCancelFromThisMonth = () => {
    if (!expenseToDelete) return
    const sourceId = expenseToDelete.source_expense_id || expenseToDelete.id
    const endDate = getPreviousMonthEnd(expenseToDelete.date)
    cancelRecurrenceMutation.mutate({ id: sourceId, endDate })
  }

  const handleDeleteSingle = () => {
    if (!expenseToDelete) return
    deleteMutation.mutate(expenseToDelete.id)
  }

  const isPending =
    deleteMutation.isPending ||
    cancelRecurrenceMutation.isPending ||
    deleteInstallmentGroupMutation.isPending

  const getCategory = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId)
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
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
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Nenhuma despesa encontrada para este mês.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Clique em &quot;Nova Despesa&quot; para adicionar sua primeira despesa.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-md border">
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
                  </TableCell>
                  <TableCell className="py-2 px-4">
                    <Badge variant="outline" className={paymentConfig?.className}>
                      {paymentConfig?.label ?? expense.payment_method}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-2 px-4 text-right font-medium">
                    {hideValues ? '••••••' : formatBRL(expense.amount_cents)}
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
                        <DropdownMenuItem
                          onClick={() => {
                            if (expense.is_projected) {
                              setProjectedExpenseInfo(expense)
                            } else {
                              setExpenseToEdit(expense)
                            }
                          }}
                        >
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
                <Button variant="outline" onClick={handleCancelFromThisMonth} disabled={isPending}>
                  {cancelRecurrenceMutation.isPending
                    ? 'Cancelando...'
                    : 'Cancelar a partir deste mês'}
                </Button>
                <Button variant="destructive" onClick={handleDeleteAll} disabled={isPending}>
                  {deleteMutation.isPending ? 'Excluindo...' : 'Excluir todas as ocorrências'}
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

      <AlertDialog
        open={projectedExpenseInfo !== null}
        onOpenChange={(open) => !open && setProjectedExpenseInfo(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Despesa recorrente projetada</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta é uma projeção da despesa recorrente &quot;{projectedExpenseInfo?.description}
                &quot;.
              </p>
              <p>
                Despesas recorrentes são mostradas automaticamente em cada mês. Para alterar o
                valor, descrição ou forma de pagamento, você precisa editar a despesa original.
              </p>
              <p className="font-medium">
                Ao editar a original, as mudanças serão refletidas em todas as projeções futuras.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!projectedExpenseInfo?.source_expense_id) {
                  toast.error('ID da despesa original não encontrado')
                  setProjectedExpenseInfo(null)
                  return
                }
                const result = await expenseService.getExpense(
                  projectedExpenseInfo.source_expense_id
                )
                if (result.data) {
                  setExpenseToEdit(result.data)
                } else {
                  toast.error('Erro ao carregar despesa original')
                }
                setProjectedExpenseInfo(null)
              }}
            >
              Editar despesa original
            </AlertDialogAction>
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
