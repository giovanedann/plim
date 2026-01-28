import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const PrivacyPage = lazy(() =>
  import('@/pages/legal/privacy.page').then((m) => ({ default: m.PrivacyPage }))
)

export const Route = createFileRoute('/privacy')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <PrivacyPage />
    </Suspense>
  ),
})
