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
  const { year, month } = parseReferenceMonth(referenceMonth)
  const prev = previousMonth(year, month)

  const daysInCurrentMonth = daysInMonth(year, month)
  const clampedEndDay = Math.min(closingDay, daysInCurrentMonth)
  const cycleEnd = `${year}-${padMonth(month)}-${padDay(clampedEndDay)}`

  const daysInPrevMonth = daysInMonth(prev.year, prev.month)
  const clampedPrevClosingDay = Math.min(closingDay, daysInPrevMonth)
  const startDay = clampedPrevClosingDay + 1

  let cycleStart: string
  if (startDay > daysInPrevMonth) {
    cycleStart = `${year}-${padMonth(month)}-01`
  } else {
    cycleStart = `${prev.year}-${padMonth(prev.month)}-${padDay(startDay)}`
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
    return `${year}-${padMonth(month)}`
  }

  if (month === 12) {
    return `${year + 1}-01`
  }

  return `${year}-${padMonth(month + 1)}`
}
