import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const ResetPasswordPage = lazy(() =>
  import('@/pages/reset-password.page').then((m) => ({
    default: m.ResetPasswordPage,
  }))
)

export const Route = createFileRoute('/reset-password')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ResetPasswordPage />
    </Suspense>
  ),
})
