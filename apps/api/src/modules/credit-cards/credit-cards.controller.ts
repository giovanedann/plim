import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, createCreditCardSchema, updateCreditCardSchema } from '@plim/shared'
import { Hono } from 'hono'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { CreateCreditCardUseCase } from './create-credit-card.usecase'
import { CreditCardsRepository } from './credit-cards.repository'
import { DeleteCreditCardUseCase } from './delete-credit-card.usecase'
import { ListCreditCardsUseCase } from './list-credit-cards.usecase'
import { UpdateCreditCardUseCase } from './update-credit-card.usecase'

type CreditCardsEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const creditCardsController = new Hono<CreditCardsEnv>()

creditCardsController.get('/', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new CreditCardsRepository(supabase)
  const useCase = new ListCreditCardsUseCase(repository)

  const creditCards = await useCase.execute(userId)

  return success(c, creditCards, HTTP_STATUS.OK)
})

creditCardsController.post('/', sValidator('json', createCreditCardSchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new CreditCardsRepository(supabase)
  const useCase = new CreateCreditCardUseCase(repository)

  const creditCard = await useCase.execute(userId, input)

  return success(c, creditCard, HTTP_STATUS.CREATED)
})

creditCardsController.patch('/:id', sValidator('json', updateCreditCardSchema), async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const creditCardId = c.req.param('id')
  const input = c.req.valid('json')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new CreditCardsRepository(supabase)
  const useCase = new UpdateCreditCardUseCase(repository)

  const creditCard = await useCase.execute(userId, creditCardId, input)

  return success(c, creditCard, HTTP_STATUS.OK)
})

creditCardsController.delete('/:id', async (c) => {
  const userId = c.get('userId')
  const accessToken = c.get('accessToken')
  const creditCardId = c.req.param('id')

  const supabase = createSupabaseClientWithAuth(c.env, accessToken)
  const repository = new CreditCardsRepository(supabase)
  const useCase = new DeleteCreditCardUseCase(repository)

  await useCase.execute(userId, creditCardId)

  return c.body(null, HTTP_STATUS.NO_CONTENT)
})

export { creditCardsController }
