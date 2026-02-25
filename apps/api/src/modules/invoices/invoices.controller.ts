import { sValidator } from '@hono/standard-validator'
import { HTTP_STATUS, payInvoiceSchema } from '@plim/shared'
import { Hono } from 'hono'
import { checkProFeature } from '../../lib/check-pro-feature'
import type { Bindings } from '../../lib/env'
import { success } from '../../lib/responses'
import type { AuthVariables } from '../../middleware/auth.middleware'
import { createInvoicesDependencies } from './invoices.factory'

type InvoicesEnv = {
  Bindings: Bindings
  Variables: AuthVariables
}

const invoicesController = new Hono<InvoicesEnv>()

invoicesController.get('/:creditCardId/limit-usage', async (c) => {
  const userId = c.get('userId')
  const creditCardId = c.req.param('creditCardId')

  const { getCreditCardLimitUsage } = createInvoicesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  const limitUsage = await getCreditCardLimitUsage.execute(userId, creditCardId)

  return success(c, limitUsage, HTTP_STATUS.OK)
})

invoicesController.get('/:creditCardId/:referenceMonth', async (c) => {
  const userId = c.get('userId')
  const creditCardId = c.req.param('creditCardId')
  const referenceMonth = c.req.param('referenceMonth')

  const { supabase, getOrCreateInvoice } = createInvoicesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  await checkProFeature(supabase, userId, 'invoices')

  const result = await getOrCreateInvoice.execute(userId, creditCardId, referenceMonth)

  return success(c, result, HTTP_STATUS.OK)
})

invoicesController.get('/:creditCardId', async (c) => {
  const userId = c.get('userId')
  const creditCardId = c.req.param('creditCardId')

  const { supabase, invoicesRepository } = createInvoicesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  await checkProFeature(supabase, userId, 'invoices')

  const invoices = await invoicesRepository.findByCard(creditCardId, userId)

  return success(c, invoices, HTTP_STATUS.OK)
})

invoicesController.post('/:invoiceId/pay', sValidator('json', payInvoiceSchema), async (c) => {
  const userId = c.get('userId')
  const invoiceId = c.req.param('invoiceId')
  const input = c.req.valid('json')

  const { supabase, payInvoice } = createInvoicesDependencies({
    env: c.env,
    accessToken: c.get('accessToken'),
  })

  await checkProFeature(supabase, userId, 'invoices')

  const invoice = await payInvoice.execute(userId, invoiceId, input.amount_cents)

  return success(c, invoice, HTTP_STATUS.OK)
})

export { invoicesController }
