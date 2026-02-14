import { describe, expect, it } from 'vitest'
import { matchTutorialIntent } from './tutorials.mapping'

describe('matchTutorialIntent', () => {
  describe('add-expense tutorial', () => {
    it('maps "como adiciono despesa" to add-expense', () => {
      expect(matchTutorialIntent('como adiciono uma despesa')).toBe('add-expense')
    })

    it('maps "como crio uma despesa" to add-expense', () => {
      expect(matchTutorialIntent('como crio uma despesa')).toBe('add-expense')
    })

    it('maps "como faço para adicionar uma despesa" to add-expense', () => {
      expect(matchTutorialIntent('como faço para adicionar uma despesa')).toBe('add-expense')
    })

    it('maps "como cadastro um gasto" to add-expense', () => {
      expect(matchTutorialIntent('como cadastro um gasto')).toBe('add-expense')
    })
  })

  describe('manage-categories tutorial', () => {
    it('maps "como gerencio categorias" to manage-categories', () => {
      expect(matchTutorialIntent('como gerencio categorias')).toBe('manage-categories')
    })

    it('maps "onde ficam as categorias" to manage-categories', () => {
      expect(matchTutorialIntent('onde ficam as categorias')).toBe('manage-categories')
    })

    it('maps "como editar uma categoria" to manage-categories', () => {
      expect(matchTutorialIntent('como editar uma categoria')).toBe('manage-categories')
    })
  })

  describe('setup-credit-card tutorial', () => {
    it('maps "como configuro cartão de crédito" to setup-credit-card', () => {
      expect(matchTutorialIntent('como configuro cartão de crédito')).toBe('setup-credit-card')
    })

    it('maps "como cadastrar um cartão" to setup-credit-card', () => {
      expect(matchTutorialIntent('como cadastrar um cartão')).toBe('setup-credit-card')
    })

    it('maps "onde cadastro um cartao" to setup-credit-card', () => {
      expect(matchTutorialIntent('onde cadastro um cartao')).toBe('setup-credit-card')
    })
  })

  describe('view-dashboard tutorial', () => {
    it('maps "como vejo meu dashboard" to view-dashboard', () => {
      expect(matchTutorialIntent('como vejo meu dashboard')).toBe('view-dashboard')
    })

    it('maps "como usar o painel" to view-dashboard', () => {
      expect(matchTutorialIntent('como usar o painel')).toBe('view-dashboard')
    })

    it('maps "onde fica o dashboard" to view-dashboard', () => {
      expect(matchTutorialIntent('onde fica o dashboard')).toBe('view-dashboard')
    })
  })

  describe('non-help queries', () => {
    it('returns null for action requests', () => {
      expect(matchTutorialIntent('Adiciona uma despesa de R$50')).toBeNull()
    })

    it('returns null for query requests', () => {
      expect(matchTutorialIntent('quanto gastei esse mês')).toBeNull()
    })

    it('returns null for greetings', () => {
      expect(matchTutorialIntent('olá')).toBeNull()
    })
  })

  describe('case insensitivity', () => {
    it('handles uppercase text', () => {
      expect(matchTutorialIntent('COMO ADICIONO DESPESA')).toBe('add-expense')
    })

    it('handles mixed case', () => {
      expect(matchTutorialIntent('Como Adiciono Uma Despesa')).toBe('add-expense')
    })
  })

  describe('accent variations', () => {
    it('handles "como faco" without cedilla', () => {
      expect(matchTutorialIntent('como faco para adicionar uma despesa')).toBe('add-expense')
    })

    it('handles "cartao" without tilde', () => {
      expect(matchTutorialIntent('como configuro cartao de credito')).toBe('setup-credit-card')
    })
  })
})
