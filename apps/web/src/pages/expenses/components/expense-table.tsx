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
import { expenseService } from '@/services/expense.service'
import { useUIStore } from '@/stores'
import { formatBRL } from '@plim/shared'
import type { Category, Expense } from '@plim/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ExpenseModal } from './expense-modal'

interface ExpenseTableProps {
  expenses: Expense[]
  categories: Category[]
  isLoading: boolean
  selectedMonth: string
}

const PAYMENT_METHOD_CONFIG: Record<string, { label: string; className: string }> = {
  credit_card: { label: 'Crédito', className: 'border-amber-500/50 text-amber-400' },
  debit_card: { label: 'Débito', className: 'border-cyan-500/50 text-cyan-400' },
  pix: { label: 'PIX', className: 'border-emerald-500/50 text-emerald-400' },
  cash: { label: 'Dinheiro', className: 'border-slate-500/50 text-slate-400' },
}

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function getPreviousMonthEnd(currentDate: string): string {
  const date = new Date(`${currentDate}T00:00:00`)
  date.setDate(0)
  return date.toISOString().split('T')[0] as string
}

export function ExpenseTable({
  expenses,
  categories,
  isLoading,
  selectedMonth,
}: ExpenseTableProps) {
  const hideValues = useUIStore((state) => state.hideValues)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const queryClient = useQueryClient()

  const isRecurrentExpense = expenseToDelete?.is_recurrent && expenseToDelete?.is_projected

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
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
      toast.success('Recorrência cancelada com sucesso!')
      setExpenseToDelete(null)
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao cancelar recorrência')
    },
  })

  const handleDeleteAll = () => {
    if (!expenseToDelete) return
    const idToDelete = expenseToDelete.source_expense_id || expenseToDelete.id
    deleteMutation.mutate(idToDelete)
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

  const isPending = deleteMutation.isPending || cancelRecurrenceMutation.isPending

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
        selectedMonth={selectedMonth}
        expense={expenseToEdit ?? undefined}
      />

      <AlertDialog
        open={expenseToDelete !== null}
        onOpenChange={(open) => !open && setExpenseToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRecurrentExpense ? 'Excluir despesa recorrente' : 'Excluir despesa'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRecurrentExpense ? (
                <>
                  A despesa &quot;{expenseToDelete?.description}&quot; é recorrente. Como deseja
                  proceder?
                </>
              ) : (
                <>
                  Tem certeza que deseja excluir a despesa &quot;{expenseToDelete?.description}
                  &quot;? Esta ação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={isRecurrentExpense ? 'flex-col gap-2 sm:flex-col' : ''}>
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
            ) : (
              <Button variant="destructive" onClick={handleDeleteSingle} disabled={isPending}>
                {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
