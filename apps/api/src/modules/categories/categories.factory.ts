import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { CategoriesRepository } from './categories.repository'
import { CreateCategoryUseCase } from './create-category.usecase'
import { DeleteCategoryUseCase } from './delete-category.usecase'
import { ListCategoriesUseCase } from './list-categories.usecase'
import { UpdateCategoryUseCase } from './update-category.usecase'

export interface CategoriesDependencies {
  repository: CategoriesRepository
  listCategories: ListCategoriesUseCase
  createCategory: CreateCategoryUseCase
  updateCategory: UpdateCategoryUseCase
  deleteCategory: DeleteCategoryUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createCategoriesDependencies(
  options: CreateDependenciesOptions
): CategoriesDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new CategoriesRepository(supabase)
  return {
    repository,
    listCategories: new ListCategoriesUseCase(repository),
    createCategory: new CreateCategoryUseCase(repository, supabase),
    updateCategory: new UpdateCategoryUseCase(repository),
    deleteCategory: new DeleteCategoryUseCase(repository),
  }
}
