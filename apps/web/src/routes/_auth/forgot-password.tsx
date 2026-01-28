import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const ForgotPasswordPage = lazy(() =>
  import('@/pages/forgot-password.page').then((m) => ({
    default: m.ForgotPasswordPage,
  }))
)

export const Route = createFileRoute('/_auth/forgot-password')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ForgotPasswordPage />
    </Suspense>
  ),
})
