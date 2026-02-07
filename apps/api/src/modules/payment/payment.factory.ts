import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type Bindings,
  createSupabaseAdminClient,
  createSupabaseClientWithAuth,
} from '../../lib/env'
import { MercadoPagoClient } from './client/mercado-pago-client'
import { CreatePixPaymentUseCase } from './create-pix-payment.usecase'
import { GetSubscriptionStatusUseCase } from './get-subscription-status.usecase'
import { HandleWebhookUseCase } from './handle-webhook.usecase'
import { PaymentRepository } from './payment.repository'

export interface PaymentDependencies {
  repository: PaymentRepository
  mpClient: MercadoPagoClient
  supabase: SupabaseClient
  createPixPayment: CreatePixPaymentUseCase
  getSubscriptionStatus: GetSubscriptionStatusUseCase
}

export interface WebhookDependencies {
  repository: PaymentRepository
  mpClient: MercadoPagoClient
  handleWebhook: HandleWebhookUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createPaymentDependencies(options: CreateDependenciesOptions): PaymentDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new PaymentRepository(supabase)
  const mpClient = new MercadoPagoClient(options.env.MERCADO_PAGO_ACCESS_TOKEN)

  return {
    repository,
    mpClient,
    supabase,
    createPixPayment: new CreatePixPaymentUseCase(repository, mpClient, {
      apiBaseUrl: options.env.API_BASE_URL,
    }),
    getSubscriptionStatus: new GetSubscriptionStatusUseCase(repository),
  }
}

export function createWebhookDependencies(env: Bindings): WebhookDependencies {
  const supabase = createSupabaseAdminClient(env)
  const repository = new PaymentRepository(supabase)
  const mpClient = new MercadoPagoClient(env.MERCADO_PAGO_ACCESS_TOKEN)

  return {
    repository,
    mpClient,
    handleWebhook: new HandleWebhookUseCase(repository, mpClient),
  }
}
