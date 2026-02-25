import type { AIChatResponse, AIUsageResponse } from '../schemas/ai'
import type { Category } from '../schemas/category'
import type { CreditCard } from '../schemas/credit-card'
import type { Expense } from '../schemas/expense'
import type { Invoice } from '../schemas/invoice'
import type { Profile } from '../schemas/profile'
import type { SalaryHistory } from '../schemas/salary'
import type { SpendingLimit } from '../schemas/spending-limit'

let idCounter = 0

function generateId(): string {
  idCounter++
  return `00000000-0000-0000-0000-${String(idCounter).padStart(12, '0')}`
}

function getTimestamp(): string {
  return '2026-01-15T12:00:00.000Z'
}

export function createMockExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: generateId(),
    user_id: '00000000-0000-4000-8000-000000000001',
    type: 'expense',
    category_id: '00000000-0000-4000-8000-000000000002',
    description: 'Test expense',
    amount_cents: 5000,
    payment_method: 'pix',
    date: '2026-01-15',
    is_recurrent: false,
    recurrence_day: null,
    recurrence_start: null,
    recurrence_end: null,
    installment_current: null,
    installment_total: null,
    installment_group_id: null,
    recurrent_group_id: null,
    credit_card_id: null,
    invoice_id: null,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: generateId(),
    user_id: '00000000-0000-4000-8000-000000000001',
    name: 'Test Category',
    icon: 'shopping-cart',
    color: '#3B82F6',
    is_active: true,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    user_id: '00000000-0000-4000-8000-000000000001',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    currency: 'BRL',
    locale: 'pt-BR',
    is_onboarded: true,
    referred_by: null,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockCreditCard(overrides: Partial<CreditCard> = {}): CreditCard {
  return {
    id: generateId(),
    user_id: '00000000-0000-4000-8000-000000000001',
    name: 'Test Card',
    color: 'black',
    flag: 'visa',
    bank: 'nubank',
    last_4_digits: '1234',
    expiration_day: null,
    closing_day: null,
    credit_limit_cents: null,
    is_active: true,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockSalaryHistory(overrides: Partial<SalaryHistory> = {}): SalaryHistory {
  return {
    id: generateId(),
    user_id: '00000000-0000-4000-8000-000000000001',
    amount_cents: 500000,
    effective_from: '2026-01-01',
    created_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockSpendingLimit(overrides: Partial<SpendingLimit> = {}): SpendingLimit {
  return {
    id: generateId(),
    user_id: '00000000-0000-4000-8000-000000000001',
    year_month: '2026-01',
    amount_cents: 300000,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    id: generateId(),
    user_id: '00000000-0000-4000-8000-000000000001',
    credit_card_id: '00000000-0000-4000-8000-000000000003',
    reference_month: '2026-01',
    cycle_start: '2025-12-10',
    cycle_end: '2026-01-09',
    total_amount_cents: 150000,
    paid_amount_cents: 0,
    carry_over_cents: 0,
    status: 'open',
    paid_at: null,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function resetIdCounter(): void {
  idCounter = 0
}

export function createMockAIUsageResponse(
  overrides: Partial<AIUsageResponse> = {}
): AIUsageResponse {
  return {
    tier: 'free',
    text: { used: 5, limit: 15, remaining: 10 },
    voice: { used: 1, limit: 2, remaining: 1 },
    image: { used: 0, limit: 3, remaining: 3 },
    used: 6,
    limit: 20,
    remainingRequests: 14,
    ...overrides,
  }
}

export function createMockAIChatResponse(overrides: Partial<AIChatResponse> = {}): AIChatResponse {
  return {
    message: 'Despesa criada: Almoço de R$35,00',
    action: undefined,
    usageInfo: createMockAIUsageResponse(),
    ...overrides,
  }
}

export interface ChatOutput {
  text: string | null
  functionCall: { name: string; args: Record<string, unknown> } | null
  tokensUsed: number
  inputTokens: number
  outputTokens: number
}

export function createMockChatOutput(overrides: Partial<ChatOutput> = {}): ChatOutput {
  return {
    text: 'AI response text',
    functionCall: null,
    tokensUsed: 150,
    inputTokens: 100,
    outputTokens: 50,
    ...overrides,
  }
}
