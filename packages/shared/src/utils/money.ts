/**
 * Convert cents to BRL decimal (e.g., 5590 -> 55.90)
 */
export function centsToDecimal(cents: number): number {
  return cents / 100
}

/**
 * Convert BRL decimal to cents (e.g., 55.90 -> 5590)
 */
export function decimalToCents(decimal: number): number {
  return Math.round(decimal * 100)
}

/**
 * Format cents as BRL currency string (e.g., 5590 -> "R$ 55,90")
 */
export function formatBRL(cents: number): string {
  const decimal = centsToDecimal(cents)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(decimal)
}

/**
 * Parse BRL currency string to cents (e.g., "R$ 55,90" -> 5590)
 * Handles both "55,90" and "55.90" formats
 */
export function parseBRL(value: string): number {
  const cleaned = value
    .replace(/[R$\s]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')

  const decimal = Number.parseFloat(cleaned)
  if (Number.isNaN(decimal)) {
    throw new Error(`Invalid BRL value: ${value}`)
  }

  return decimalToCents(decimal)
}
