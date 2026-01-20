import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { formatBRL } from '@myfinances/shared'
import type { Category, Expense } from '@myfinances/shared'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Pencil, RefreshCw, Repeat, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ExpenseModal } from './expense-modal'

interface ExpenseTableProps {
  expenses: Expense[]
  categories: Category[]
  isLoading: boolean
  selectedMonth: string
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  pix: 'Pix',
  cash: 'Dinheiro',
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
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const queryClient = useQueryClient()

  const isRecurrentExpense = expenseToDelete?.is_recurrent && expenseToDelete?.is_projected

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expenseService.deleteExpense(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
      setExpenseToDelete(null)
    },
  })

  const cancelRecurrenceMutation = useMutation({
    mutationFn: ({ id, endDate }: { id: string; endDate: string }) =>
      expenseService.cancelRecurrence(id, endDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'], refetchType: 'all' })
      setExpenseToDelete(null)
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

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.name ?? 'Sem categoria'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    return category?.color ?? '#6b7280'
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
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell className="font-medium">{formatDate(expense.date)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {expense.description}
                    {expense.is_recurrent && (
                      <span title="Despesa recorrente">
                        <Repeat className="h-4 w-4 text-blue-500" />
                      </span>
                    )}
                    {expense.installment_total && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
                        <RefreshCw className="h-3 w-3" />
                        {expense.installment_current}/{expense.installment_total}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(expense.category_id) }}
                    />
                    {getCategoryName(expense.category_id)}
                  </div>
                </TableCell>
                <TableCell>{PAYMENT_METHOD_LABELS[expense.payment_method]}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatBRL(expense.amount_cents)}
                </TableCell>
                <TableCell>
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
            ))}
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
