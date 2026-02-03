import type { Category, UpdateCategory } from '@plim/shared'
import type { UpdateCategoryUseCase } from '../update-category.usecase'

export async function updateCategoryController(
  userId: string,
  categoryId: string,
  input: UpdateCategory,
  updateCategoryUseCase: UpdateCategoryUseCase
): Promise<Category> {
  return updateCategoryUseCase.execute(userId, categoryId, input)
}
