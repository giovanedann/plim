import type { Category } from '@myfinances/shared'
import type { CategoriesRepository } from './categories.repository'

export class ListCategoriesUseCase {
  constructor(private categoriesRepository: CategoriesRepository) {}

  async execute(userId: string): Promise<Category[]> {
    return this.categoriesRepository.findByUserId(userId)
  }
}
