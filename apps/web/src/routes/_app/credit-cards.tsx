import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const CreditCardsPage = lazy(() =>
  import('@/pages/credit-cards/credit-cards.page').then((m) => ({ default: m.CreditCardsPage }))
)

export const Route = createFileRoute('/_app/credit-cards')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CreditCardsPage />
    </Suspense>
  ),
})
