/**
 * Official Zustand Testing Pattern
 *
 * This mock follows the official Zustand testing guide:
 * https://zustand.docs.pmnd.rs/guides/testing
 *
 * Benefits over mocking individual stores:
 * 1. Stores use their REAL implementations (no mocking store logic)
 * 2. Automatic reset between tests for proper isolation
 * 3. Tests can naturally interact with stores (set state, subscribe, etc.)
 * 4. Catches bugs that would be hidden by mocked stores
 * 5. More maintainable - no need to keep mocks in sync with store changes
 *
 * How it works:
 * - Wraps Zustand's `create` and `createStore` functions
 * - Captures initial state for each store
 * - Adds reset function to `storeResetFns` set
 * - vitest.setup.ts calls all reset functions in afterEach
 */
import { vi } from 'vitest'
import type { StateCreator } from 'zustand'

const { create: actualCreate, createStore: actualCreateStore } =
  await vi.importActual<typeof import('zustand')>('zustand')

// Hold reset functions for all stores
export const storeResetFns = new Set<() => void>()

const createUncurried = <T>(stateCreator: StateCreator<T>) => {
  const store = actualCreate(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}

// Wrap create to support both curried and uncurried versions
export const create = (<T>(stateCreator: StateCreator<T>) => {
  // Check if zustand is being used in curried mode (stateCreator is a function that returns a function)
  return typeof stateCreator === 'function' ? createUncurried(stateCreator) : createUncurried
}) as typeof actualCreate

export const createStore = (<T>(stateCreator: StateCreator<T>) => {
  const store = actualCreateStore(stateCreator)
  const initialState = store.getState()
  storeResetFns.add(() => {
    store.setState(initialState, true)
  })
  return store
}) as typeof actualCreateStore
