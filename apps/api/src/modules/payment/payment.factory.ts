import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type Bindings,
  createSupabaseAdminClient,
  createSupabaseClientWithAuth,
} from '../../lib/env'
import { CancelSubscriptionUseCase } from './cancel-subscription.usecase'
import { MercadoPagoClient } from './client/mercado-pago-client'
import { CreateCardSubscriptionUseCase } from './create-card-subscription.usecase'
import { CreatePixPaymentUseCase } from './create-pix-payment.usecase'
import { GetSubscriptionStatusUseCase } from './get-subscription-status.usecase'
import { HandleWebhookUseCase } from './handle-webhook.usecase'
import { PaymentRepository } from './payment.repository'

export interface PaymentDependencies {
  repository: PaymentRepository
  mpClient: MercadoPagoClient
  supabase: SupabaseClient
  createPixPayment: CreatePixPaymentUseCase
  createCardSubscription: CreateCardSubscriptionUseCase
  getSubscriptionStatus: GetSubscriptionStatusUseCase
  cancelSubscription: CancelSubscriptionUseCase
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
    createPixPayment: new CreatePixPaymentUseCase(repository, mpClient),
    createCardSubscription: new CreateCardSubscriptionUseCase(repository, mpClient),
    getSubscriptionStatus: new GetSubscriptionStatusUseCase(repository),
    cancelSubscription: new CancelSubscriptionUseCase(repository, mpClient),
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
