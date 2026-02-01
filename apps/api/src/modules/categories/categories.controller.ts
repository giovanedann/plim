import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, createCategorySchema, updateCategorySchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { createCategoriesDependencies } from './categories.factory'

type CategoriesEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const categoriesController = new Hono<CategoriesEnv>()

categoriesController.get('/', async (c) => {
  const userId = c.get('userId')

  const { listCategories } = createCategoriesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const categories = await listCategories.execute(userId)

  return success(c, categories, HTTP_STATUS.OK)
})

categoriesController.post('/', sValidator('json', createCategorySchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')

  const { createCategory } = createCategoriesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const category = await createCategory.execute(userId, input)

  return success(c, category, HTTP_STATUS.CREATED)
})

categoriesController.patch('/:id', sValidator('json', updateCategorySchema), async (c) => {
  const userId = c.get('userId')
  const categoryId = c.req.param('id')
  const input = c.req.valid('json')

  const { updateCategory } = createCategoriesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const category = await updateCategory.execute(userId, categoryId, input)

  return success(c, category, HTTP_STATUS.OK)
})

categoriesController.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const categoryId = c.req.param('id')

  const { deleteCategory } = createCategoriesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  await deleteCategory.execute(userId, categoryId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { categoriesController }
