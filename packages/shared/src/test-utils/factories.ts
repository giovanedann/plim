import type { Category } from '../schemas/category'
import type { CreditCard } from '../schemas/credit-card'
import type { Expense } from '../schemas/expense'
import type { Profile } from '../schemas/profile'
import type { SalaryHistory } from '../schemas/salary'

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
    user_id: 'user-00000000-0000-0000-0000-000000000001',
    category_id: 'cat-00000000-0000-0000-0000-000000000001',
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
    credit_card_id: null,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: generateId(),
    user_id: 'user-00000000-0000-0000-0000-000000000001',
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
    user_id: 'user-00000000-0000-0000-0000-000000000001',
    name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    currency: 'BRL',
    locale: 'pt-BR',
    is_onboarded: true,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockCreditCard(overrides: Partial<CreditCard> = {}): CreditCard {
  return {
    id: generateId(),
    user_id: 'user-00000000-0000-0000-0000-000000000001',
    name: 'Test Card',
    color: 'black',
    flag: 'visa',
    bank: 'nubank',
    last_4_digits: '1234',
    is_active: true,
    created_at: getTimestamp(),
    updated_at: getTimestamp(),
    ...overrides,
  }
}

export function createMockSalaryHistory(overrides: Partial<SalaryHistory> = {}): SalaryHistory {
  return {
    id: generateId(),
    user_id: 'user-00000000-0000-0000-0000-000000000001',
    amount_cents: 500000,
    effective_from: '2026-01-01',
    created_at: getTimestamp(),
    ...overrides,
  }
}

export function resetIdCounter(): void {
  idCounter = 0
}
