import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, createCreditCardSchema, updateCreditCardSchema } from '@plim/shared'
import { Hono } from 'hono'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { createCreditCardsDependencies } from './credit-cards.factory'

type CreditCardsEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const creditCardsController = new Hono<CreditCardsEnv>()

creditCardsController.get('/', async (c) => {
  const userId = c.get('userId')

  const { listCreditCards } = createCreditCardsDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const creditCards = await listCreditCards.execute(userId)

  return success(c, creditCards, HTTP_STATUS.OK)
})

creditCardsController.post('/', sValidator('json', createCreditCardSchema), async (c) => {
  const userId = c.get('userId')
  const input = c.req.valid('json')

  const { createCreditCard } = createCreditCardsDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const creditCard = await createCreditCard.execute(userId, input)

  return success(c, creditCard, HTTP_STATUS.CREATED)
})

creditCardsController.patch('/:id', sValidator('json', updateCreditCardSchema), async (c) => {
  const userId = c.get('userId')
  const creditCardId = c.req.param('id')
  const input = c.req.valid('json')

  const { updateCreditCard } = createCreditCardsDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const creditCard = await updateCreditCard.execute(userId, creditCardId, input)

  return success(c, creditCard, HTTP_STATUS.OK)
})

creditCardsController.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const creditCardId = c.req.param('id')

  const { deleteCreditCard } = createCreditCardsDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  await deleteCreditCard.execute(userId, creditCardId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { creditCardsController }
