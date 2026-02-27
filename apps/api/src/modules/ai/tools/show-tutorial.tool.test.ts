import { describe, expect, it } from 'vitest'
import { createShowTutorialTool } from './show-tutorial.tool'
import type { ActionResult } from './types'

describe('createShowTutorialTool', () => {
  const tool = createShowTutorialTool()

  it('returns success with correct message for add-expense tutorial', async () => {
    const result = (await tool.execute!(
      { tutorial_id: 'add-expense' },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('show_tutorial')
    expect(result.message).toBe('Vou te mostrar como adicionar uma despesa!')
    expect(result.data).toEqual({ tutorial_id: 'add-expense' })
  })

  it('returns success with correct message for setup-credit-card tutorial', async () => {
    const result = (await tool.execute!(
      { tutorial_id: 'setup-credit-card' },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.actionType).toBe('show_tutorial')
    expect(result.message).toBe('Vou te mostrar como configurar um cartão de crédito!')
    expect(result.data).toEqual({ tutorial_id: 'setup-credit-card' })
  })

  it('returns success with correct message for view-invoices tutorial', async () => {
    const result = (await tool.execute!(
      { tutorial_id: 'view-invoices' },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.message).toBe('Vou te mostrar como acompanhar suas faturas!')
  })

  it('returns success with correct message for add-income tutorial', async () => {
    const result = (await tool.execute!(
      { tutorial_id: 'add-income' },
      { toolCallId: '', messages: [] }
    )) as ActionResult

    expect(result.success).toBe(true)
    expect(result.message).toBe('Vou te mostrar como registrar receitas!')
  })
})
