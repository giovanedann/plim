import type { ExpenseType, PaymentMethod } from '../schemas'

export { PLAN_LIMITS } from './limits'
export type { PlanTier, TierLimits } from './limits'

export interface PaymentMethodOption {
  value: PaymentMethod
  label: string
}

export interface ExpenseTypeOption {
  value: ExpenseType
  label: string
  description: string
}

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  { value: 'credit_card', label: 'Cartão de Crédito' },
  { value: 'debit_card', label: 'Cartão de Débito' },
  { value: 'pix', label: 'Pix' },
  { value: 'cash', label: 'Dinheiro' },
] as const

export const EXPENSE_TYPES: readonly ExpenseTypeOption[] = [
  { value: 'one_time', label: 'Única', description: 'Despesa pontual' },
  { value: 'recurrent', label: 'Recorrente', description: 'Repete todo mês' },
  { value: 'installment', label: 'Parcelada', description: 'Dividida em parcelas' },
] as const
