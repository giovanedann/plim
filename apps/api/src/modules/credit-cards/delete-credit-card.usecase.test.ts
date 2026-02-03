import { ERROR_CODES, HTTP_STATUS, createMockCreditCard } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from './credit-cards.repository'
import { DeleteCreditCardUseCase } from './delete-credit-card.usecase'

type MockRepository = Pick<CreditCardsRepository, 'findById' | 'softDelete'>

function createMockRepository(): MockRepository {
  return {
    findById: vi.fn(),
    softDelete: vi.fn(),
  }
}

describe('DeleteCreditCardUseCase', () => {
  let sut: DeleteCreditCardUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new DeleteCreditCardUseCase(mockRepository as CreditCardsRepository)
  })

  it('deletes credit card successfully', async () => {
    const creditCard = createMockCreditCard({ id: 'card-123', user_id: 'user-123' })
    mockRepository.findById = vi.fn().mockResolvedValue(creditCard)
    mockRepository.softDelete = vi.fn().mockResolvedValue(true)

    await sut.execute('user-123', 'card-123')
  })

  it('throws NOT_FOUND when credit card does not exist', async () => {
    mockRepository.findById = vi.fn().mockResolvedValue(null)

    await expect(sut.execute('user-123', 'nonexistent')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'nonexistent')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws NOT_FOUND when credit card belongs to different user', async () => {
    mockRepository.findById = vi.fn().mockResolvedValue(null)

    await expect(sut.execute('other-user', 'card-123')).rejects.toThrow(AppError)
    await expect(sut.execute('other-user', 'card-123')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws INTERNAL_ERROR when deletion fails', async () => {
    const creditCard = createMockCreditCard()
    mockRepository.findById = vi.fn().mockResolvedValue(creditCard)
    mockRepository.softDelete = vi.fn().mockResolvedValue(false)

    await expect(sut.execute('user-123', 'card-123')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'card-123')).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
