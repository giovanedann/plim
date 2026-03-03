function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function padDay(day: number): string {
  return String(day).padStart(2, '0')
}

function padMonth(month: number): string {
  return String(month).padStart(2, '0')
}

function parseReferenceMonth(referenceMonth: string): { year: number; month: number } {
  const [yearStr, monthStr] = referenceMonth.split('-')
  return { year: Number(yearStr), month: Number(monthStr) }
}

function previousMonth(year: number, month: number): { year: number; month: number } {
  if (month === 1) {
    return { year: year - 1, month: 12 }
  }
  return { year, month: month - 1 }
}

export function getBillingCycleDates(
  closingDay: number,
  referenceMonth: string
): { cycleStart: string; cycleEnd: string } {
  const { year: refYear, month: refMonth } = parseReferenceMonth(referenceMonth)
  const next =
    refMonth === 12 ? { year: refYear + 1, month: 1 } : { year: refYear, month: refMonth + 1 }

  const daysInEndMonth = daysInMonth(next.year, next.month)
  const clampedEndDay = Math.min(closingDay, daysInEndMonth)
  const cycleEnd = `${next.year}-${padMonth(next.month)}-${padDay(clampedEndDay)}`

  const daysInRefMonth = daysInMonth(refYear, refMonth)
  const clampedRefClosingDay = Math.min(closingDay, daysInRefMonth)
  const startDay = clampedRefClosingDay + 1

  let cycleStart: string
  if (startDay > daysInRefMonth) {
    cycleStart = `${next.year}-${padMonth(next.month)}-01`
  } else {
    cycleStart = `${refYear}-${padMonth(refMonth)}-${padDay(startDay)}`
  }

  return { cycleStart, cycleEnd }
}

export function getInvoiceMonth(closingDay: number, transactionDate: string): string {
  const [yearStr, monthStr, dayStr] = transactionDate.split('-')
  const year = Number(yearStr)
  const month = Number(monthStr)
  const day = Number(dayStr)

  const daysInCurrentMonth = daysInMonth(year, month)
  const clampedClosingDay = Math.min(closingDay, daysInCurrentMonth)

  if (day <= clampedClosingDay) {
    const prev = previousMonth(year, month)
    return `${prev.year}-${padMonth(prev.month)}`
  }

  return `${year}-${padMonth(month)}`
}
