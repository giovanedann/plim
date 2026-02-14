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

    it('maps "como vejo minhas categorias" to manage-categories', () => {
      expect(matchTutorialIntent('como vejo minhas categorias')).toBe('manage-categories')
    })

    it('maps "como registro uma categoria" to manage-categories', () => {
      expect(matchTutorialIntent('como registro uma categoria')).toBe('manage-categories')
    })

    it('maps "como crio uma categoria" to manage-categories', () => {
      expect(matchTutorialIntent('como crio uma categoria')).toBe('manage-categories')
    })

    it('maps "como cadastrar uma categoria" to manage-categories', () => {
      expect(matchTutorialIntent('como cadastrar uma categoria')).toBe('manage-categories')
    })

    it('maps "como faço para criar uma categoria" to manage-categories', () => {
      expect(matchTutorialIntent('como faço para criar uma categoria')).toBe('manage-categories')
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

    it('maps "como registro meus cartoes" to setup-credit-card', () => {
      expect(matchTutorialIntent('Como registro meus cartoes')).toBe('setup-credit-card')
    })

    it('maps "como cadastro meus cartões" to setup-credit-card', () => {
      expect(matchTutorialIntent('como cadastro meus cartões')).toBe('setup-credit-card')
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

  describe('profile-settings tutorial', () => {
    it('maps "como mudo minha foto de perfil" to profile-settings', () => {
      expect(matchTutorialIntent('como mudo minha foto de perfil')).toBe('profile-settings')
    })

    it('maps "como altero meu perfil" to profile-settings', () => {
      expect(matchTutorialIntent('como altero meu perfil')).toBe('profile-settings')
    })

    it('maps "onde fica meu perfil" to profile-settings', () => {
      expect(matchTutorialIntent('onde fica meu perfil')).toBe('profile-settings')
    })

    it('maps "como editar meu nome" to profile-settings', () => {
      expect(matchTutorialIntent('como editar meu nome')).toBe('profile-settings')
    })
  })

  describe('view-upgrade tutorial', () => {
    it('maps "como assino o plano pro" to view-upgrade', () => {
      expect(matchTutorialIntent('como assino o plano pro')).toBe('view-upgrade')
    })

    it('maps "como faço upgrade" to view-upgrade', () => {
      expect(matchTutorialIntent('como faço upgrade')).toBe('view-upgrade')
    })

    it('maps "onde fica o plano pro" to view-upgrade', () => {
      expect(matchTutorialIntent('onde fica o plano pro')).toBe('view-upgrade')
    })

    it('maps "quero ser pro" to view-upgrade', () => {
      expect(matchTutorialIntent('quero ser pro')).toBe('view-upgrade')
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
