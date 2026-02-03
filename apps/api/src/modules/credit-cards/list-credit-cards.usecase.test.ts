import { createMockCreditCard } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreditCardsRepository } from './credit-cards.repository'
import { ListCreditCardsUseCase } from './list-credit-cards.usecase'

type MockRepository = {
  findByUserId: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return {
    findByUserId: vi.fn(),
  }
}

describe('ListCreditCardsUseCase', () => {
  let sut: ListCreditCardsUseCase
  let mockRepository: MockRepository

  beforeEach(() => {
    mockRepository = createMockRepository()
    sut = new ListCreditCardsUseCase(mockRepository as unknown as CreditCardsRepository)
  })

  it('returns list of credit cards for user', async () => {
    const creditCards = [
      createMockCreditCard({ name: 'Nubank Ultravioleta', flag: 'mastercard', bank: 'nubank' }),
      createMockCreditCard({ name: 'Inter Black', flag: 'mastercard', bank: 'inter' }),
    ]
    mockRepository.findByUserId.mockResolvedValue(creditCards)

    const result = await sut.execute('user-123')

    expect(result).toEqual(creditCards)
  })

  it('returns empty array when user has no credit cards', async () => {
    mockRepository.findByUserId.mockResolvedValue([])

    const result = await sut.execute('user-456')

    expect(result).toEqual([])
  })

  describe('boundary cases', () => {
    it('handles single credit card', async () => {
      const creditCards = [createMockCreditCard({ name: 'Single Card' })]
      mockRepository.findByUserId.mockResolvedValue(creditCards)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(1)
      expect(result[0]?.name).toBe('Single Card')
    })

    it('handles large list of credit cards', async () => {
      const creditCards = Array.from({ length: 20 }, (_, i) =>
        createMockCreditCard({ name: `Card ${i}`, last_4_digits: String(i).padStart(4, '0') })
      )
      mockRepository.findByUserId.mockResolvedValue(creditCards)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(20)
    })

    it('handles mix of active and inactive cards', async () => {
      const creditCards = [
        createMockCreditCard({ name: 'Active Card', is_active: true }),
        createMockCreditCard({ name: 'Inactive Card', is_active: false }),
      ]
      mockRepository.findByUserId.mockResolvedValue(creditCards)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(2)
      expect(result.find((c) => c.name === 'Active Card')?.is_active).toBe(true)
      expect(result.find((c) => c.name === 'Inactive Card')?.is_active).toBe(false)
    })

    it('handles cards from different banks and flags', async () => {
      const creditCards = [
        createMockCreditCard({ bank: 'nubank', flag: 'mastercard' }),
        createMockCreditCard({ bank: 'inter', flag: 'visa' }),
        createMockCreditCard({ bank: 'itau', flag: 'elo' }),
      ]
      mockRepository.findByUserId.mockResolvedValue(creditCards)

      const result = await sut.execute('user-123')

      expect(result).toHaveLength(3)
      expect(new Set(result.map((c) => c.bank)).size).toBe(3)
      expect(new Set(result.map((c) => c.flag)).size).toBe(3)
    })
  })
})
