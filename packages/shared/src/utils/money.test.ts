import { describe, expect, it } from 'vitest'
import { centsToDecimal, decimalToCents, formatBRL, parseBRL } from './money'

describe('centsToDecimal', () => {
  const sut = centsToDecimal

  it('converts cents to decimal', () => {
    expect(sut(5590)).toBe(55.9)
    expect(sut(100)).toBe(1)
  })

  it('handles zero value', () => {
    expect(sut(0)).toBe(0)
  })

  it('handles minimum value (1 cent)', () => {
    expect(sut(1)).toBe(0.01)
  })

  it('handles large values', () => {
    expect(sut(999999999)).toBe(9999999.99)
  })
})

describe('decimalToCents', () => {
  const sut = decimalToCents

  it('converts decimal to cents', () => {
    expect(sut(55.9)).toBe(5590)
    expect(sut(1)).toBe(100)
  })

  it('handles zero value', () => {
    expect(sut(0)).toBe(0)
  })

  it('handles minimum value (0.01)', () => {
    expect(sut(0.01)).toBe(1)
  })

  it('rounds to nearest cent when value has more than 2 decimal places', () => {
    expect(sut(55.999)).toBe(5600)
    expect(sut(55.994)).toBe(5599)
  })

  it('handles large values', () => {
    expect(sut(9999999.99)).toBe(999999999)
  })
})

describe('formatBRL', () => {
  const sut = formatBRL

  it('formats cents as BRL currency', () => {
    expect(sut(5590)).toBe('R$\u00A055,90')
    expect(sut(100)).toBe('R$\u00A01,00')
  })

  it('formats zero value', () => {
    expect(sut(0)).toBe('R$\u00A00,00')
  })

  it('formats values with thousands separator', () => {
    expect(sut(123456)).toBe('R$\u00A01.234,56')
  })

  it('formats large values with multiple thousand separators', () => {
    expect(sut(123456789)).toBe('R$\u00A01.234.567,89')
  })

  it('formats minimum value (1 cent)', () => {
    expect(sut(1)).toBe('R$\u00A00,01')
  })
})

describe('parseBRL', () => {
  const sut = parseBRL

  it('parses BRL currency string to cents', () => {
    expect(sut('55,90')).toBe(5590)
    expect(sut('R$ 55,90')).toBe(5590)
  })

  it('parses values with thousands separator', () => {
    expect(sut('1.234,56')).toBe(123456)
    expect(sut('R$ 1.234,56')).toBe(123456)
  })

  it('parses values with multiple thousand separators', () => {
    expect(sut('1.234.567,89')).toBe(123456789)
  })

  it('parses zero value', () => {
    expect(sut('0,00')).toBe(0)
    expect(sut('R$ 0,00')).toBe(0)
  })

  it('parses minimum value (0,01)', () => {
    expect(sut('0,01')).toBe(1)
  })

  it('throws on invalid value', () => {
    expect(() => sut('invalid')).toThrow('Invalid BRL value')
  })

  it('throws on empty string', () => {
    expect(() => sut('')).toThrow('Invalid BRL value')
  })

  it('throws on malformed currency format', () => {
    expect(() => sut('R$')).toThrow('Invalid BRL value')
    expect(() => sut('R$ ')).toThrow('Invalid BRL value')
  })
})
