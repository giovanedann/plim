import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, isErrorResponse, isPaginatedResponse, isSuccessResponse } from './api-client'

// Mock the supabase module
vi.mock('./supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

// Mock the auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      setSession: vi.fn(),
    })),
  },
}))

// Mock global fetch
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

import { useAuthStore } from '@/stores/auth.store'
import { supabase } from './supabase'

describe('api-client', () => {
  const mockToken = 'test-access-token'
  const mockSetSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: { access_token: mockToken } },
      error: null,
    } as never)
    vi.mocked(useAuthStore.getState).mockReturnValue({ setSession: mockSetSession } as never)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('type guards', () => {
    describe('isErrorResponse', () => {
      it('returns true for error response', () => {
        const response = { error: { code: 'ERROR', message: 'Failed' } }
        expect(isErrorResponse(response)).toBe(true)
      })

      it('returns false for success response', () => {
        const response = { data: { id: '123' } }
        expect(isErrorResponse(response)).toBe(false)
      })

      it('returns false for paginated response', () => {
        const response = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }
        expect(isErrorResponse(response)).toBe(false)
      })
    })

    describe('isPaginatedResponse', () => {
      it('returns true for paginated response', () => {
        const response = { data: [], meta: { page: 1, limit: 10, total: 0, totalPages: 0 } }
        expect(isPaginatedResponse(response)).toBe(true)
      })

      it('returns false for error response', () => {
        const response = { error: { code: 'ERROR', message: 'Failed' } }
        expect(isPaginatedResponse(response)).toBe(false)
      })
    })

    describe('isSuccessResponse', () => {
      it('returns true for success response', () => {
        const response = { data: { id: '123' } }
        expect(isSuccessResponse(response)).toBe(true)
      })

      it('returns false for error response', () => {
        const response = { error: { code: 'ERROR', message: 'Failed' } }
        expect(isSuccessResponse(response)).toBe(false)
      })
    })
  })

  describe('api.get', () => {
    it('makes GET request with auth header', async () => {
      const mockData = { id: '123', name: 'Test' }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockData }),
      })

      const result = await api.get<typeof mockData>('/test-endpoint')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/test-endpoint'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      )
      expect(result).toEqual({ data: mockData })
    })

    it('returns UNAUTHORIZED error when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      const result = await api.get('/test-endpoint')

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      })
    })

    it('handles HTTP error response with error body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: { code: 'VALIDATION_ERROR', message: 'Bad input' } }),
      })

      const result = await api.get('/test-endpoint')

      expect(result).toEqual({
        error: { code: 'VALIDATION_ERROR', message: 'Bad input' },
      })
    })

    it('handles HTTP error response without body', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error('No body')),
      })

      const result = await api.get('/test-endpoint')

      expect(result).toEqual({
        error: { code: 'REQUEST_FAILED', message: 'Request failed with status 500' },
      })
    })

    it('clears auth state and signs out on 401', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }),
      })

      await api.get('/test-endpoint')

      expect(mockSetSession).toHaveBeenCalledWith(null)
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('api.getPaginated', () => {
    it('makes GET request and returns paginated response', async () => {
      const mockPaginatedResponse = {
        data: [{ id: '1' }, { id: '2' }],
        meta: { page: 1, limit: 10, total: 2, totalPages: 1 },
      }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockPaginatedResponse),
      })

      const result = await api.getPaginated<{ id: string }>('/items?page=1&limit=10')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/items?page=1&limit=10'),
        expect.objectContaining({ method: 'GET' })
      )
      expect(result).toEqual(mockPaginatedResponse)
    })

    it('returns UNAUTHORIZED error when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      const result = await api.getPaginated('/items')

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      })
    })

    it('handles 401 response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      })

      await api.getPaginated('/items')

      expect(mockSetSession).toHaveBeenCalledWith(null)
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('api.post', () => {
    it('makes POST request with body', async () => {
      const requestBody = { name: 'New Item', value: 100 }
      const responseData = { id: '123', ...requestBody }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: () => Promise.resolve({ data: responseData }),
      })

      const result = await api.post<typeof responseData>('/items', requestBody)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/items'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: `Bearer ${mockToken}`,
          }),
        })
      )
      expect(result).toEqual({ data: responseData })
    })

    it('returns UNAUTHORIZED error when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      const result = await api.post('/items', { name: 'Test' })

      expect(mockFetch).not.toHaveBeenCalled()
      expect(result).toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      })
    })

    it('handles validation error response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: () =>
          Promise.resolve({
            error: { code: 'VALIDATION_ERROR', message: 'Name is required' },
          }),
      })

      const result = await api.post('/items', {})

      expect(result).toEqual({
        error: { code: 'VALIDATION_ERROR', message: 'Name is required' },
      })
    })
  })

  describe('api.patch', () => {
    it('makes PATCH request with body', async () => {
      const requestBody = { name: 'Updated Name' }
      const responseData = { id: '123', name: 'Updated Name' }
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: responseData }),
      })

      const result = await api.patch<typeof responseData>('/items/123', requestBody)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/items/123'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(requestBody),
        })
      )
      expect(result).toEqual({ data: responseData })
    })

    it('returns UNAUTHORIZED error when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      const result = await api.patch('/items/123', { name: 'Test' })

      expect(result).toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      })
    })

    it('handles not found error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            error: { code: 'NOT_FOUND', message: 'Item not found' },
          }),
      })

      const result = await api.patch('/items/non-existent', { name: 'Test' })

      expect(result).toEqual({
        error: { code: 'NOT_FOUND', message: 'Item not found' },
      })
    })
  })

  describe('api.delete', () => {
    it('makes DELETE request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      })

      const result = await api.delete('/items/123')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/items/123'),
        expect.objectContaining({ method: 'DELETE' })
      )
      expect(result).toEqual({ data: null })
    })

    it('returns UNAUTHORIZED error when no session', async () => {
      vi.mocked(supabase.auth.getSession).mockResolvedValue({
        data: { session: null },
        error: null,
      } as never)

      const result = await api.delete('/items/123')

      expect(result).toEqual({
        error: { code: 'UNAUTHORIZED', message: 'Not authenticated' },
      })
    })

    it('handles not found error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            error: { code: 'NOT_FOUND', message: 'Item not found' },
          }),
      })

      const result = await api.delete('/items/non-existent')

      expect(result).toEqual({
        error: { code: 'NOT_FOUND', message: 'Item not found' },
      })
    })

    it('handles 401 and signs out', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: { code: 'UNAUTHORIZED', message: 'Expired' } }),
      })

      await api.delete('/items/123')

      expect(mockSetSession).toHaveBeenCalledWith(null)
      expect(supabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('auth header injection', () => {
    it('includes Bearer token in Authorization header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      })

      await api.get('/test')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-access-token',
          }),
        })
      )
    })

    it('fetches fresh token for each request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      })

      await api.get('/test1')
      await api.get('/test2')

      expect(supabase.auth.getSession).toHaveBeenCalledTimes(2)
    })
  })

  describe('204 No Content handling', () => {
    it('returns null data for 204 response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 204,
      })

      const result = await api.delete('/items/123')

      expect(result).toEqual({ data: null })
    })
  })

  describe('URL construction', () => {
    it('constructs full URL with API prefix', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: {} }),
      })

      await api.get('/expenses')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/api\/v1\/expenses$/),
        expect.any(Object)
      )
    })

    it('preserves query parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: [] }),
      })

      await api.get('/expenses?start_date=2026-01-01&end_date=2026-01-31')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('start_date=2026-01-01&end_date=2026-01-31'),
        expect.any(Object)
      )
    })
  })
})
