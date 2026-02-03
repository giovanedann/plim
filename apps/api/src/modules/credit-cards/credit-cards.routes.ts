import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, createCreditCardSchema, updateCreditCardSchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { createCreditCardController } from './controllers/create-credit-card.controller'
import { deleteCreditCardController } from './controllers/delete-credit-card.controller'
import { listCreditCardsController } from './controllers/list-credit-cards.controller'
import { updateCreditCardController } from './controllers/update-credit-card.controller'
import { type CreditCardsDependencies, createCreditCardsDependencies } from './credit-cards.factory'

export type CreditCardsEnv = {
  Bindings: Bindings
  Variables: AuthVariables & { creditCardsDeps: CreditCardsDependencies }
}

export function createCreditCardsRouter(): Hono<CreditCardsEnv> {
  const router = new Hono<CreditCardsEnv>()

  // Middleware to create dependencies once per request
  router.use('*', async (c, next) => {
    const deps = createCreditCardsDependencies({
      env: c.env,
      accessToken: c.get('accessToken'),
    })
    c.set('creditCardsDeps', deps)
    await next()
  })

  // Route handlers: Extract data → Call controller function → Format response
  router.get('/', async (c) => {
    const deps = c.get('creditCardsDeps')
    const result = await listCreditCardsController(c.get('userId'), deps.listCreditCards)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', createCreditCardSchema), async (c) => {
    const deps = c.get('creditCardsDeps')
    const result = await createCreditCardController(
      c.get('userId'),
      c.req.valid('json'),
      deps.createCreditCard
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.patch('/:id', sValidator('json', updateCreditCardSchema), async (c) => {
    const deps = c.get('creditCardsDeps')
    const result = await updateCreditCardController(
      c.get('userId'),
      c.req.param('id'),
      c.req.valid('json'),
      deps.updateCreditCard
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.delete('/:id', async (c) => {
    const deps = c.get('creditCardsDeps')
    await deleteCreditCardController(c.get('userId'), c.req.param('id'), deps.deleteCreditCard)
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Helper function for testing - allows dependency injection
export function createCreditCardsRouterWithDeps(
  deps: CreditCardsDependencies
): Hono<CreditCardsEnv> {
  const router = new Hono<CreditCardsEnv>()

  router.get('/', async (c) => {
    const result = await listCreditCardsController(c.get('userId'), deps.listCreditCards)
    return success(c, result, HTTP_STATUS.OK)
  })

  router.post('/', sValidator('json', createCreditCardSchema), async (c) => {
    const result = await createCreditCardController(
      c.get('userId'),
      c.req.valid('json'),
      deps.createCreditCard
    )
    return success(c, result, HTTP_STATUS.CREATED)
  })

  router.patch('/:id', sValidator('json', updateCreditCardSchema), async (c) => {
    const result = await updateCreditCardController(
      c.get('userId'),
      c.req.param('id'),
      c.req.valid('json'),
      deps.updateCreditCard
    )
    return success(c, result, HTTP_STATUS.OK)
  })

  router.delete('/:id', async (c) => {
    await deleteCreditCardController(c.get('userId'), c.req.param('id'), deps.deleteCreditCard)
    return c.body(null, HTTP_STATUS.NO_CONTENT)
  })

  return router
}

// Export default instance for production
export const creditCardsRouter = createCreditCardsRouter()
