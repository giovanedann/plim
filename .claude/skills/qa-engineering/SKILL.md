---
name: qa-engineering
description: Use when writing or reviewing tests - covers SUT pattern, AAA, mocking, and error testing
---

# QA Engineering Standards

## Role

Staff QA engineer. Tests document behavior, enable refactoring, and catch regressions.

## Stack

- **Unit tests**: Vitest with `vi.fn()`, `vi.mock()`, `vi.mocked()`, `vi.spyOn()`
- **Component tests**: Vitest + Testing Library (`@testing-library/react`, `@testing-library/user-event`)

## Test Organization

**File location**: Co-located with source files as `*.test.ts` or `*.test.tsx`

```
src/
  expenses/
    create-expense.usecase.ts
    create-expense.usecase.test.ts
  components/
    Button.tsx
    Button.test.tsx
```

**Describe blocks**: Mirror the unit under test, nest by method or scenario:

```typescript
describe('CreateExpenseUseCase', () => {
  describe('execute', () => {
    it('creates expense with valid input', async () => { ... })
    it('throws NOT_FOUND when user missing', async () => { ... })
  })
})
```

## Test Naming

Use **"[action] [expected outcome] [condition]"** pattern:

```typescript
// Good
it('creates expense with valid input', ...)
it('throws VALIDATION_ERROR when amount is negative', ...)
it('returns empty array when no expenses exist', ...)

// Bad - vague or implementation-focused
it('works correctly', ...)
it('calls repository.create', ...)
it('test case 1', ...)
```

## Unit vs Integration Tests

| Type | Mocking | Speed | Use When |
|------|---------|-------|----------|
| **Unit** | All dependencies | Fast | Testing business logic in isolation |
| **Integration** | External only (DB, APIs) | Slower | Testing component interactions |

**Default to unit tests.** Integration tests for critical paths (auth flows, data persistence).

## SUT Pattern

**Always name the thing being tested `sut`** — distinguishes test subject from dependencies:

```typescript
let sut: CreateExpenseUseCase
let mockRepository: MockRepository

beforeEach(() => {
  mockRepository = createMockRepository()
  sut = new CreateExpenseUseCase(mockRepository as unknown as ExpensesRepository)
})
```

## AAA Pattern

Every test: **Arrange → Act → Assert**. Simple tests inline, complex tests use comments.

```typescript
it('creates expense', async () => {
  mockRepository.create.mockResolvedValue(expense)  // Arrange

  const result = await sut.execute('user-123', input)  // Act

  expect(result).toEqual(expense)  // Assert
})
```

## Test Doubles

| Type | Use | Purpose |
|------|-----|---------|
| **Stub** | `vi.fn().mockReturnValue()` | Provide return value |
| **Mock** | `vi.fn()` + `toHaveBeenCalled()` | Verify interactions |
| **Spy** | `vi.spyOn(obj, 'method')` | Real behavior + verification |

## DI Mock Factory

```typescript
type MockRepository = {
  create: ReturnType<typeof vi.fn>
  findById: ReturnType<typeof vi.fn>
}

function createMockRepository(): MockRepository {
  return { create: vi.fn(), findById: vi.fn() }
}
```

## Test Data Factory

Create factories for domain objects with sensible defaults and overrides:

```typescript
function createTestExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: 'expense-123',
    user_id: 'user-123',
    amount_cents: 1000,
    description: 'Test expense',
    created_at: new Date('2024-01-01'),
    ...overrides,
  }
}

// Usage
const expense = createTestExpense({ amount_cents: 5000 })
```

## Component Testing

Use Testing Library with user-event for realistic interactions:

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('ExpenseForm', () => {
  it('submits form with entered values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ExpenseForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Amount'), '50.00')
    await user.click(screen.getByRole('button', { name: 'Submit' }))

    expect(onSubmit).toHaveBeenCalledWith({ amount: 5000 })
  })
})
```

**Query priority** (most to least preferred):
1. `getByRole` - accessible queries
2. `getByLabelText` - form fields
3. `getByText` - non-interactive content
4. `getByTestId` - last resort

**Avoid**: `container.querySelector`, snapshot tests for component behavior

## Error Testing (Two-Step)

```typescript
await expect(sut.execute(...)).rejects.toThrow(AppError)
await expect(sut.execute(...)).rejects.toMatchObject({
  code: ERROR_CODES.NOT_FOUND,
  status: HTTP_STATUS.NOT_FOUND,
})
```

## Parameterized Tests

```typescript
it.each([
  { scenario: 'negative amount', input: { amount_cents: -100 }, error: 'VALIDATION_ERROR' },
  { scenario: 'zero amount', input: { amount_cents: 0 }, error: 'VALIDATION_ERROR' },
])('returns $error for $scenario', async ({ input, error }) => {
  await expect(sut.execute('user-123', { ...validInput, ...input }))
    .rejects.toMatchObject({ code: error })
})
```

## Controller Mocking

```typescript
vi.mock('./create-expense.usecase')

const mockExecute = vi.fn().mockResolvedValue(expense)
vi.mocked(CreateExpenseUseCase).mockImplementation(
  () => ({ execute: mockExecute }) as unknown as CreateExpenseUseCase
)
```

## Setup/Teardown

- `beforeEach`: Reset mocks, create fresh SUT (**always use**)
- `afterEach`: `vi.restoreAllMocks()` (when using spies)
- `beforeAll/afterAll`: Expensive shared setup only

## Mock Reset Functions

| Function | Clears Calls | Clears Implementation | Restores Original |
|----------|--------------|----------------------|-------------------|
| `vi.clearAllMocks()` | ✅ | ❌ | ❌ |
| `vi.resetAllMocks()` | ✅ | ✅ | ❌ |
| `vi.restoreAllMocks()` | ✅ | ✅ | ✅ |

**Rule**: Use `clearAllMocks()` in `beforeEach` (preserves mock implementations). Use `restoreAllMocks()` in `afterEach` only when using spies.

## Assertion Precision

| Use | Instead of | Why |
|-----|------------|-----|
| `toBe(5)` | `toBeTruthy()` | Precise value check |
| `toEqual({ id: '123' })` | `toBeDefined()` | Verifies shape |
| `toHaveLength(3)` | `toBeTruthy()` | Array-specific |
| `toBeNull()` | `toBeFalsy()` | Explicit null check |
| `toStrictEqual()` | `toEqual()` | Catches undefined vs missing |

```typescript
// Good - specific assertion
expect(result.items).toHaveLength(3)
expect(result.items[0]).toEqual({ id: '123', name: 'Test' })

// Bad - vague assertion
expect(result.items.length).toBeTruthy()
expect(result.items[0]).toBeDefined()
```

## Boundary & Edge Cases

Always test these scenarios:

```typescript
describe('boundary cases', () => {
  it('handles empty array', async () => {
    mockRepository.findAll.mockResolvedValue([])
    const result = await sut.execute('user-123')
    expect(result).toEqual([])
  })

  it('handles null input gracefully', async () => {
    await expect(sut.execute(null as unknown as string))
      .rejects.toMatchObject({ code: 'VALIDATION_ERROR' })
  })

  it('handles maximum allowed value', async () => {
    const input = { amount_cents: 999_999_99 }  // $999,999.99
    const result = await sut.execute('user-123', input)
    expect(result.amount_cents).toBe(999_999_99)
  })
})
```

## Anti-Patterns (Don't)

❌ **Testing implementation details**
```typescript
// Bad - tests internal method call order
expect(mockRepo.validate).toHaveBeenCalledBefore(mockRepo.save)
```

❌ **Multiple Acts per test**
```typescript
// Bad - two separate behaviors in one test
const created = await sut.create(input)
const updated = await sut.update(created.id, newInput)  // Second act
```

❌ **Test interdependencies**
```typescript
// Bad - test relies on previous test's state
let sharedExpense: Expense
it('creates expense', () => { sharedExpense = ... })
it('updates expense', () => { sut.update(sharedExpense.id, ...) })  // Depends on previous
```

❌ **Asserting on mock call args when return value suffices**
```typescript
// Unnecessary - if result is correct, inputs were correct
expect(mockRepo.create).toHaveBeenCalledWith(exactInput)
expect(result).toEqual(expectedOutput)  // This alone is sufficient
```

❌ **Snapshot tests for behavior** - Use for visual regression only, never for logic

## Checklist

- [ ] SUT named `sut`
- [ ] AAA pattern followed
- [ ] One Act per test
- [ ] Mock factories typed
- [ ] Test data factories for domain objects
- [ ] Error tests use two-step pattern
- [ ] `beforeEach` resets state
- [ ] Tests are independent (no shared mutable state)
- [ ] Assertions are precise (no `toBeTruthy` for values)
- [ ] Boundary cases covered (empty, null, max values)
- [ ] Component tests use accessible queries (`getByRole`)
