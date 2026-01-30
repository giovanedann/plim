import { ERROR_CODES, type Expense, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'
import { GetInstallmentGroupUseCase } from './get-installment-group.usecase'

const installmentExpenses: Expense[] = [
  {
    id: 'expense-1',
    user_id: 'user-123',
    category_id: 'cat-1',
    description: 'Phone 1/12',
    amount_cents: 10000,
    date: '2024-01-15',
    payment_method: 'credit_card',
    is_recurrent: false,
    recurrence_day: null,
    recurrence_start: null,
    recurrence_end: null,
    installment_group_id: 'group-1',
    installment_current: 1,
    installment_total: 12,
    credit_card_id: 'card-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'expense-2',
    user_id: 'user-123',
    category_id: 'cat-1',
    description: 'Phone 2/12',
    amount_cents: 10000,
    date: '2024-02-15',
    payment_method: 'credit_card',
    is_recurrent: false,
    recurrence_day: null,
    recurrence_start: null,
    recurrence_end: null,
    installment_group_id: 'group-1',
    installment_current: 2,
    installment_total: 12,
    credit_card_id: 'card-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

describe('GetInstallmentGroupUseCase', () => {
  let sut: GetInstallmentGroupUseCase
  let mockRepository: {
    findByGroupId: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findByGroupId: vi.fn(),
    }
    sut = new GetInstallmentGroupUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('returns all expenses in installment group', async () => {
    mockRepository.findByGroupId.mockResolvedValue(installmentExpenses)

    const result = await sut.execute('user-123', 'group-1')

    expect(result).toEqual(installmentExpenses)
    expect(result).toHaveLength(2)
    expect(mockRepository.findByGroupId).toHaveBeenCalledWith('group-1', 'user-123')
  })

  it('throws NOT_FOUND when group does not exist', async () => {
    mockRepository.findByGroupId.mockResolvedValue([])

    await expect(sut.execute('user-123', 'nonexistent')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'nonexistent')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws NOT_FOUND when group belongs to different user', async () => {
    mockRepository.findByGroupId.mockResolvedValue([])

    await expect(sut.execute('other-user', 'group-1')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
    })
  })
})
