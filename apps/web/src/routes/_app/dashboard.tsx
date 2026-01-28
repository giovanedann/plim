import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const DashboardPage = lazy(() =>
  import('@/pages/dashboard/dashboard.page').then((m) => ({ default: m.DashboardPage }))
)

export const Route = createFileRoute('/_app/dashboard')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <DashboardPage />
    </Suspense>
  ),
})
