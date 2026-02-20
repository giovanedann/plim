import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'
import { z } from 'zod'

const SignUpPage = lazy(() =>
  import('@/pages/sign-up.page').then((m) => ({ default: m.SignUpPage }))
)

const signUpSearchSchema = z.object({
  ref: z.string().optional(),
})

export const Route = createFileRoute('/_auth/sign-up')({
  validateSearch: signUpSearchSchema,
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <SignUpPage />
    </Suspense>
  ),
})
