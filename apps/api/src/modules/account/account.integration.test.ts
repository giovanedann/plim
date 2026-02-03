import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { TEST_USER_ID, createIntegrationApp } from '../../test-utils/api-integration'
import type { AccountDependencies } from './account.factory'
import { createAccountRouterWithDeps } from './account.routes'

// Mock use cases
const mockExportData = { execute: vi.fn() }
const mockDeleteAccount = { execute: vi.fn() }

// Mock repository
const mockRepository = {
  getUserEmail: vi.fn(),
}

const mockDependencies = {
  repository: mockRepository,
  exportData: mockExportData,
  deleteAccount: mockDeleteAccount,
} as unknown as AccountDependencies

describe('Account Integration', () => {
  let app: ReturnType<typeof createIntegrationApp>

  beforeEach(() => {
    vi.clearAllMocks()

    app = createIntegrationApp(TEST_USER_ID)
    const router = createAccountRouterWithDeps(mockDependencies)
    app.route('/account', router)
  })

  describe('GET /account/export/:table - Data export', () => {
    it('exports expenses data as CSV', async () => {
      const csvData = 'id,description,amount_cents,date\n1,Test,1000,2024-01-01\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/expenses', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
      expect(res.headers.get('Content-Disposition')).toContain('attachment')
      expect(res.headers.get('Content-Disposition')).toContain('plim-despesas-')

      const body = await res.text()
      expect(body).toBe(csvData)
      expect(mockExportData.execute).toHaveBeenCalledWith(TEST_USER_ID, 'expenses')
    })

    it('exports categories data as CSV', async () => {
      const csvData = 'id,name,type\n1,Food,variable\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/categories', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(res.headers.get('Content-Disposition')).toContain('plim-categorias-')
      expect(mockExportData.execute).toHaveBeenCalledWith(TEST_USER_ID, 'categories')
    })

    it('exports profile data as CSV', async () => {
      const csvData = 'id,name,email\n1,Test User,test@example.com\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/profile', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(res.headers.get('Content-Disposition')).toContain('plim-perfil-')
      expect(mockExportData.execute).toHaveBeenCalledWith(TEST_USER_ID, 'profile')
    })

    it('exports credit cards data as CSV', async () => {
      const csvData = 'id,name,last_4_digits\n1,Visa,1234\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/credit-cards', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(res.headers.get('Content-Disposition')).toContain('plim-cartoes-')
      expect(mockExportData.execute).toHaveBeenCalledWith(TEST_USER_ID, 'credit-cards')
    })

    it('exports salary history data as CSV', async () => {
      const csvData = 'id,amount_cents,date\n1,500000,2024-01-01\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/salary-history', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      expect(res.headers.get('Content-Disposition')).toContain('plim-historico-salario-')
      expect(mockExportData.execute).toHaveBeenCalledWith(TEST_USER_ID, 'salary-history')
    })

    it('returns 400 for invalid table name', async () => {
      const res = await app.request('/account/export/invalid-table', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('includes date in filename', async () => {
      const csvData = 'id,name\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/expenses', {
        method: 'GET',
      })

      const disposition = res.headers.get('Content-Disposition')
      expect(disposition).toMatch(/plim-despesas-\d{4}-\d{2}-\d{2}\.csv/)
    })

    it('handles empty export data', async () => {
      const csvData = 'id,description,amount_cents\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/expenses', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = await res.text()
      expect(body).toBe(csvData)
    })

    it('enforces user isolation on export', async () => {
      const csvData = 'data'
      mockExportData.execute.mockResolvedValue(csvData)

      await app.request('/account/export/expenses', {
        method: 'GET',
      })

      expect(mockExportData.execute).toHaveBeenCalledWith(TEST_USER_ID, 'expenses')
    })
  })

  describe('DELETE /account - Account deletion', () => {
    it('deletes account with valid password', async () => {
      const userEmail = 'test@example.com'
      mockRepository.getUserEmail.mockResolvedValue(userEmail)
      mockDeleteAccount.execute.mockResolvedValue(undefined)

      const res = await app.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct-password',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockRepository.getUserEmail).toHaveBeenCalledWith(TEST_USER_ID)
      expect(mockDeleteAccount.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        userEmail,
        'correct-password'
      )
    })

    it('returns 400 for missing password', async () => {
      const res = await app.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('returns 401 for incorrect password', async () => {
      const userEmail = 'test@example.com'
      mockRepository.getUserEmail.mockResolvedValue(userEmail)
      mockDeleteAccount.execute.mockRejectedValue(
        new AppError(ERROR_CODES.UNAUTHORIZED, 'Senha incorreta', HTTP_STATUS.UNAUTHORIZED)
      )

      const res = await app.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'wrong-password',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it('requires user to be authenticated', async () => {
      // Create app without user ID to simulate unauthenticated request
      const unauthApp = createIntegrationApp(undefined as unknown as string)
      const router = createAccountRouterWithDeps(mockDependencies)
      unauthApp.route('/account', router)

      const res = await unauthApp.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'some-password',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED)
    })

    it('deletes all user data on account deletion', async () => {
      const userEmail = 'test@example.com'
      mockRepository.getUserEmail.mockResolvedValue(userEmail)
      mockDeleteAccount.execute.mockResolvedValue(undefined)

      const res = await app.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct-password',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockDeleteAccount.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        userEmail,
        'correct-password'
      )
    })
  })

  describe('Export and delete workflow', () => {
    it('allows user to export data before deletion', async () => {
      // First, export data
      const csvData = 'id,description\n1,Test expense\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const exportRes = await app.request('/account/export/expenses', {
        method: 'GET',
      })

      expect(exportRes.status).toBe(HTTP_STATUS.OK)
      const exportedData = await exportRes.text()
      expect(exportedData).toBe(csvData)

      // Then, delete account
      const userEmail = 'test@example.com'
      mockRepository.getUserEmail.mockResolvedValue(userEmail)
      mockDeleteAccount.execute.mockResolvedValue(undefined)

      const deleteRes = await app.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'correct-password',
        }),
      })

      expect(deleteRes.status).toBe(HTTP_STATUS.NO_CONTENT)
    })
  })

  describe('Boundary cases', () => {
    it('handles export with special characters in data', async () => {
      const csvData = 'id,description\n1,"Test, with comma"\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/expenses', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = await res.text()
      expect(body).toBe(csvData)
    })

    it('handles export with large dataset', async () => {
      // Simulate large CSV export
      let csvData = 'id,description,amount_cents\n'
      for (let i = 0; i < 1000; i++) {
        csvData += `${i},Expense ${i},${i * 100}\n`
      }

      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/expenses', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = await res.text()
      expect(body).toBe(csvData)
    })

    it('handles password with special characters', async () => {
      const userEmail = 'test@example.com'
      const specialPassword = 'p@ssw0rd!#$%'
      mockRepository.getUserEmail.mockResolvedValue(userEmail)
      mockDeleteAccount.execute.mockResolvedValue(undefined)

      const res = await app.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: specialPassword,
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.NO_CONTENT)
      expect(mockDeleteAccount.execute).toHaveBeenCalledWith(
        TEST_USER_ID,
        userEmail,
        specialPassword
      )
    })

    it('handles empty password string', async () => {
      const res = await app.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: '',
        }),
      })

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST)
    })

    it('handles export with only headers', async () => {
      const csvData = 'id,description,amount_cents\n'
      mockExportData.execute.mockResolvedValue(csvData)

      const res = await app.request('/account/export/expenses', {
        method: 'GET',
      })

      expect(res.status).toBe(HTTP_STATUS.OK)
      const body = await res.text()
      expect(body).toBe(csvData)
    })
  })

  describe('User isolation', () => {
    it('only exports data for authenticated user', async () => {
      const csvData = 'data'
      mockExportData.execute.mockResolvedValue(csvData)

      await app.request('/account/export/expenses', {
        method: 'GET',
      })

      // Verify the use case was called with the correct user ID
      expect(mockExportData.execute).toHaveBeenCalledWith(TEST_USER_ID, 'expenses')
    })

    it('only deletes data for authenticated user', async () => {
      const userEmail = 'test@example.com'
      mockRepository.getUserEmail.mockResolvedValue(userEmail)
      mockDeleteAccount.execute.mockResolvedValue(undefined)

      await app.request('/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: 'password',
        }),
      })

      // Verify the use case was called with the correct user ID
      expect(mockDeleteAccount.execute).toHaveBeenCalledWith(TEST_USER_ID, userEmail, 'password')
    })
  })
})
