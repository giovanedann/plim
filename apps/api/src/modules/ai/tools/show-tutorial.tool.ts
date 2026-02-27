import { tool } from 'ai'
import { z } from 'zod'
import type { ActionResult } from './types'

const VALID_TUTORIAL_IDS = [
  'add-expense',
  'manage-categories',
  'setup-credit-card',
  'view-dashboard',
  'profile-settings',
  'view-upgrade',
  'view-invoices',
  'add-income',
] as const

const TUTORIAL_MESSAGES: Record<string, string> = {
  'add-expense': 'Vou te mostrar como adicionar uma despesa!',
  'manage-categories': 'Vou te mostrar como gerenciar suas categorias!',
  'setup-credit-card': 'Vou te mostrar como configurar um cartão de crédito!',
  'view-dashboard': 'Vou te mostrar como usar o dashboard!',
  'profile-settings': 'Vou te mostrar como editar seu perfil!',
  'view-upgrade': 'Vou te mostrar como assinar o plano Pro!',
  'view-invoices': 'Vou te mostrar como acompanhar suas faturas!',
  'add-income': 'Vou te mostrar como registrar receitas!',
}

export function createShowTutorialTool() {
  return tool({
    description: 'Shows an interactive tutorial to guide the user through a feature',
    inputSchema: z.object({
      tutorial_id: z.enum(VALID_TUTORIAL_IDS),
    }),
    execute: async ({ tutorial_id }): Promise<ActionResult> => {
      return {
        success: true,
        message: TUTORIAL_MESSAGES[tutorial_id] ?? 'Vou te mostrar como fazer isso!',
        data: { tutorial_id },
        actionType: 'show_tutorial',
      }
    },
  })
}
