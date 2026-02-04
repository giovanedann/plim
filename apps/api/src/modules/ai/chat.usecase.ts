import type { Category, CreditCard } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateExpenseUseCase } from '../expenses/create-expense.usecase'
import type { ExpensesRepository } from '../expenses/expenses.repository'
import type { AIRepository } from './ai.repository'
import type { AIClient, ChatMessage, ChatOutput } from './client'
import { type FunctionExecutionResult, aiFunctionDefinitions, executeFunction } from './functions'
import { buildSystemPrompt } from './system-prompt'

interface UserContext {
  categories: Category[]
  creditCards: CreditCard[]
  currency: string
  locale: string
  currentDate: string
}

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
    // Extract text content for cache key
    const messageText = this.extractMessageText(input.messages)
    const cacheKey = this.deps.aiRepository.generateCacheKey(messageText)

    // Check cache first (only for text requests to avoid caching audio/image responses)
    if (input.requestType === 'text') {
      const cached = await this.deps.aiRepository.getCachedResponse(userId, cacheKey)
      if (cached) {
        // Log usage with 0 tokens (cache hit)
        await this.deps.aiRepository.logUsage(userId, input.requestType, 'cache_hit', 0)

        return {
          message: cached.response_message,
          action: cached.response_action ?? undefined,
          tokensUsed: 0,
        }
      }
    }

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

      // If query result with data, use AI to format the response
      let formattedMessage = result.message
      let formatTokens = 0

      if (result.success && result.data && result.actionType === 'query_result') {
        const formatResult = await this.formatResultWithAI(
          messageText,
          response.functionCall.name,
          result.data,
          context
        )
        formattedMessage = formatResult.text ?? result.message
        formatTokens = formatResult.tokensUsed
      }

      // Single logUsage call with combined tokens
      const totalTokens = response.tokensUsed + formatTokens
      await this.deps.aiRepository.logUsage(
        userId,
        input.requestType,
        response.functionCall.name,
        totalTokens
      )

      const output = this.formatFunctionResult(
        { ...result, message: formattedMessage },
        totalTokens
      )

      // Cache the response (won't cache expense_created)
      if (input.requestType === 'text') {
        await this.deps.aiRepository.setCachedResponse(
          userId,
          cacheKey,
          input.requestType,
          output.message,
          output.action ?? null,
          totalTokens
        )
      }

      return output
    }

    await this.deps.aiRepository.logUsage(userId, input.requestType, 'chat', response.tokensUsed)

    const output: ChatUseCaseOutput = {
      message: response.text ?? 'Desculpe, não consegui processar sua mensagem.',
      tokensUsed: response.tokensUsed,
    }

    // Cache text responses
    if (input.requestType === 'text') {
      await this.deps.aiRepository.setCachedResponse(
        userId,
        cacheKey,
        input.requestType,
        output.message,
        null,
        response.tokensUsed
      )
    }

    return output
  }

  private extractMessageText(messages: ChatMessage[]): string {
    const lastMessage = messages[messages.length - 1]
    if (!lastMessage) return ''

    const textParts = lastMessage.content
      .filter((part) => part.type === 'text')
      .map((part) => (part.type === 'text' ? part.text : ''))

    return textParts.join(' ')
  }

  private async formatResultWithAI(
    userQuestion: string,
    functionName: string,
    rawData: unknown,
    _context: UserContext
  ): Promise<ChatOutput> {
    const formatPrompt = `You are formatting query results for a Brazilian finance app user.

User asked: "${userQuestion}"
Function executed: ${functionName}
Raw data: ${JSON.stringify(rawData)}

Rules:
- Respond in Brazilian Portuguese
- Format currency as R$ with Brazilian format (R$ 1.234,56)
- Convert cents to reais (divide by 100)
- Be concise - use short sentences
- NO markdown formatting (no **bold**, no *italic*, no headers with #)
- Use line breaks to separate items for readability
- Use simple bullets with • for lists

Format this data as a natural response to the user's question.`

    return this.deps.aiClient.chat({
      messages: [{ role: 'user', content: [{ type: 'text', text: formatPrompt }] }],
      systemPrompt: '',
      functions: [],
    })
  }

  private async buildUserContext(userId: string): Promise<UserContext> {
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
