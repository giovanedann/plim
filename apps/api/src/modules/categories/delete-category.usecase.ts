import { ERROR_CODES, HTTP_STATUS } from '@myfinances/shared'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CategoriesRepository } from './categories.repository'

export class DeleteCategoryUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(userId: string, categoryId: string): Promise<void> {
    const existing = await this.categoriesRepository.findById(categoryId, userId)

    if (!existing) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Category not found', HTTP_STATUS.NOT_FOUND)
    }

    // System categories (user_id = null) cannot be deleted
    if (existing.user_id === null) {
      throw new AppError(
        ERROR_CODES.FORBIDDEN,
        'Cannot delete system categories',
        HTTP_STATUS.FORBIDDEN
      )
    }

    const deleted = await this.categoriesRepository.softDelete(categoryId, userId)

    if (!deleted) {
      throw new AppError(ERROR_CODES.NOT_FOUND, 'Category not found', HTTP_STATUS.NOT_FOUND)
    }
  }
}
