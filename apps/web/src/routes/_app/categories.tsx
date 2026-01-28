import { PageLoader } from '@/components/page-loader'
import { createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy } from 'react'

const CategoriesPage = lazy(() =>
  import('@/pages/categories/categories.page').then((m) => ({ default: m.CategoriesPage }))
)

export const Route = createFileRoute('/_app/categories')({
  component: () => (
    <Suspense fallback={<PageLoader />}>
      <CategoriesPage />
    </Suspense>
  ),
})
