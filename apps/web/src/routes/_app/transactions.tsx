import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const ExpensesPage = lazy(() =>
  import('@/pages/expenses/expenses.page').then((m) => ({ default: m.ExpensesPage }))
)

export const Route = createFileRoute('/_app/transactions')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ExpensesPage />
    </Suspense>
  ),
})
