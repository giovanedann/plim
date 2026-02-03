import type { DeleteCategoryUseCase } from '../delete-category.usecase'

export async function deleteCategoryController(
  userId: string,
  categoryId: string,
  deleteCategoryUseCase: DeleteCategoryUseCase
): Promise<void> {
  return deleteCategoryUseCase.execute(userId, categoryId)
}
