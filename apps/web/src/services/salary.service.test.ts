import { createErrorResponse, createSuccessResponse } from '@plim/shared'
import type { CreateSalary, SalaryHistory } from '@plim/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { salaryService } from './salary.service'

// Mock the api-client module
vi.mock('@/lib/api-client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

import { api } from '@/lib/api-client'

function createMockSalaryHistory(overrides: Partial<SalaryHistory> = {}): SalaryHistory {
  return {
    id: 'salary-123',
    user_id: 'user-123',
    amount_cents: 500000,
    effective_from: '2026-01-01',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('salaryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSalary', () => {
    it('calls correct endpoint with month parameter', async () => {
      const mockSalary = createMockSalaryHistory()
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockSalary))

      const result = await salaryService.getSalary('2026-01')

      expect(api.get).toHaveBeenCalledWith('/salary?month=2026-01')
      expect(result).toEqual({ data: mockSalary })
    })

    it('returns error response when no salary exists for month', async () => {
      const errorResponse = createErrorResponse('NOT_FOUND', 'No salary record for this month')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await salaryService.getSalary('2026-01')

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await salaryService.getSalary('2026-01')

      expect(result).toEqual(errorResponse)
    })

    it('handles different month formats', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(createMockSalaryHistory()))

      await salaryService.getSalary('2025-12')

      expect(api.get).toHaveBeenCalledWith('/salary?month=2025-12')
    })
  })

  describe('getSalaryHistory', () => {
    it('calls correct endpoint', async () => {
      const mockHistory = [
        createMockSalaryHistory({ id: 'salary-1', effective_from: '2026-01-01' }),
        createMockSalaryHistory({ id: 'salary-2', effective_from: '2025-06-01' }),
        createMockSalaryHistory({ id: 'salary-3', effective_from: '2025-01-01' }),
      ]
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse(mockHistory))

      const result = await salaryService.getSalaryHistory()

      expect(api.get).toHaveBeenCalledWith('/salary/history')
      expect(result).toEqual({ data: mockHistory })
    })

    it('returns empty array when no salary history exists', async () => {
      vi.mocked(api.get).mockResolvedValue(createSuccessResponse([]))

      const result = await salaryService.getSalaryHistory()

      expect(result).toEqual({ data: [] })
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.get).mockResolvedValue(errorResponse)

      const result = await salaryService.getSalaryHistory()

      expect(result).toEqual(errorResponse)
    })
  })

  describe('createSalary', () => {
    it('sends correct payload with amount and effective date', async () => {
      const input: CreateSalary = {
        amount_cents: 600000,
        effective_from: '2026-02-01',
      }
      const createdSalary = createMockSalaryHistory({
        amount_cents: 600000,
        effective_from: '2026-02-01',
      })
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createdSalary))

      const result = await salaryService.createSalary(input)

      expect(api.post).toHaveBeenCalledWith('/salary', input)
      expect(result).toEqual({ data: createdSalary })
    })

    it('returns error response on validation failure', async () => {
      const errorResponse = createErrorResponse('VALIDATION_ERROR', 'Amount must be non-negative')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await salaryService.createSalary({
        amount_cents: -100,
        effective_from: '2026-01-01',
      })

      expect(result).toEqual(errorResponse)
    })

    it('returns error response when not authenticated', async () => {
      const errorResponse = createErrorResponse('UNAUTHORIZED', 'Not authenticated')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await salaryService.createSalary({
        amount_cents: 500000,
        effective_from: '2026-01-01',
      })

      expect(result).toEqual(errorResponse)
    })

    it('handles zero amount', async () => {
      const input: CreateSalary = {
        amount_cents: 0,
        effective_from: '2026-01-01',
      }
      const createdSalary = createMockSalaryHistory({ amount_cents: 0 })
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createdSalary))

      const result = await salaryService.createSalary(input)

      expect(result).toEqual({ data: createdSalary })
    })
  })

  describe('createCurrentMonthSalary', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-03-15T12:00:00Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('creates salary with current month effective date', async () => {
      const createdSalary = createMockSalaryHistory({
        amount_cents: 550000,
        effective_from: '2026-03-01',
      })
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createdSalary))

      const result = await salaryService.createCurrentMonthSalary(550000)

      expect(api.post).toHaveBeenCalledWith('/salary', {
        amount_cents: 550000,
        effective_from: '2026-03-01',
      })
      expect(result).toEqual({ data: createdSalary })
    })

    it('pads single digit months with zero', async () => {
      vi.setSystemTime(new Date('2026-01-10T12:00:00Z'))
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createMockSalaryHistory()))

      await salaryService.createCurrentMonthSalary(500000)

      expect(api.post).toHaveBeenCalledWith('/salary', {
        amount_cents: 500000,
        effective_from: '2026-01-01',
      })
    })

    it('handles December correctly', async () => {
      vi.setSystemTime(new Date('2026-12-25T12:00:00Z'))
      vi.mocked(api.post).mockResolvedValue(createSuccessResponse(createMockSalaryHistory()))

      await salaryService.createCurrentMonthSalary(500000)

      expect(api.post).toHaveBeenCalledWith('/salary', {
        amount_cents: 500000,
        effective_from: '2026-12-01',
      })
    })

    it('returns error response on failure', async () => {
      const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to create salary')
      vi.mocked(api.post).mockResolvedValue(errorResponse)

      const result = await salaryService.createCurrentMonthSalary(500000)

      expect(result).toEqual(errorResponse)
    })
  })
})
