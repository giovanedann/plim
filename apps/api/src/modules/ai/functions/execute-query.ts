import { executeQueryFunctionParamsSchema } from '@plim/shared'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { FunctionExecutionResult } from './execute-function'

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
    return { valid: false, error: 'ID de usuário inválido.' }
  }

  if (sql.includes(';')) {
    return { valid: false, error: 'Múltiplas instruções SQL não são permitidas.' }
  }

  const upperSql = sql.toUpperCase()

  for (const keyword of DANGEROUS_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i')
    if (regex.test(upperSql)) {
      return {
        valid: false,
        error: `Operação '${keyword}' não permitida. Apenas consultas SELECT são aceitas.`,
      }
    }
  }

  const lowerSql = sql.toLowerCase()
  for (const table of BLOCKED_TABLES) {
    if (lowerSql.includes(table.toLowerCase())) {
      return { valid: false, error: 'Acesso a tabelas do sistema não é permitido.' }
    }
  }

  const trimmedSql = upperSql.trim()
  if (!trimmedSql.startsWith('SELECT') && !trimmedSql.startsWith('WITH')) {
    return { valid: false, error: 'Apenas consultas SELECT são permitidas.' }
  }

  if (!sql.includes('{userId}') && !sql.includes(userId)) {
    return {
      valid: false,
      error: 'A consulta deve filtrar por user_id para garantir a segurança dos dados.',
    }
  }

  return { valid: true }
}

function formatQueryResults(
  data: Record<string, unknown>[],
  _description: string
): { message: string; formattedData: unknown } {
  if (!data || data.length === 0) {
    return {
      message: 'Nenhum resultado encontrado.',
      formattedData: { rows: [], count: 0 },
    }
  }

  // Return raw data - AI will format it naturally
  // Limit to 50 rows to avoid overwhelming the AI
  return {
    message: '', // Will be replaced by AI formatting
    formattedData: { rows: data.slice(0, 50), count: data.length },
  }
}

export async function executeQuery(
  args: Record<string, unknown>,
  userId: string,
  supabase: SupabaseClient
): Promise<FunctionExecutionResult> {
  const parseResult = executeQueryFunctionParamsSchema.safeParse(args)

  if (!parseResult.success) {
    return {
      success: false,
      message: 'Não consegui entender sua consulta. Pode reformular?',
      actionType: 'error',
    }
  }

  const { sql, description } = parseResult.data

  const securityCheck = validateSqlSecurity(sql, userId)
  if (!securityCheck.valid) {
    return {
      success: false,
      message: securityCheck.error || 'Consulta inválida.',
      actionType: 'error',
    }
  }

  const finalSql = sql.trim().replace(/\{userId\}/g, userId)

  try {
    const { data, error } = await supabase.rpc('execute_readonly_sql', {
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
    const { message, formattedData } = formatQueryResults(rows, description)

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
}
