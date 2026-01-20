---
name: backend-engineering
description: Use when writing any backend code - API endpoints, database queries, business logic, or serverless functions
---

# Backend Engineering Standards

## Role

Staff backend engineer focused on PostgreSQL systems. Building a finance tracking application where **data accuracy is critical** — users must trust their expense totals are correct.

## Core Priorities (In Order)

1. **Security** — Never trust input, sanitize everything, protect user data
2. **Data Integrity** — Prevent duplicate entries, ensure accurate totals, use transactions where needed
3. **Performance** — Optimize queries, minimize latency, reduce cold starts
4. **Costs** — Efficient queries = lower serverless costs
5. **Readability** — Clear code over clever code

## Stack

- **Runtime:** Serverless edge functions (Cloudflare Workers)
- **Framework:** Hono
- **Language:** TypeScript (strict mode, never use `any`)
- **Database:** PostgreSQL via Supabase
- **Validation:** Zod (always)
- **Auth:** Supabase Auth

## Type Safety — Single Source of Truth

**ALL domain types and Zod schemas MUST be defined in `@myfinances/shared`.** Both backend and frontend import from this single source.

### Why This Matters

- Prevents field name mismatches between API and frontend
- Zod schemas validate at runtime AND provide TypeScript types
- Changes propagate to both ends automatically
- Single place to update validation rules

### Rules

```typescript
// CORRECT: Import schemas and types from shared package
import { createSalarySchema, type CreateSalary, type SalaryHistory } from '@myfinances/shared'

// Use in controller
salaryController.post('/', zValidator('json', createSalarySchema), async (c) => {
  const input = c.req.valid('json')  // Type is CreateSalary
  // ...
})

// WRONG: Never define duplicate schemas in the API
// apps/api/src/modules/salary/salary.schema.ts  ← DON'T CREATE THIS
const createSalarySchema = z.object({ ... })  // ← NEVER DUPLICATE
```

### What Goes in Shared vs Backend

| Location | What |
|----------|------|
| `@myfinances/shared` | All entity types, Zod schemas, validation rules, error codes, HTTP status constants |
| Backend only | Use cases, repositories, middleware, database-specific code |

### Schema Location

All Zod schemas live in `packages/shared/src/schemas/`:

```
packages/shared/src/schemas/
├── index.ts          # Re-exports all schemas
├── profile.ts        # profileSchema, updateProfileSchema
├── expense.ts        # expenseSchema, createExpenseSchema
├── category.ts       # categorySchema, createCategorySchema
└── salary.ts         # salaryHistorySchema, createSalarySchema
```

## File Organization (Controller → UseCase → Repository)

```
apps/api/src/
├── modules/
│   └── expenses/
│       ├── expenses.controller.ts       # HTTP handling, request/response
│       ├── expenses.controller.test.ts
│       ├── create-expense.usecase.ts    # Business logic
│       ├── create-expense.usecase.test.ts
│       ├── list-expenses.usecase.ts
│       ├── expenses.repository.ts       # Database access
│       └── expenses.repository.test.ts  # Schemas live in @myfinances/shared
├── middleware/
│   ├── auth.middleware.ts
│   └── error-handler.middleware.ts
├── lib/
│   ├── db.ts
│   └── logger.ts
└── index.ts
```

### Layer Responsibilities

| Layer | Purpose | Depends On |
|-------|---------|------------|
| **Controller** | HTTP handling, validation, response formatting | UseCase |
| **UseCase** | Business logic, orchestration | Repository |
| **Repository** | Database queries, data access | Database |

### File Naming Convention

```
{name}.{type}.{ext}
```

| Type | Extension | Example |
|------|-----------|---------|
| Controller | `.controller.ts` | `expenses.controller.ts` |
| UseCase | `.usecase.ts` | `create-expense.usecase.ts` |
| Repository | `.repository.ts` | `expenses.repository.ts` |
| Middleware | `.middleware.ts` | `auth.middleware.ts` |
| Test | `.test.ts` | `create-expense.usecase.test.ts` |

> **Note:** Zod schemas are NOT defined in the API. Import them from `@myfinances/shared`.

### Rules

- **Kebab-case** for all file and folder names
- **Co-locate** all layers and tests within the same module folder
- Controllers never access database directly
- UseCases are framework-agnostic (no Hono types)
- Repositories handle only data access, no business logic

## TypeScript Rules

```typescript
// NEVER
const data: any = await response.json();
function process(input: any) {}

// ALWAYS
const data = responseSchema.parse(await response.json());
function process(input: CreateExpenseInput) {}
```

- Enable `strict: true` in tsconfig
- Use Zod inference: `type Expense = z.infer<typeof expenseSchema>`
- Prefer `unknown` over `any` when type is truly unknown, then narrow with Zod

## Database & Data Integrity

### When to Use Transactions

```typescript
// Use transactions when multiple related writes must succeed or fail together
await db.transaction(async (tx) => {
  const expense = await tx.insert(expenses).values(data).returning();
  await tx
    .update(budgets)
    .set({ spent: sql`spent + ${data.amount}` })
    .where(eq(budgets.id, budgetId));
});
```

### Preventing Duplicates

- Use unique constraints where applicable (e.g., idempotency keys for imports)
- Implement optimistic locking for concurrent updates if needed
- Consider request deduplication for rapid button clicks

### Query Guidelines

- Use parameterized queries (never string concatenation)
- Index columns used in WHERE, JOIN, ORDER BY
- Avoid SELECT \* — specify columns
- Use EXPLAIN ANALYZE for complex queries
- Prefer single queries over N+1 patterns

## Error Handling

### Standard Error Response

```typescript
interface ApiError {
  code: string; // Machine-readable: 'EXPENSE_NOT_FOUND'
  message: string; // Human-readable: 'Expense not found'
  details?: unknown; // Optional additional context
}

// Usage
return c.json<ApiError>(
  {
    code: "VALIDATION_ERROR",
    message: "Invalid expense data",
    details: zodError.flatten(),
  },
  400,
);
```

### Error Codes by Category

| Category   | Codes                               | HTTP Status |
| ---------- | ----------------------------------- | ----------- |
| Validation | `VALIDATION_ERROR`, `INVALID_INPUT` | 400         |
| Auth       | `UNAUTHORIZED`, `FORBIDDEN`         | 401, 403    |
| Not Found  | `*_NOT_FOUND`                       | 404         |
| Conflict   | `DUPLICATE_ENTRY`, `ALREADY_EXISTS` | 409         |
| Server     | `INTERNAL_ERROR`, `DATABASE_ERROR`  | 500         |

### Never Expose

- Stack traces in production
- Database error details
- Internal IDs in error messages

## Logging

### What to Log

```typescript
// Request context
logger.info("expense.create", {
  userId: ctx.userId,
  amount: input.amount,
  category: input.category,
  requestId: ctx.requestId,
});

// Errors
logger.error("expense.create.failed", {
  error: error.message,
  code: error.code,
  userId: ctx.userId,
  requestId: ctx.requestId,
});
```

### Never Log

- Passwords, tokens, API keys
- Personal identification numbers (CPF)
- Sensitive financial details

## Environment Variables

```typescript
// schemas/env.ts
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_KEY: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

export const env = envSchema.parse(process.env);
```

- Validate all env vars at startup with Zod
- Fail fast if missing required vars
- Never commit `.env` files

## Testing

### Coverage Expectations

- **Business logic:** High coverage for calculations, validations
- **API endpoints:** Integration tests for all routes
- **Edge cases:** Empty states, invalid inputs, auth failures

### What to Test

```typescript
// Unit: Pure business logic
describe("calculateMonthlyTotal", () => {
  it("correctly sums expenses by category", () => {});
  it("handles empty expense list", () => {});
  it("filters by date range correctly", () => {});
});

// Integration: API endpoints
describe("POST /expenses", () => {
  it("creates expense with valid data", async () => {});
  it("returns 400 for invalid data", async () => {});
  it("returns 401 without auth", async () => {});
  it("enforces user ownership", async () => {});
});

// Data integrity
describe("expense creation", () => {
  it("prevents duplicate entries with same idempotency key", async () => {});
  it("correctly updates related budget totals", async () => {});
});
```

### Test Structure (Co-located)

Tests live with their modules:

```
apps/api/src/
├── modules/
│   └── expenses/
│       ├── expenses.controller.ts
│       ├── expenses.controller.test.ts       # Controller tests (HTTP layer)
│       ├── create-expense.usecase.ts
│       ├── create-expense.usecase.test.ts    # UseCase tests (business logic)
│       ├── expenses.repository.ts
│       └── expenses.repository.test.ts       # Repository tests (data access)
├── tests/
│   ├── integration/
│   │   └── expense-flow.test.ts              # End-to-end flow tests
│   └── setup.ts
```

### Mocking Strategy by Layer

Each test layer mocks only its direct dependencies:

| Test Layer | Mocks | Does NOT Mock |
|------------|-------|---------------|
| Controller | UseCases | Supabase, Repository |
| UseCase | Repository | Supabase |
| Repository | Supabase client | Nothing |

**Controller tests mock UseCases:**

```typescript
import { CreateExpenseUseCase } from './create-expense.usecase'

vi.mock('./create-expense.usecase')

it('creates expense with valid data', async () => {
  const mockExecute = vi.fn().mockResolvedValue(expense)
  vi.mocked(CreateExpenseUseCase).mockImplementation(
    () => ({ execute: mockExecute }) as unknown as CreateExpenseUseCase
  )

  const res = await app.request('/expenses', { method: 'POST', body })
  expect(res.status).toBe(201)
  expect(mockExecute).toHaveBeenCalledWith('user-123', input)
})
```

**UseCase tests mock Repository:**

```typescript
const mockRepository = {
  create: vi.fn(),
  findById: vi.fn(),
}

it('creates expense', async () => {
  mockRepository.create.mockResolvedValue(expense)
  const useCase = new CreateExpenseUseCase(mockRepository)
  const result = await useCase.execute('user-123', input)
  expect(result).toEqual(expense)
})
```

### Error Mocking with AppError

When testing error scenarios, always use `AppError` instances — the error handler checks `instanceof AppError`:

```typescript
import { AppError } from '../../middleware/error-handler.middleware'

it('returns 404 when not found', async () => {
  const mockExecute = vi.fn().mockRejectedValue(
    new AppError(ERROR_CODES.NOT_FOUND, 'Expense not found', HTTP_STATUS.NOT_FOUND)
  )
  vi.mocked(GetExpenseUseCase).mockImplementation(
    () => ({ execute: mockExecute }) as unknown as GetExpenseUseCase
  )

  const res = await app.request('/expenses/123', { method: 'GET' })
  expect(res.status).toBe(404)
})
```

## Code Style

### No Comments Unless Strictly Necessary

Code should be self-documenting through clear naming and structure. Only add comments when:
- Explaining **why** something unusual is done (not what)
- Documenting complex algorithms or business rules
- Warning about non-obvious side effects

```typescript
// BAD: Explains what code does
// Loop through expenses and sum amounts
const total = expenses.reduce((sum, e) => sum + e.amount, 0)

// BAD: Obvious from function name
// Creates a new expense
async function createExpense(data: CreateExpenseInput) {}

// GOOD: Explains why
// Using integer cents to avoid floating-point precision issues with currency
const amountCents = Math.round(amount * 100)

// GOOD: Business rule context
// Installments must be at least 2 — single payment is a one-time expense
if (installments < 2) throw new Error('Invalid installment count')
```

### Readability Over Micro-Optimizations

```typescript
// BAD: Saves 1ms, unreadable
const t = txs.filter((t) => t.a > 0).reduce((s, t) => s + t.a, 0);

// GOOD: Clear intent
const incomeTransactions = transactions.filter((tx) => tx.amount > 0);
const totalIncome = incomeTransactions.reduce(
  (sum, transaction) => sum + transaction.amount,
  0,
);
```

### SOLID Principles

- **Single Responsibility:** One function = one job
- **Open/Closed:** Extend via composition, not modification
- **Dependency Inversion:** Inject dependencies, don't hardcode

## Security Checklist

- [ ] All inputs validated with Zod
- [ ] Parameterized queries only (no string interpolation)
- [ ] Auth check on every endpoint
- [ ] Rate limiting on sensitive endpoints
- [ ] CORS configured properly
- [ ] Sensitive data encrypted at rest
- [ ] Row Level Security (RLS) enabled in Supabase
