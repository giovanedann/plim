import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const HomePage = lazy(() => import('@/pages/home/home.page').then((m) => ({ default: m.HomePage })))

export const Route = createFileRoute('/_app/home')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <HomePage />
    </Suspense>
  ),
})
