import type { SupabaseClient } from '@supabase/supabase-js'
import { type Bindings, createSupabaseClientWithAuth } from '../../lib/env'
import { CreateExpenseUseCase } from '../expenses/create-expense.usecase'
import { ExpensesRepository } from '../expenses/expenses.repository'
import { AIRepository } from './ai.repository'
import { ChatUseCase } from './chat.usecase'
import { CheckUsageLimitUseCase } from './check-usage-limit.usecase'
import { type AIClient, GeminiClient } from './client'
import { GetUsageInfoUseCase } from './get-usage-info.usecase'

export interface AIDependencies {
  repository: AIRepository
  aiClient: AIClient
  supabase: SupabaseClient
  checkUsageLimit: CheckUsageLimitUseCase
  getUsageInfo: GetUsageInfoUseCase
  chat: ChatUseCase
}

interface CreateDependenciesOptions {
  env: Bindings
  accessToken: string
}

export function createAIDependencies(options: CreateDependenciesOptions): AIDependencies {
  const supabase = createSupabaseClientWithAuth(options.env, options.accessToken)
  const repository = new AIRepository(supabase)

  const geminiApiKey = options.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const aiClient = new GeminiClient(geminiApiKey)

  const expensesRepository = new ExpensesRepository(supabase)
  const createExpenseUseCase = new CreateExpenseUseCase(expensesRepository)

  const chatUseCase = new ChatUseCase({
    aiClient,
    aiRepository: repository,
    supabase,
    createExpenseUseCase,
    expensesRepository,
  })

  return {
    repository,
    aiClient,
    supabase,
    checkUsageLimit: new CheckUsageLimitUseCase(repository),
    getUsageInfo: new GetUsageInfoUseCase(repository),
    chat: chatUseCase,
  }
}
