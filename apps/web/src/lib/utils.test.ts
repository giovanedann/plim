import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('merges multiple class strings', () => {
      const sut = cn

      const result = sut('foo', 'bar', 'baz')

      expect(result).toBe('foo bar baz')
    })

    it('handles conditional classes with objects', () => {
      const sut = cn

      const result = sut('base', { active: true, disabled: false })

      expect(result).toBe('base active')
    })

    it('handles array of classes', () => {
      const sut = cn

      const result = sut(['foo', 'bar'], 'baz')

      expect(result).toBe('foo bar baz')
    })

    it('resolves conflicting Tailwind classes keeping the last one', () => {
      const sut = cn

      const result = sut('p-4', 'p-2')

      expect(result).toBe('p-2')
    })

    it('resolves conflicting Tailwind color classes', () => {
      const sut = cn

      const result = sut('bg-red-500', 'bg-blue-500')

      expect(result).toBe('bg-blue-500')
    })

    it('resolves conflicting Tailwind text size classes', () => {
      const sut = cn

      const result = sut('text-sm', 'text-lg')

      expect(result).toBe('text-lg')
    })

    it('preserves non-conflicting Tailwind classes', () => {
      const sut = cn

      const result = sut('p-4', 'm-2', 'text-red-500')

      expect(result).toBe('p-4 m-2 text-red-500')
    })

    it('handles undefined values gracefully', () => {
      const sut = cn

      const result = sut('foo', undefined, 'bar')

      expect(result).toBe('foo bar')
    })

    it('handles null values gracefully', () => {
      const sut = cn

      const result = sut('foo', null, 'bar')

      expect(result).toBe('foo bar')
    })

    it('handles false values gracefully', () => {
      const sut = cn

      const result = sut('foo', false, 'bar')

      expect(result).toBe('foo bar')
    })

    it('returns empty string when no classes provided', () => {
      const sut = cn

      const result = sut()

      expect(result).toBe('')
    })

    it('handles complex conditional scenarios', () => {
      const sut = cn
      const isActive = true
      const isDisabled = false

      const result = sut('base-class', isActive && 'active', isDisabled && 'disabled', {
        hover: true,
      })

      expect(result).toBe('base-class active hover')
    })

    it('handles nested arrays', () => {
      const sut = cn

      const result = sut(['foo', ['bar', 'baz']])

      expect(result).toBe('foo bar baz')
    })

    it('resolves conflicting responsive variants', () => {
      const sut = cn

      const result = sut('md:p-4', 'md:p-8')

      expect(result).toBe('md:p-8')
    })

    it('preserves different responsive variants', () => {
      const sut = cn

      const result = sut('sm:p-2', 'md:p-4', 'lg:p-8')

      expect(result).toBe('sm:p-2 md:p-4 lg:p-8')
    })

    it('resolves conflicting state variants', () => {
      const sut = cn

      const result = sut('hover:bg-red-500', 'hover:bg-blue-500')

      expect(result).toBe('hover:bg-blue-500')
    })
  })
})
