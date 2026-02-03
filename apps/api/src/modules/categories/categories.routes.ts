import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, createCategorySchema, updateCategorySchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { type CategoriesDependencies, createCategoriesDependencies } from './categories.factory'
import { createCategoryController } from './controllers/create-category.controller'
import { deleteCategoryController } from './controllers/delete-category.controller'
import { listCategoriesController } from './controllers/list-categories.controller'
import { updateCategoryController } from './controllers/update-category.controller'

export type CategoriesEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { categoriesDeps: CategoriesDependencies }
}

export function createCategoriesRouter(): Hono<CategoriesEnv> {
  const router = new Hono<CategoriesEnv>()

  // Middleware to create dependencies once per request
  router.use('*', async (c, next) => {
    const deps = createCategoriesDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('categoriesDeps', deps)
    await next()
  })

  // Route handlers: Extract data → Call controller function → Format response
  router.get('/', async (c) => {
    const deps = c.get('categoriesDeps')
    const result = await listCategoriesController(c.get('userId'), deps.listCategories)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', createCategorySchema), async (c) => {
    const deps = c.get('categoriesDeps')
    const result = await createCategoryController(
      c.get('userId'),
      c.req.valid('json'),
      deps.createCategory
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.patch('/:id', sValidator('json', updateCategorySchema), async (c) => {
    const deps = c.get('categoriesDeps')
    const result = await updateCategoryController(
      c.get('userId'),
      c.req.param('id'),
      c.req.valid('json'),
      deps.updateCategory
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.delete('/:id', async (c) => {
    const deps = c.get('categoriesDeps')
    await deleteCategoryController(c.get('userId'), c.req.param('id'), deps.deleteCategory)
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Helper function for testing - allows dependency injection
export function createCategoriesRouterWithDeps(deps: CategoriesDependencies): Hono<CategoriesEnv> {
  const router = new Hono<CategoriesEnv>()

  router.get('/', async (c) => {
    const result = await listCategoriesController(c.get('userId'), deps.listCategories)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', createCategorySchema), async (c) => {
    const result = await createCategoryController(
      c.get('userId'),
      c.req.valid('json'),
      deps.createCategory
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.patch('/:id', sValidator('json', updateCategorySchema), async (c) => {
    const result = await updateCategoryController(
      c.get('userId'),
      c.req.param('id'),
      c.req.valid('json'),
      deps.updateCategory
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.delete('/:id', async (c) => {
    await deleteCategoryController(c.get('userId'), c.req.param('id'), deps.deleteCategory)
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Export default instance for production
export const categoriesRouter = createCategoriesRouter()
