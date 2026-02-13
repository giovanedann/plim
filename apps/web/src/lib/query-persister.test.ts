import type { PersistedClient } from '@tanstack/react-query-persist-client'
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
}))

describe('idbPersister', () => {
  let mockGet: Mock
  let mockSet: Mock
  let mockDel: Mock

  beforeEach(async () => {
    vi.clearAllMocks()
    const idbKeyval = await import('idb-keyval')
    mockGet = idbKeyval.get as Mock
    mockSet = idbKeyval.set as Mock
    mockDel = idbKeyval.del as Mock
  })

  describe('persistClient', () => {
    it('calls set with the correct key and client data', async () => {
      const { idbPersister } = await import('./query-persister')
      const sut = idbPersister.persistClient
      const mockClient = {
        timestamp: Date.now(),
        buster: '',
        clientState: {},
      } as unknown as PersistedClient

      await sut(mockClient)

      expect(mockSet).toHaveBeenCalledWith('plim-react-query-cache', mockClient)
    })

    it('calls set exactly once per invocation', async () => {
      const { idbPersister } = await import('./query-persister')
      const sut = idbPersister.persistClient
      const mockClient = {
        timestamp: Date.now(),
        buster: '',
        clientState: {},
      } as unknown as PersistedClient

      await sut(mockClient)

      expect(mockSet).toHaveBeenCalledTimes(1)
    })
  })

  describe('restoreClient', () => {
    it('calls get with the correct key and returns stored client', async () => {
      const { idbPersister } = await import('./query-persister')
      const sut = idbPersister.restoreClient
      const storedClient = {
        timestamp: Date.now(),
        buster: '',
        clientState: {},
      } as unknown as PersistedClient
      mockGet.mockResolvedValueOnce(storedClient)

      const result = await sut()

      expect(mockGet).toHaveBeenCalledWith('plim-react-query-cache')
      expect(result).toEqual(storedClient)
    })

    it('returns undefined when no data exists', async () => {
      const { idbPersister } = await import('./query-persister')
      const sut = idbPersister.restoreClient
      mockGet.mockResolvedValueOnce(undefined)

      const result = await sut()

      expect(result).toBeUndefined()
    })
  })

  describe('removeClient', () => {
    it('calls del with the correct key', async () => {
      const { idbPersister } = await import('./query-persister')
      const sut = idbPersister.removeClient

      await sut()

      expect(mockDel).toHaveBeenCalledWith('plim-react-query-cache')
    })

    it('calls del exactly once per invocation', async () => {
      const { idbPersister } = await import('./query-persister')
      const sut = idbPersister.removeClient

      await sut()

      expect(mockDel).toHaveBeenCalledTimes(1)
    })
  })
})
