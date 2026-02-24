import { describe, expect, it } from 'vitest'
import { getBillingCycleDates, getInvoiceMonth } from './billing-cycle'

describe('getBillingCycleDates', () => {
  const sut = getBillingCycleDates

  it('returns correct cycle for mid-month closing day', () => {
    expect(sut(15, '2026-02')).toEqual({
      cycleStart: '2026-01-16',
      cycleEnd: '2026-02-15',
    })
  })

  it('returns correct cycle for closing day 10', () => {
    expect(sut(10, '2026-06')).toEqual({
      cycleStart: '2026-05-11',
      cycleEnd: '2026-06-10',
    })
  })

  it('clamps closing day 31 in February (28 days)', () => {
    expect(sut(31, '2026-02')).toEqual({
      cycleStart: '2026-02-01',
      cycleEnd: '2026-02-28',
    })
  })

  it('clamps closing day 31 in February leap year (29 days)', () => {
    expect(sut(31, '2028-02')).toEqual({
      cycleStart: '2028-02-01',
      cycleEnd: '2028-02-29',
    })
  })

  it('clamps closing day 31 in April (30 days)', () => {
    expect(sut(31, '2026-04')).toEqual({
      cycleStart: '2026-04-01',
      cycleEnd: '2026-04-30',
    })
  })

  it('handles closing day 31 in months with 31 days', () => {
    expect(sut(31, '2026-03')).toEqual({
      cycleStart: '2026-03-01',
      cycleEnd: '2026-03-31',
    })
  })

  it('handles closing day 1 (cycle is 2nd of prev month to 1st of current)', () => {
    expect(sut(1, '2026-03')).toEqual({
      cycleStart: '2026-02-02',
      cycleEnd: '2026-03-01',
    })
  })

  it('handles closing day 1 in January (year boundary)', () => {
    expect(sut(1, '2026-01')).toEqual({
      cycleStart: '2025-12-02',
      cycleEnd: '2026-01-01',
    })
  })

  it('handles December to January year boundary', () => {
    expect(sut(15, '2026-01')).toEqual({
      cycleStart: '2025-12-16',
      cycleEnd: '2026-01-15',
    })
  })

  it('handles closing day 28 with February as previous month', () => {
    expect(sut(28, '2026-03')).toEqual({
      cycleStart: '2026-03-01',
      cycleEnd: '2026-03-28',
    })
  })

  it('handles closing day 30 with February as previous month', () => {
    expect(sut(30, '2026-03')).toEqual({
      cycleStart: '2026-03-01',
      cycleEnd: '2026-03-30',
    })
  })

  it('handles closing day 5 for December', () => {
    expect(sut(5, '2026-12')).toEqual({
      cycleStart: '2026-11-06',
      cycleEnd: '2026-12-05',
    })
  })
})

describe('getInvoiceMonth', () => {
  const sut = getInvoiceMonth

  it('returns current month when transaction is before closing day', () => {
    expect(sut(15, '2026-01-10')).toBe('2026-01')
  })

  it('returns current month when transaction is on exact closing day', () => {
    expect(sut(15, '2026-01-15')).toBe('2026-01')
  })

  it('returns next month when transaction is after closing day', () => {
    expect(sut(15, '2026-01-20')).toBe('2026-02')
  })

  it('returns next year January when transaction is after closing day in December', () => {
    expect(sut(15, '2026-12-20')).toBe('2027-01')
  })

  it('returns current month for December when transaction is before closing day', () => {
    expect(sut(15, '2026-12-10')).toBe('2026-12')
  })

  it('clamps closing day 31 in February and assigns correctly', () => {
    expect(sut(31, '2026-02-15')).toBe('2026-02')
    expect(sut(31, '2026-02-28')).toBe('2026-02')
  })

  it('returns next month when transaction exceeds clamped closing day in short month', () => {
    expect(sut(31, '2026-04-30')).toBe('2026-04')
  })

  it('handles closing day 1 correctly', () => {
    expect(sut(1, '2026-03-01')).toBe('2026-03')
    expect(sut(1, '2026-03-02')).toBe('2026-04')
  })

  it('handles closing day 1 in December', () => {
    expect(sut(1, '2026-12-01')).toBe('2026-12')
    expect(sut(1, '2026-12-02')).toBe('2027-01')
  })

  it('handles last day of month with closing day 31', () => {
    expect(sut(31, '2026-01-31')).toBe('2026-01')
    expect(sut(31, '2026-03-31')).toBe('2026-03')
  })

  it('handles transaction on first day of month', () => {
    expect(sut(15, '2026-06-01')).toBe('2026-06')
  })
})
