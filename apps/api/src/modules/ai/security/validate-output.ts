const TABLE_NAMES = [
  'expense',
  'category',
  'credit_card',
  'salary_history',
  'profile',
  'spending_limit',
  'auth.users',
  'pg_catalog',
  'information_schema',
]

const UUID_PATTERN = /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi

const SQL_PATTERN = /\bSELECT\b.*\bFROM\b.*\bWHERE\b/is

export function validateOutput(text: string): string {
  let result = text

  for (const table of TABLE_NAMES) {
    const pattern = new RegExp(`\\b${table.replace('.', '\\.')}\\b`, 'gi')
    result = result.replace(pattern, '[redacted]')
  }

  result = result.replace(UUID_PATTERN, '[id]')
  result = result.replace(SQL_PATTERN, '[consulta interna]')

  return result
}
