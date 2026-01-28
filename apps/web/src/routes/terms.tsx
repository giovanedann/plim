import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const TermsPage = lazy(() =>
  import('@/pages/legal/terms.page').then((m) => ({ default: m.TermsPage }))
)

export const Route = createFileRoute('/terms')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <TermsPage />
    </Suspense>
  ),
})
