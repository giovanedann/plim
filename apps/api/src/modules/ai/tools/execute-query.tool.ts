import { executeQueryFunctionParamsSchema } from '@plim/shared'
import { tool } from 'ai'
import type { ActionResult, ToolContext } from './types'

const DANGEROUS_KEYWORDS = [
  'DROP',
  'DELETE',
  'UPDATE',
  'INSERT',
  'ALTER',
  'TRUNCATE',
  'CREATE',
  'GRANT',
  'REVOKE',
  'COMMIT',
  'ROLLBACK',
  'EXEC',
  'EXECUTE',
  'COPY',
  'SET',
  'CALL',
] as const

const BLOCKED_TABLES = [
  'auth.users',
  'pg_catalog',
  'information_schema',
  'pg_tables',
  'pg_stat',
  'pg_class',
  'pg_namespace',
  'pg_roles',
] as const

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function validateSqlSecurity(sql: string, userId: string): { valid: boolean; error?: string } {
  if (!UUID_REGEX.test(userId)) {
    return { valid: false, error: 'ID de usuario invalido.' }
  }

  if (sql.includes(';')) {
    return { valid: false, error: 'Multiplas instrucoes SQL nao sao permitidas.' }
  }

  const upperSql = sql.toUpperCase()

  for (const keyword of DANGEROUS_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(upperSql)) {
      return {
        valid: false,
        error: `Operacao '${keyword}' nao permitida. Apenas consultas SELECT sao aceitas.`,
      }
    }
  }

  const lowerSql = sql.toLowerCase()
  for (const table of BLOCKED_TABLES) {
    if (lowerSql.includes(table.toLowerCase())) {
      return { valid: false, error: 'Acesso a tabelas do sistema nao e permitido.' }
    }
  }

  const trimmedSql = upperSql.trim()
  if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
    return { valid: false, error: 'Apenas consultas SELECT sao permitidas.' }
  }

  if (!sql.includes('{userId}') && !sql.includes(userId)) {
    return {
      valid: false,
      error: 'A consulta deve filtrar por user_id para garantir a seguranca dos dados.',
    }
  }

  return { valid: true }
}

function formatQueryResults(data: Record<string, unknown>[]): {
  message: string
  formattedData: unknown
} {
  if (!data || data.length === 0) {
    return {
      message: 'Nenhum resultado encontrado.',
      formattedData: { rows: [], count: 0 },
    }
  }

  return {
    message: '',
    formattedData: { rows: data.slice(0, 50), count: data.length },
  }
}

export function createExecuteQueryTool(ctx: ToolContext) {
  return tool({
    description:
      'Executes a read-only SQL query against the user database. Only SELECT/WITH statements are allowed. The query must filter by user_id.',
    inputSchema: executeQueryFunctionParamsSchema,
    execute: async ({ sql, description: _description }): Promise<ActionResult> => {
      const securityCheck = validateSqlSecurity(sql, ctx.userId)
      if (!securityCheck.valid) {
        return {
          success: false,
          message: securityCheck.error ?? 'Consulta invalida.',
          actionType: 'error',
        }
      }

      const finalSql = sql.trim().replace(/\{userId\}/g, ctx.userId)

      try {
        const { data, error } = await ctx.supabase.rpc('execute_readonly_sql', {
          query_text: finalSql,
        })

        if (error) {
          return {
            success: false,
            message: 'Erro ao executar a consulta. Tente novamente.',
            actionType: 'error',
          }
        }

        const rows = (data as Record<string, unknown>[]) || []
        const { message, formattedData } = formatQueryResults(rows)

        return {
          success: true,
          message,
          data: formattedData,
          actionType: 'query_result',
        }
      } catch {
        return {
          success: false,
          message: 'Erro inesperado ao executar a consulta.',
          actionType: 'error',
        }
      }
    },
  })
}
