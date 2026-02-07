import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const UpgradePage = lazy(() =>
  import('@/pages/upgrade/upgrade.page').then((m) => ({ default: m.UpgradePage }))
)

export const Route = createFileRoute('/_app/upgrade')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <UpgradePage />
    </Suspense>
  ),
})
