import type { Category } from '@plim/shared'
import type { ListCategoriesUseCase } from '../list-categories.usecase'

export async function listCategoriesController(
  userId: string,
  listCategoriesUseCase: ListCategoriesUseCase
): Promise<Category[]> {
  return listCategoriesUseCase.execute(userId)
}
