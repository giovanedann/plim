import { describe, expect, it } from 'vitest'
import { TUTORIALS, getTutorialConfig } from './tutorials'

const EXPECTED_TUTORIAL_IDS = [
  'add-expense',
  'manage-categories',
  'setup-credit-card',
  'view-dashboard',
]

const VALID_ELEMENT_IDS = [
  'sidebar-nav-dashboard',
  'sidebar-nav-expenses',
  'sidebar-nav-categories',
  'sidebar-nav-credit-cards',
  'sidebar-nav-profile',
  'expense-add-button',
  'expense-list',
  'expense-filters',
  'expense-monthly-total',
  'category-add-button',
  'category-list',
  'dashboard-summary-cards',
  'dashboard-charts',
  'profile-settings-form',
]

describe('tutorials config', () => {
  it('all tutorials have unique IDs', () => {
    const ids = TUTORIALS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('all tutorial steps have valid elementId', () => {
    for (const tutorial of TUTORIALS) {
      for (const step of tutorial.steps) {
        expect(VALID_ELEMENT_IDS).toContain(step.elementId)
      }
    }
  })

  it('all tutorials have at least 1 step', () => {
    for (const tutorial of TUTORIALS) {
      expect(tutorial.steps.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('tutorial IDs match expected set', () => {
    const ids = TUTORIALS.map((t) => t.id).sort()
    expect(ids).toEqual([...EXPECTED_TUTORIAL_IDS].sort())
  })

  it('getTutorialConfig returns correct tutorial for valid ID', () => {
    const tutorial = getTutorialConfig('add-expense')
    expect(tutorial).toBeDefined()
    expect(tutorial?.id).toBe('add-expense')
    expect(tutorial?.title).toBe('Como adicionar uma despesa')
  })

  it('getTutorialConfig returns undefined for unknown ID', () => {
    expect(getTutorialConfig('nonexistent')).toBeUndefined()
  })
})
