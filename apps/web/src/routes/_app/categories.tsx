import { CategoriesPage } from '@/pages'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/categories')({
  component: CategoriesPage,
})
