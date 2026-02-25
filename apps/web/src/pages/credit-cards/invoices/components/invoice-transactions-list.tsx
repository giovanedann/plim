import { CategoryIcon } from '@/components/icons'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useUIStore } from '@/stores'
import { formatBRL } from '@plim/shared'
import type { Category, Expense } from '@plim/shared'

interface InvoiceTransactionsListProps {
  transactions: Expense[]
  categories: Category[]
  isLoading: boolean
}

function formatDate(dateString: string): string {
  const date = new Date(`${dateString}T00:00:00`)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export function InvoiceTransactionsList({
  transactions,
  categories,
  isLoading,
}: InvoiceTransactionsListProps) {
  const hideValues = useUIStore((state) => state.hideValues)

  const getCategory = (categoryId: string | null): Category | undefined => {
    if (!categoryId) return undefined
    return categories.find((c) => c.id === categoryId)
  }

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descricao</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((i) => (
              <TableRow key={i}>
                <TableCell colSpan={4}>
                  <div className="h-8 animate-pulse rounded bg-muted" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Nenhuma transacao nesta fatura.</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Descricao</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const category = getCategory(transaction.category_id)
            return (
              <TableRow key={transaction.id}>
                <TableCell className="py-2 px-4 font-medium">
                  {formatDate(transaction.date)}
                </TableCell>
                <TableCell className="py-2 px-4">
                  <div className="flex items-center gap-2">
                    <span>{transaction.description}</span>
                    {transaction.installment_total && (
                      <Badge
                        variant="outline"
                        className="border-purple-500/50 text-purple-400 text-xs px-1.5"
                      >
                        {transaction.installment_current}/{transaction.installment_total}
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
                <TableCell className="py-2 px-4 text-right font-medium whitespace-nowrap text-red-500">
                  {hideValues ? '******' : `- ${formatBRL(transaction.amount_cents)}`}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
