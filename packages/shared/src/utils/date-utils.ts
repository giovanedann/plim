const PORTUGUESE_MONTHS: Record<string, string> = {
  '01': 'Janeiro',
  '02': 'Fevereiro',
  '03': 'Março',
  '04': 'Abril',
  '05': 'Maio',
  '06': 'Junho',
  '07': 'Julho',
  '08': 'Agosto',
  '09': 'Setembro',
  '10': 'Outubro',
  '11': 'Novembro',
  '12': 'Dezembro',
}

export function getPortugueseMonthName(referenceMonth: string): string {
  const parts = referenceMonth.split('-')
  const month = parts[1] ?? ''
  return PORTUGUESE_MONTHS[month] ?? referenceMonth
}
