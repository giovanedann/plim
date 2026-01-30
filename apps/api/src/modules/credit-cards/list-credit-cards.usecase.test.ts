import type { CreditCard } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreditCardsRepository } from './credit-cards.repository'
import { ListCreditCardsUseCase } from './list-credit-cards.usecase'

const creditCards: CreditCard[] = [
  {
    id: 'card-1',
    user_id: 'user-123',
    name: 'Nubank Ultravioleta',
    color: 'black',
    flag: 'mastercard',
    bank: 'nubank',
    last_4_digits: '1234',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'card-2',
    user_id: 'user-123',
    name: 'Inter Black',
    color: 'black',
    flag: 'mastercard',
    bank: 'inter',
    last_4_digits: '5678',
    is_active: true,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
]

describe('ListCreditCardsUseCase', () => {
  let sut: ListCreditCardsUseCase
  let mockRepository: { findByUserId: ReturnType<typeof vi.fn> }

  beforeEach(() => {
    mockRepository = { findByUserId: vi.fn() }
    sut = new ListCreditCardsUseCase(mockRepository as unknown as CreditCardsRepository)
  })

  it('returns list of credit cards for user', async () => {
    mockRepository.findByUserId.mockResolvedValue(creditCards)

    const result = await sut.execute('user-123')

    expect(result).toEqual(creditCards)
    expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-123')
  })

  it('returns empty array when user has no credit cards', async () => {
    mockRepository.findByUserId.mockResolvedValue([])

    const result = await sut.execute('user-456')

    expect(result).toEqual([])
    expect(mockRepository.findByUserId).toHaveBeenCalledWith('user-456')
  })
})
