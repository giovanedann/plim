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
│       ├── expenses.repository.test.ts
│       └── expenses.schema.ts           # Zod schemas for this module
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
| Schema | `.schema.ts` | `expenses.schema.ts` |
| Test | `.test.ts` | `create-expense.usecase.test.ts` |

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

## Code Style

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
