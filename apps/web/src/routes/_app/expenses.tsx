import { ExpensesPage } from '@/pages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/expenses')({
  component: ExpensesPage,
})
