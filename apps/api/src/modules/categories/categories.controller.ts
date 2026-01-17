import { zValidator } from '@hono/zod-validator'
import { HTTP_STATUS, createCategorySchema, updateCategorySchema } from '@myfinances/shared'
import { Hono } from 'hono'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/supabase'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { CategoriesRepository } from './categories.repository'
import { CreateCategoryUseCase } from './create-category.usecase'
import { DeleteCategoryUseCase } from './delete-category.usecase'
import { ListCategoriesUseCase } from './list-categories.usecase'
import { UpdateCategoryUseCase } from './update-category.usecase'

type CategoriesEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const categoriesController = new Hono<CategoriesEnv>()

categoriesController.get('/', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new CategoriesRepository(supabase)
  const useCase = new ListCategoriesUseCase(repository)

  const categories = await useCase.execute(userId)

  return c.json({ data: categories }, HTTP_STATUS.OK)
})

categoriesController.post('/', zValidator('json', createCategorySchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new CategoriesRepository(supabase)
  const useCase = new CreateCategoryUseCase(repository)

  const category = await useCase.execute(userId, input)

  return c.json({ data: category }, HTTP_STATUS.CREATED)
})

categoriesController.patch('/:id', zValidator('json', updateCategorySchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const categoryId = c.req.param('id')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new CategoriesRepository(supabase)
  const useCase = new UpdateCategoryUseCase(repository)

  const category = await useCase.execute(userId, categoryId, input)

  return c.json({ data: category }, HTTP_STATUS.OK)
})

categoriesController.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const categoryId = c.req.param('id')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new CategoriesRepository(supabase)
  const useCase = new DeleteCategoryUseCase(repository)

  await useCase.execute(userId, categoryId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { categoriesController }
