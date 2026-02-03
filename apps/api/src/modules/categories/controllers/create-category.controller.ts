import type { Category, CreateCategory } from '@plim/shared'
import type { CreateCategoryUseCase } from '../create-category.usecase'

export async function createCategoryController(
  userId: string,
  input: CreateCategory,
  createCategoryUseCase: CreateCategoryUseCase
): Promise<Category> {
  return createCategoryUseCase.execute(userId, input)
}
