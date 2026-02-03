import { vi } from 'vitest'

export const supabase = {
  auth: {
    getSession: vi.fn().mockResolvedValue({
      data: {
        session: {
          access_token: 'mock-token-123',
          user: {
            id: 'user-00000000-0000-0000-0000-000000000001',
            email: 'test@example.com',
          },
        },
      },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  },
}
