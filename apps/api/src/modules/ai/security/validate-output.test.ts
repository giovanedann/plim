import { describe, expect, it } from 'vitest'
import { validateOutput } from './validate-output'

describe('validateOutput', () => {
  describe('redacts table names', () => {
    it('redacts expense table name', () => {
      expect(validateOutput('A tabela expense contém seus dados')).toBe(
        'A tabela [redacted] contém seus dados'
      )
    })

    it('redacts credit_card table name', () => {
      expect(validateOutput('Dados da credit_card foram acessados')).toBe(
        'Dados da [redacted] foram acessados'
      )
    })

    it('redacts category table name', () => {
      expect(validateOutput('A tabela category tem as categorias')).toBe(
        'A tabela [redacted] tem as categorias'
      )
    })

    it('redacts auth.users reference', () => {
      expect(validateOutput('Consultei auth.users para verificar')).toBe(
        'Consultei [redacted] para verificar'
      )
    })

    it('redacts multiple table names', () => {
      expect(validateOutput('JOIN expense com category')).toBe('JOIN [redacted] com [redacted]')
    })
  })

  describe('redacts UUIDs', () => {
    it('redacts standard UUID', () => {
      expect(validateOutput('Seu ID é 550e8400-e29b-41d4-a716-446655440000')).toBe('Seu ID é [id]')
    })

    it('redacts multiple UUIDs', () => {
      const text =
        'IDs: 550e8400-e29b-41d4-a716-446655440000 e a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      expect(validateOutput(text)).toBe('IDs: [id] e [id]')
    })
  })

  describe('redacts SQL fragments', () => {
    it('redacts SELECT...FROM...WHERE pattern', () => {
      const result = validateOutput(
        "A query SELECT * FROM expense WHERE user_id = '123' foi executada"
      )
      expect(result).not.toContain('SELECT')
      expect(result).not.toContain('FROM')
      expect(result).toContain('[consulta interna]')
    })
  })

  describe('preserves normal text', () => {
    it('does not modify normal finance responses', () => {
      const text = 'Você gastou R$ 1.234,56 em Alimentação este mês.'
      expect(validateOutput(text)).toBe(text)
    })

    it('does not modify currency values', () => {
      const text = 'Total: R$ 500,00 em 3 despesas'
      expect(validateOutput(text)).toBe(text)
    })

    it('does not modify tutorial messages', () => {
      const text = 'Vou te mostrar como adicionar uma despesa!'
      expect(validateOutput(text)).toBe(text)
    })
  })
})
