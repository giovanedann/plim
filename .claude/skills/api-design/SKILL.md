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

### Success Response

```typescript
// Single item
{
  "data": {
    "id": "exp_123",
    "amount": 50.00,
    "description": "Almoço",
    "category": "food",
    "createdAt": "2025-01-15T12:00:00Z"
  }
}

// Collection
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "pageSize": 20,
    "totalPages": 8
  }
}
```

### Error Response

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid expense data",
    "details": {
      "amount": ["Must be a positive number"],
      "category": ["Invalid category"]
    }
  }
}
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

## Brazilian Locale Considerations

- Currency: BRL (R$)
- Date format in responses: ISO 8601 (`2025-01-15T12:00:00Z`)
- Client handles locale formatting
- Accept Portuguese error messages for user-facing errors (future)
