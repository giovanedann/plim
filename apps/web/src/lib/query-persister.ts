import type { Persister } from '@tanstack/react-query-persist-client'
import { del, get, set } from 'idb-keyval'

const CACHE_KEY = 'plim-react-query-cache'

export const idbPersister: Persister = {
  persistClient: async (client) => {
    await set(CACHE_KEY, client)
  },
  restoreClient: async () => {
    return await get(CACHE_KEY)
  },
  removeClient: async () => {
    await del(CACHE_KEY)
  },
}
