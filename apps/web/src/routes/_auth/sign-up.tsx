import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const SignUpPage = lazy(() =>
  import('@/pages/sign-up.page').then((m) => ({ default: m.SignUpPage }))
)

export const Route = createFileRoute('/_auth/sign-up')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SignUpPage />
    </Suspense>
  ),
})
