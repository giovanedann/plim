import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const SignInPage = lazy(() =>
  import('@/pages/sign-in.page').then((m) => ({ default: m.SignInPage }))
)

export const Route = createFileRoute('/_auth/sign-in')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SignInPage />
    </Suspense>
  ),
})
