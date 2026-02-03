import type { Category, CreditCard } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateExpenseUseCase } from '../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../expenses/expenses.repository'
import type { AIRepository } from './ai.repository'
import type { AIClient, ChatMessage } from './client'
import { type FunctionExecutionResult, aiFunctionDefinitions, executeFunction } from './functions'
import { buildSystemPrompt } from './system-prompt'

export interface ChatUseCaseInput {
  messages: ChatMessage[]
  requestType: 'text' | 'voice' | 'image'
}

export interface ChatUseCaseOutput {
  message: string
  action?: {
    type: 'expense_created' | 'query_result' | 'forecast_result' | 'help'
    data?: unknown
  }
  tokensUsed: number
}

export interface ChatUseCaseDependencies {
  aiClient: AIClient
  aiRepository: AIRepository
  supabase: SupabaseClient
  createExpenseUseCase: CreateExpenseUseCase
  expensesRepository: ExpensesRepository
}

export class ChatUseCase {
  constructor(private deps: ChatUseCaseDependencies) {}

  async execute(userId: string, input: ChatUseCaseInput): Promise<ChatUseCaseOutput> {
    const context = await this.buildUserContext(userId)
    const systemPrompt = buildSystemPrompt(context)

    const response = await this.deps.aiClient.chat({
      messages: input.messages,
      systemPrompt,
      functions: aiFunctionDefinitions,
    })

    if (response.functionCall) {
      const result = await executeFunction(response.functionCall, {
        userId,
        supabase: this.deps.supabase,
        createExpenseUseCase: this.deps.createExpenseUseCase,
        expensesRepository: this.deps.expensesRepository,
      })

      await this.deps.aiRepository.logUsage(
        userId,
        input.requestType,
        response.functionCall.name,
        response.tokensUsed
      )

      return this.formatFunctionResult(result, response.tokensUsed)
    }

    await this.deps.aiRepository.logUsage(userId, input.requestType, 'chat', response.tokensUsed)

    return {
      message: response.text ?? 'Desculpe, não consegui processar sua mensagem.',
      tokensUsed: response.tokensUsed,
    }
  }

  private async buildUserContext(userId: string): Promise<{
    categories: Category[]
    creditCards: CreditCard[]
    currency: string
    locale: string
    currentDate: string
  }> {
    const [categoriesResult, creditCardsResult, profileResult] = await Promise.all([
      this.deps.supabase
        .from('category')
        .select('id, user_id, name, icon, color, is_active, created_at, updated_at')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .eq('is_active', true),
      this.deps.supabase
        .from('credit_card')
        .select(
          'id, user_id, name, color, flag, bank, last_4_digits, is_active, created_at, updated_at'
        )
        .eq('user_id', userId)
        .eq('is_active', true),
      this.deps.supabase.from('profile').select('currency, locale').eq('user_id', userId).single(),
    ])

    return {
      categories: (categoriesResult.data ?? []) as Category[],
      creditCards: (creditCardsResult.data ?? []) as CreditCard[],
      currency: profileResult.data?.currency ?? 'BRL',
      locale: profileResult.data?.locale ?? 'pt-BR',
      currentDate: new Date().toISOString().slice(0, 10),
    }
  }

  private formatFunctionResult(
    result: FunctionExecutionResult,
    tokensUsed: number
  ): ChatUseCaseOutput {
    if (!result.success) {
      return {
        message: result.message,
        tokensUsed,
      }
    }

    return {
      message: result.message,
      action: {
        type: result.actionType === 'error' ? 'help' : result.actionType,
        data: result.data,
      },
      tokensUsed,
    }
  }
}
