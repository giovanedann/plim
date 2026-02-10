import { type Category, type CreateCategory, ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import { checkPlanLimit } from '../../lib/check-plan-limit'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CategoriesRepository } from './categories.repository'

export class CreateCategoryUseCase {
  constructor(
    private categoriesRepository: CategoriesRepository,
    private supabase: SupabaseClient
  ) {}

  async execute(userId: string, input: CreateCategory): Promise<Category> {
    const currentCount = await this.categoriesRepository.countByUserId(userId)

    await checkPlanLimit({
      supabase: this.supabase,
      userId,
      feature: 'categories.custom',
      currentCount,
    })

    const category = await this.categoriesRepository.create(userId, input)

    if (!category) {
      throw new AppError(
        ERROR_CODES.INTERNAL_ERROR,
        'Failed to create category',
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      )
    }

    return category
  }
}
