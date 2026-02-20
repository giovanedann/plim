import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const ReferralLandingPage = lazy(() =>
  import('@/pages/referral-landing.page').then((m) => ({ default: m.ReferralLandingPage }))
)

export const Route = createFileRoute('/r/$code')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ReferralLandingPage />
    </Suspense>
  ),
})
