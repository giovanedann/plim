import { type Category, ERROR_CODES, HTTP_STATUS, type UpdateCategory } from '@plim/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CategoriesRepository } from './categories.repository'

export class UpdateCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(userId: string, categoryId: string, input: UpdateCategory): Promise<Category> {
    const existing = await this.categoriesRepository.findById(categoryId, userId)

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Category not found', HTTP_STATUS.NOT_FOUND)
    }

    // System categories (user_id = null) cannot be modified
    if (existing.user_id === null) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Cannot modify system categories',
        HTTP_STATUS.FORBIDDEN
      )
    }

    const category = await this.categoriesRepository.update(categoryId, userId, input)

    if (!category) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Category not found', HTTP_STATUS.NOT_FOUND)
    }

    return category
  }
}
