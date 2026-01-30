import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type ExportableTable, accountService } from './account.service'

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
  },
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()
vi.stubGlobal('URL', {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
})

import { supabase } from '@/lib/supabase'

describe('accountService', () => {
  const mockToken = 'test-access-token'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: mockToken } },
      error: null,
    } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('exportData', () => {
    const tables: ExportableTable[] = [
      'profile',
      'expenses',
      'categories',
      'credit-cards',
      'salary-history',
    ]

    it.each(tables)('exports %s table successfully', async (table) => {
      const mockBlob = new Blob(['csv,data'], { type: 'text/csv' })
      const mockElement = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockElement as unknown as HTMLElement)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement as never)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement as never)

      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({
          'Content-Disposition': `attachment; filename="plim-${table}-2026-01-30.csv"`,
        }),
      })

      const result = await accountService.exportData(table)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(`/api/v1/account/export/${table}`),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      )
      expect(result).toEqual({ success: true })
      expect(mockElement.click).toHaveBeenCalled()
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
    })

    it('uses fallback filename when Content-Disposition is missing', async () => {
      const mockBlob = new Blob(['data'], { type: 'text/csv' })
      const mockElement = {
        href: '',
        download: '',
        click: vi.fn(),
      }
      vi.spyOn(document, 'createElement').mockReturnValue(mockElement as unknown as HTMLElement)
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement as never)
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement as never)

      mockFetch.mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
        headers: new Headers({}),
      })

      await accountService.exportData('expenses')

      expect(mockElement.download).toBe('plim-expenses.csv')
    })

    it('returns error when not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      const result = await accountService.exportData('expenses')

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toEqual({ success: false, error: 'Não autenticado' })
    })

    it('returns rate limit error on 429', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
      })

      const result = await accountService.exportData('expenses')

      expect(result).toEqual({
        success: false,
        error: 'Você já exportou esses dados esta semana',
      })
    })

    it('returns error message from response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: { message: 'Server error' } }),
      })

      const result = await accountService.exportData('expenses')

      expect(result).toEqual({ success: false, error: 'Server error' })
    })

    it('returns generic error when response has no error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('No body')),
      })

      const result = await accountService.exportData('expenses')

      expect(result).toEqual({ success: false, error: 'Erro ao exportar dados' })
    })
  })

  describe('deleteAccount', () => {
    it('deletes account without password', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      })

      const result = await accountService.deleteAccount()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/account'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify({}),
        })
      )
      expect(result).toEqual({ success: true })
    })

    it('deletes account with password confirmation', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
      })

      const result = await accountService.deleteAccount('mypassword123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/account'),
        expect.objectContaining({
          body: JSON.stringify({ password: 'mypassword123' }),
        })
      )
      expect(result).toEqual({ success: true })
    })

    it('returns error when not authenticated', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      const result = await accountService.deleteAccount()

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toEqual({ success: false, error: 'Não autenticado' })
    })

    it('returns error message from response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { message: 'Invalid password' } }),
      })

      const result = await accountService.deleteAccount('wrongpassword')

      expect(result).toEqual({ success: false, error: 'Invalid password' })
    })

    it('returns generic error when response has no error message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('No body')),
      })

      const result = await accountService.deleteAccount()

      expect(result).toEqual({ success: false, error: 'Erro ao excluir conta' })
    })
  })
})
