---
name: api-design
description: Use when designing or implementing API endpoints, routes, request/response formats, or REST conventions
---

# API Design Standards

## REST Conventions

### URL Structure

```
/api/v1/{resource}          # Collection
/api/v1/{resource}/{id}     # Single item
/api/v1/{resource}/{id}/{sub-resource}  # Nested resource
```

### Resource Naming

- Plural nouns: `/expenses`, `/categories`, `/budgets`
- Lowercase with hyphens: `/bank-accounts` (not `/bankAccounts`)
- No verbs in URLs: `/expenses` not `/getExpenses`

### HTTP Methods

| Method | Purpose | Example | Response |
|--------|---------|---------|----------|
| GET | Read | `GET /expenses` | 200 + data |
| POST | Create | `POST /expenses` | 201 + created item |
| PUT | Full update | `PUT /expenses/123` | 200 + updated item |
| PATCH | Partial update | `PATCH /expenses/123` | 200 + updated item |
| DELETE | Remove | `DELETE /expenses/123` | 204 (no content) |

## Request/Response Format

All API responses use discriminated union types from `@plim/shared`. This enables TypeScript to correctly infer types after error checking.

### Response Types (Defined in @plim/shared)

```typescript
// Success response - wraps single items or arrays
interface ApiSuccessResponse<T> {
  data: T
}

// Paginated response - for list endpoints with pagination
interface ApiPaginatedResponse<T> {
  data: T[]  // Array of items
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error response - all errors use this format
interface ApiErrorResponse {
  error: {
    code: string      // Machine-readable: 'EXPENSE_NOT_FOUND'
    message: string   // Human-readable: 'Expense not found'
    details?: unknown // Optional validation details
  }
}
```

### Client-Side Type Usage

The frontend uses split types for proper inference:

```typescript
// For non-paginated endpoints
type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// For paginated endpoints
type ApiPaginatedResponseOrError<T> = ApiPaginatedResponse<T> | ApiErrorResponse
```

**Why split types?** A single union caused `data` to be ambiguous (`T | T[]`), forcing unsafe casts.

### Success Response Examples

```json
// Single item: GET /expenses/123
{
  "data": {
    "id": "exp_123",
    "amount_cents": 5000,
    "description": "Almoço",
    "category_id": "cat_456",
    "date": "2025-01-15"
  }
}

// Non-paginated list: GET /expenses
{
  "data": [
    { "id": "exp_123", ... },
    { "id": "exp_124", ... }
  ]
}

// Paginated list: GET /expenses/paginated?page=1&limit=20
{
  "data": [
    { "id": "exp_123", ... },
    { "id": "exp_124", ... }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error Response

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid expense data",
    "details": {
      "amount_cents": ["Must be a positive integer"],
      "category_id": ["Invalid category"]
    }
  }
}
```

### Type Guards for Responses

```typescript
// These type guards narrow the response correctly
function isErrorResponse<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return 'error' in response
}

function isSuccessResponse<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return 'data' in response && !('error' in response)
}

function isPaginatedResponse<T>(
  response: ApiPaginatedResponse<T> | ApiErrorResponse
): response is ApiPaginatedResponse<T> {
  return 'meta' in response && 'data' in response
}
```

### Usage Pattern

```typescript
const result = await expenseService.listExpenses(filters)

// After error check, TypeScript knows result.data is Expense[]
if (isErrorResponse(result)) {
  throw new Error(result.error.message)
}

// NO CAST NEEDED - TypeScript infers correctly
const expenses = result.data  // Type: Expense[]
```

## Query Parameters

### Filtering

```
GET /expenses?category=food&minAmount=10&maxAmount=100
GET /expenses?startDate=2025-01-01&endDate=2025-01-31
```

### Pagination

```
GET /expenses?page=2&pageSize=20
```

- Default `pageSize`: 20
- Max `pageSize`: 100

### Sorting

```
GET /expenses?sort=createdAt:desc
GET /expenses?sort=amount:asc,createdAt:desc
```

### Field Selection (Optional)

```
GET /expenses?fields=id,amount,category
```

## Hono Implementation Pattern

```typescript
// routes/expenses.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createExpenseSchema,
  updateExpenseSchema,
  expenseQuerySchema
} from '@plim/shared'

const expenses = new Hono()

// List with filters
expenses.get('/', zValidator('query', expenseQuerySchema), async (c) => {
  const filters = c.req.valid('query')
  const userId = c.get('userId')

  const { data, total } = await expenseService.list(userId, filters)

  return c.json({
    data,
    meta: {
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: Math.ceil(total / filters.pageSize)
    }
  })
})

// Get single
expenses.get('/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')

  const expense = await expenseService.getById(id, userId)

  if (!expense) {
    return c.json({
      error: { code: 'EXPENSE_NOT_FOUND', message: 'Expense not found' }
    }, 404)
  }

  return c.json({ data: expense })
})

// Create
expenses.post('/', zValidator('json', createExpenseSchema), async (c) => {
  const data = c.req.valid('json')
  const userId = c.get('userId')

  const expense = await expenseService.create(userId, data)

  return c.json({ data: expense }, 201)
})

// Update
expenses.patch('/:id', zValidator('json', updateExpenseSchema), async (c) => {
  const id = c.req.param('id')
  const data = c.req.valid('json')
  const userId = c.get('userId')

  const expense = await expenseService.update(id, userId, data)

  if (!expense) {
    return c.json({
      error: { code: 'EXPENSE_NOT_FOUND', message: 'Expense not found' }
    }, 404)
  }

  return c.json({ data: expense })
})

// Delete
expenses.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const userId = c.get('userId')

  const deleted = await expenseService.delete(id, userId)

  if (!deleted) {
    return c.json({
      error: { code: 'EXPENSE_NOT_FOUND', message: 'Expense not found' }
    }, 404)
  }

  return c.body(null, 204)
})

export { expenses }
```

## Versioning

- Version in URL: `/api/v1/expenses`
- Only bump version for breaking changes
- Support old versions during migration period

## Authentication

All endpoints require authentication except:
- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/refresh`

Auth header: `Authorization: Bearer <token>`

## Rate Limiting Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

## Type Safety — Zero Tolerance Policy

### Absolute Rules

1. **NEVER use `any`** — All request/response types must be explicit
2. **NEVER use `as Type` casts** on API responses — Fix the type definitions instead
3. **ALL endpoints must have typed request and response schemas**
4. **ALL Zod schemas must be defined in `@plim/shared`** — Never duplicate in API or frontend

### Controller Typing

```typescript
// All request bodies validated with Zod from shared package
import { createExpenseSchema, type CreateExpense, type Expense } from '@plim/shared'

expensesController.post('/', zValidator('json', createExpenseSchema), async (c) => {
  const input: CreateExpense = c.req.valid('json')  // Fully typed from shared
  const expense: Expense = await useCase.execute(userId, input)
  return successResponse(c, expense)  // Response type inferred
})
```

### Query Parameter Typing

```typescript
// Define query schemas in @plim/shared
import { expenseQuerySchema, type ExpenseQuery } from '@plim/shared'

expensesController.get('/', zValidator('query', expenseQuerySchema), async (c) => {
  const query: ExpenseQuery = c.req.valid('query')  // Fully typed
  // ...
})
```

## Brazilian Locale Considerations

- Currency: BRL (R$)
- Date format in responses: ISO 8601 (`2025-01-15T12:00:00Z`)
- Client handles locale formatting
- Accept Portuguese error messages for user-facing errors (future)
