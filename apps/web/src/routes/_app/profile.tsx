import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const ProfilePage = lazy(() =>
  import('@/pages/profile/profile.page').then((m) => ({ default: m.ProfilePage }))
)

export const Route = createFileRoute('/_app/profile')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <ProfilePage />
    </Suspense>
  ),
})
