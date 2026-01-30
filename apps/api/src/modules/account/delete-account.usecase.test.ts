import { ERROR_CODES, HTTP_STATUS } from '@plim/shared'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppError } from '../../middleware/error-handler.middleware'
import { DeleteAccountUseCase } from './delete-account.usecase'

describe('DeleteAccountUseCase', () => {
  let sut: DeleteAccountUseCase
  let mockUserSupabase: {
    auth: {
      signInWithPassword: ReturnType<typeof vi.fn>
    }
  }
  let mockAdminSupabase: {
    auth: {
      admin: {
        getUserById: ReturnType<typeof vi.fn>
        deleteUser: ReturnType<typeof vi.fn>
      }
    }
  }

  beforeEach(() => {
    mockUserSupabase = {
      auth: {
        signInWithPassword: vi.fn(),
      },
    }
    mockAdminSupabase = {
      auth: {
        admin: {
          getUserById: vi.fn(),
          deleteUser: vi.fn(),
        },
      },
    }
    sut = new DeleteAccountUseCase(mockUserSupabase as never, mockAdminSupabase as never)
  })

  it('deletes account for email user with correct password', async () => {
    mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { identities: [{ provider: 'email' }] } },
      error: null,
    })
    mockUserSupabase.auth.signInWithPassword.mockResolvedValue({ error: null })
    mockAdminSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

    await sut.execute('user-123', 'test@example.com', 'password123')

    expect(mockUserSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
    expect(mockAdminSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-123')
  })

  it('deletes account for social login user without password', async () => {
    mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { identities: [{ provider: 'google' }] } },
      error: null,
    })
    mockAdminSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

    await sut.execute('user-123', 'test@example.com')

    expect(mockUserSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    expect(mockAdminSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-123')
  })

  it('throws VALIDATION_ERROR when password missing for email user', async () => {
    mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { identities: [{ provider: 'email' }] } },
      error: null,
    })

    await expect(sut.execute('user-123', 'test@example.com')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'test@example.com')).rejects.toMatchObject({
      code: ERROR_CODES.VALIDATION_ERROR,
      status: HTTP_STATUS.BAD_REQUEST,
    })
  })

  it('throws UNAUTHORIZED when password is incorrect', async () => {
    mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { identities: [{ provider: 'email' }] } },
      error: null,
    })
    mockUserSupabase.auth.signInWithPassword.mockResolvedValue({
      error: { message: 'Invalid credentials' },
    })

    await expect(sut.execute('user-123', 'test@example.com', 'wrongpassword')).rejects.toThrow(
      AppError
    )
    await expect(
      sut.execute('user-123', 'test@example.com', 'wrongpassword')
    ).rejects.toMatchObject({
      code: ERROR_CODES.UNAUTHORIZED,
      status: HTTP_STATUS.UNAUTHORIZED,
    })
  })

  it('throws INTERNAL_ERROR when deletion fails', async () => {
    mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { identities: [{ provider: 'google' }] } },
      error: null,
    })
    mockAdminSupabase.auth.admin.deleteUser.mockResolvedValue({
      error: { message: 'Delete failed' },
    })

    await expect(sut.execute('user-123', 'test@example.com')).rejects.toThrow(AppError)
    await expect(sut.execute('user-123', 'test@example.com')).rejects.toMatchObject({
      code: ERROR_CODES.INTERNAL_ERROR,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    })
  })

  it('treats user with no identities as social login (no password required)', async () => {
    mockAdminSupabase.auth.admin.getUserById.mockResolvedValue({
      data: { user: { identities: [] } },
      error: null,
    })
    mockAdminSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

    await sut.execute('user-123', 'test@example.com')

    expect(mockUserSupabase.auth.signInWithPassword).not.toHaveBeenCalled()
    expect(mockAdminSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('user-123')
  })
})
