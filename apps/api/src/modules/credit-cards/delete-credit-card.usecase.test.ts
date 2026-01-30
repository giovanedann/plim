import { type CreditCard, ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import type { CreditCardsRepository } from './credit-cards.repository'
import { DeleteCreditCardUseCase } from './delete-credit-card.usecase'

const existingCreditCard: CreditCard = {
  id: 'card-123',
  user_id: 'user-123',
  name: 'Nubank Ultravioleta',
  color: 'black',
  flag: 'mastercard',
  bank: 'nubank',
  last_4_digits: '1234',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

describe('DeleteCreditCardUseCase', () => {
  let sut: DeleteCreditCardUseCase
  let mockRepository: {
    findById: ReturnType<typeof vi.fn>
    softDelete: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockRepository = {
      findById: vi.fn(),
      softDelete: vi.fn(),
    }
    sut = new DeleteCreditCardUseCase(mockRepository as unknown as CreditCardsRepository)
  })

  it('deletes credit card successfully', async () => {
    mockRepository.findById.mockResolvedValue(existingCreditCard)
    mockRepository.softDelete.mockResolvedValue(true)

    await sut.execute('user-123', 'card-123')

    expect(mockRepository.findById).toHaveBeenCalledWith('card-123', 'user-123')
    expect(mockRepository.softDelete).toHaveBeenCalledWith('card-123', 'user-123')
  })

  it('throws NOT_FOUND when credit card does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(sut.execute('user-123', 'nonexistent')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'nonexistent')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws NOT_FOUND when credit card belongs to different user', async () => {
    mockRepository.findById.mockResolvedValue(null)

    await expect(sut.execute('other-user', 'card-123')).rejects.toThrow(AppError)
    await expect(sut.execute('other-user', 'card-123')).rejects.toMatchObject({
      code: ERROR_CODES.NOT_FOUND,
      status: HTTP_STATUS.NOT_FOUND,
    })
  })

  it('throws INTERNAL_ERROR when deletion fails', async () => {
    mockRepository.findById.mockResolvedValue(existingCreditCard)
    mockRepository.softDelete.mockResolvedValue(false)

    await expect(sut.execute('user-123', 'card-123')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'card-123')).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })
})
