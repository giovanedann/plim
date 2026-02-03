import { ERROR_CODES, HTTP_STATUS, createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { ExpensesRepository } from './expenses.repository'
import { GetInstallmentGroupUseCase } from './get-installment-group.usecase'

type MockRepository = {
  findByGroupId: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findByGroupId: vi.fn(),
  }
}

describe('GetInstallmentGroupUseCase', () => {
  let sut: GetInstallmentGroupUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new GetInstallmentGroupUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('returns all expenses in installment group', async () => {
    const installmentExpenses = [
      createMockExpense({
        id: 'expense-1',
        description: 'Phone 1/12',
        amount_cents: 10000,
        installment_group_id: 'group-1',
        installment_current: 1,
        installment_total: 12,
        date: '2024-01-15',
      }),
      createMockExpense({
        id: 'expense-2',
        description: 'Phone 2/12',
        amount_cents: 10000,
        installment_group_id: 'group-1',
        installment_current: 2,
        installment_total: 12,
        date: '2024-02-15',
      }),
    ]
    mockRepository.findByGroupId.mockResolvedValue(installmentExpenses)

    const result = await sut.execute('user-123', 'group-1')

    expect(result).toEqual(installmentExpenses)
    expect(result).toHaveLength(2)
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

  describe('boundary cases', () => {
    it('handles single installment in group', async () => {
      const singleInstallment = [
        createMockExpense({
          installment_group_id: 'group-1',
          installment_current: 1,
          installment_total: 1,
        }),
      ]
      mockRepository.findByGroupId.mockResolvedValue(singleInstallment)

      const result = await sut.execute('user-123', 'group-1')

      expect(result).toHaveLength(1)
      expect(result[0]!.installment_total).toBe(1)
    })

    it('handles large installment group (24 months)', async () => {
      const largeGroup = Array.from({ length: 24 }, (_, i) =>
        createMockExpense({
          installment_group_id: 'group-1',
          installment_current: i + 1,
          installment_total: 24,
        })
      )
      mockRepository.findByGroupId.mockResolvedValue(largeGroup)

      const result = await sut.execute('user-123', 'group-1')

      expect(result).toHaveLength(24)
      expect(result[0]!.installment_current).toBe(1)
      expect(result[23]!.installment_current).toBe(24)
    })

    it('handles incomplete installment group (missing installments)', async () => {
      const incompleteGroup = [
        createMockExpense({
          installment_group_id: 'group-1',
          installment_current: 1,
          installment_total: 12,
        }),
        createMockExpense({
          installment_group_id: 'group-1',
          installment_current: 5,
          installment_total: 12,
        }),
      ]
      mockRepository.findByGroupId.mockResolvedValue(incompleteGroup)

      const result = await sut.execute('user-123', 'group-1')

      expect(result).toHaveLength(2)
    })
  })
})
