import { describe, expect, it } from 'vitest'
import { centsToDecimal, decimalToCents, formatBRL, parseBRL } from './money'

describe('money utilities', () => {
  describe('centsToDecimal', () => {
    it('converts cents to decimal', () => {
      expect(centsToDecimal(5590)).toBe(55.9)
      expect(centsToDecimal(100)).toBe(1)
      expect(centsToDecimal(0)).toBe(0)
      expect(centsToDecimal(1)).toBe(0.01)
    })
  })

  describe('decimalToCents', () => {
    it('converts decimal to cents', () => {
      expect(decimalToCents(55.9)).toBe(5590)
      expect(decimalToCents(1)).toBe(100)
      expect(decimalToCents(0)).toBe(0)
      expect(decimalToCents(0.01)).toBe(1)
    })

    it('rounds to nearest cent', () => {
      expect(decimalToCents(55.999)).toBe(5600)
      expect(decimalToCents(55.994)).toBe(5599)
    })
  })

  describe('formatBRL', () => {
    it('formats cents as BRL currency', () => {
      expect(formatBRL(5590)).toBe('R$\u00A055,90')
      expect(formatBRL(100)).toBe('R$\u00A01,00')
      expect(formatBRL(0)).toBe('R$\u00A00,00')
      expect(formatBRL(123456)).toBe('R$\u00A01.234,56')
    })
  })

  describe('parseBRL', () => {
    it('parses BRL currency string to cents', () => {
      expect(parseBRL('55,90')).toBe(5590)
      expect(parseBRL('R$ 55,90')).toBe(5590)
      expect(parseBRL('1.234,56')).toBe(123456)
      expect(parseBRL('R$ 1.234,56')).toBe(123456)
    })

    it('throws on invalid value', () => {
      expect(() => parseBRL('invalid')).toThrow('Invalid BRL value')
    })
  })
})
