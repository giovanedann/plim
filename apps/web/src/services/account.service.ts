import { supabase } from '@/lib/supabase'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787'

export type ExportableTable =
  | 'profile'
  | 'expenses'
  | 'categories'
  | 'credit-cards'
  | 'salary-history'

interface ExportResult {
  success: boolean
  error?: string
}

async function getAuthToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.access_token ?? null
}

export const accountService = {
  async exportData(table: ExportableTable): Promise<ExportResult> {
    const token = await getAuthToken()

    if (!token) {
      return { success: false, error: 'Não autenticado' }
    }

    const response = await fetch(`${API_URL}/api/v1/account/export/${table}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Você já exportou esses dados esta semana' }
      }
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || 'Erro ao exportar dados',
      }
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition')
    const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `plim-${table}.csv`

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    return { success: true }
  },

  async deleteAccount(password?: string): Promise<ExportResult> {
    const token = await getAuthToken()

    if (!token) {
      return { success: false, error: 'Não autenticado' }
    }

    const response = await fetch(`${API_URL}/api/v1/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(password ? { password } : {}),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error?.message || 'Erro ao excluir conta',
      }
    }

    return { success: true }
  },
}
