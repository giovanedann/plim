import {
  ERROR_CODES,
  HTTP_STATUS,
  type SalaryHistory,
  createMockSalaryHistory,
  resetIdCounter,
} from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { SalaryDependencies } from './salary.factory'
import { createSalaryRouterWithDeps } from './salary.routes'

// Mock use cases
const mockGetSalary = { execute: vi.fn() }
const mockListSalaryHistory = { execute: vi.fn() }
const mockCreateSalary = { execute: vi.fn() }

const mockDependencies = {
  repository: {},
  getSalary: mockGetSalary,
  listSalaryHistory: mockListSalaryHistory,
  createSalary: mockCreateSalary,
} as unknown as SalaryDependencies

describe('Salary Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()
    resetIdCounter()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createSalaryRouterWithDeps(mockDependencies)
    app.route('/salary', router)
  })

  describe('GET /salary?month=YYYY-MM', () => {
    it('returns salary for given month', async () => {
      const salary = createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 500000 })
      mockGetSalary.execute.mockResolvedValue(salary)

      const res = await app.request('/salary?month=2024-01')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: SalaryHistory }
      expect(body.data).toEqual(salary)
      expect(mockGetSalary.execute).toHaveBeenCalledWith(TEST_USER_ID, '2024-01')
    })

    it('returns null when salary not found', async () => {
      mockGetSalary.execute.mockResolvedValue(null)

      const res = await app.request('/salary?month=2024-01')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: SalaryHistory | null }
      expect(body.data).toBeNull()
    })

    it('handles database errors', async () => {
      mockGetSalary.execute.mockRejectedValue(
        new AppError(
          ERROR_CODES.INTERNAL_ERROR,
          'Database error',
          HTTP_STATUS.INTERNAL_SERVER_ERROR
        )
      )

      const res = await app.request('/salary?month=2024-01')

      expect(res.status).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR)
    })
  })

  describe('GET /salary/history', () => {
    it('returns salary history list', async () => {
      const history = [
        createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 500000 }),
        createMockSalaryHistory({ effective_from: '2024-02-01', amount_cents: 520000 }),
      ]
      mockListSalaryHistory.execute.mockResolvedValue(history)

      const res = await app.request('/salary/history')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: SalaryHistory[] }
      expect(body.data).toEqual(history)
      expect(body.data).toHaveLength(2)
      expect(mockListSalaryHistory.execute).toHaveBeenCalledWith(TEST_USER_ID)
    })

    it('returns empty array when no history exists', async () => {
      mockListSalaryHistory.execute.mockResolvedValue([])

      const res = await app.request('/salary/history')

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = (await res.json()) as { data: SalaryHistory[] }
      expect(body.data).toEqual([])
    })
  })

  describe('POST /salary', () => {
    it('creates salary with valid input', async () => {
      const salary = createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 500000 })
      mockCreateSalary.execute.mockResolvedValue(salary)

      const res = await app.request('/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effective_from: '2024-01-01',
          amount_cents: 500000,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: SalaryHistory }
      expect(body.data).toEqual(salary)
      expect(mockCreateSalary.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        expect.objectContaining({
          effective_from: '2024-01-01',
          amount_cents: 500000,
        })
      )
    })

    it('validates required fields', async () => {
      const res = await app.request('/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effective_from: '2024-01-01',
          // Missing amount_cents
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('validates effective_from format', async () => {
      const res = await app.request('/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effective_from: '2024/01/01', // Invalid format
          amount_cents: 500000,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('validates positive amount', async () => {
      const res = await app.request('/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effective_from: '2024-01-01',
          amount_cents: -100, // Negative amount
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('handles duplicate date errors', async () => {
      mockCreateSalary.execute.mockRejectedValue(
        new AppError(
          ERROR_CODES.ALREADY_EXISTS,
          'Salary already exists for this date',
          HTTP_STATUS.CONFLICT
        )
      )

      const res = await app.request('/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effective_from: '2024-01-01',
          amount_cents: 500000,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CONFLICT)
    })
  })

  describe('Boundary cases', () => {
    it('handles very high salary amount', async () => {
      const highSalary = createMockSalaryHistory({
        effective_from: '2024-01-01',
        amount_cents: 999999999,
      })
      mockCreateSalary.execute.mockResolvedValue(highSalary)

      const res = await app.request('/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effective_from: '2024-01-01',
          amount_cents: 999999999,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: SalaryHistory }
      expect(body.data.amount_cents).toBe(999999999)
    })

    it('handles minimum positive amount', async () => {
      const minSalary = createMockSalaryHistory({ effective_from: '2024-01-01', amount_cents: 1 })
      mockCreateSalary.execute.mockResolvedValue(minSalary)

      const res = await app.request('/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effective_from: '2024-01-01',
          amount_cents: 1,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
      const body = (await res.json()) as { data: SalaryHistory }
      expect(body.data.amount_cents).toBe(1)
    })

    it('handles far future date', async () => {
      const futureSalary = createMockSalaryHistory({ effective_from: '2099-12-31' })
      mockCreateSalary.execute.mockResolvedValue(futureSalary)

      const res = await app.request('/salary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          effective_from: '2099-12-31',
          amount_cents: 500000,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.CREATED)
    })
  })
})
