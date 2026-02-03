import { ERROR_CODES, HTTP_STATUS, createMockExpense } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { DeleteInstallmentGroupUseCase } from './delete-installment-group.usecase'
import type { ExpensesRepository } from './expenses.repository'

type MockRepository = {
  findByGroupId: ReturnType<typeof vi.fn>
  deleteByGroupId: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findByGroupId: vi.fn(),
    deleteByGroupId: vi.fn(),
  }
}

describe('DeleteInstallmentGroupUseCase', () => {
  let sut: DeleteInstallmentGroupUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new DeleteInstallmentGroupUseCase(mockRepository as unknown as ExpensesRepository)
  })

  it('deletes all expenses in installment group', async () => {
    const installmentExpenses = [
      createMockExpense({
        installment_group_id: 'group-1',
        installment_current: 1,
        installment_total: 12,
      }),
    ]
    mockRepository.findByGroupId.mockResolvedValue(installmentExpenses)
    mockRepository.deleteByGroupId.mockResolvedValue(true)

    await sut.execute('user-123', 'group-1')

    expect(mockRepository.deleteByGroupId).toHaveBeenCalledWith('group-1', 'user-123')
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

  it('throws INTERNAL_ERROR when deletion fails', async () => {
    const installmentExpenses = [
      createMockExpense({
        installment_group_id: 'group-1',
        installment_current: 1,
        installment_total: 12,
      }),
    ]
    mockRepository.findByGroupId.mockResolvedValue(installmentExpenses)
    mockRepository.deleteByGroupId.mockResolvedValue(false)

    await expect(sut.execute('user-123', 'group-1')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'group-1')).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  describe('boundary cases', () => {
    it('deletes single installment group', async () => {
      const singleInstallment = [
        createMockExpense({
          installment_group_id: 'group-1',
          installment_current: 1,
          installment_total: 1,
        }),
      ]
      mockRepository.findByGroupId.mockResolvedValue(singleInstallment)
      mockRepository.deleteByGroupId.mockResolvedValue(true)

      await sut.execute('user-123', 'group-1')

      expect(mockRepository.deleteByGroupId).toHaveBeenCalledWith('group-1', 'user-123')
    })

    it('deletes large installment group (24 months)', async () => {
      const largeGroup = Array.from({ length: 24 }, (_, i) =>
        createMockExpense({
          installment_group_id: 'group-1',
          installment_current: i + 1,
          installment_total: 24,
        })
      )
      mockRepository.findByGroupId.mockResolvedValue(largeGroup)
      mockRepository.deleteByGroupId.mockResolvedValue(true)

      await sut.execute('user-123', 'group-1')

      expect(mockRepository.deleteByGroupId).toHaveBeenCalledWith('group-1', 'user-123')
    })

    it('handles incomplete installment group deletion', async () => {
      const incompleteGroup = [
        createMockExpense({
          installment_group_id: 'group-1',
          installment_current: 1,
          installment_total: 12,
        }),
        createMockExpense({
          installment_group_id: 'group-1',
          installment_current: 8,
          installment_total: 12,
        }),
      ]
      mockRepository.findByGroupId.mockResolvedValue(incompleteGroup)
      mockRepository.deleteByGroupId.mockResolvedValue(true)

      await sut.execute('user-123', 'group-1')

      expect(mockRepository.deleteByGroupId).toHaveBeenCalledWith('group-1', 'user-123')
    })
  })
})
