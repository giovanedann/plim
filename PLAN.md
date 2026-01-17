# MyFinances App - Implementation Plan

## Progress Tracker

### Phase 1: Database Setup ✅

- [x] Initialize Supabase project configuration
- [x] Create `profile` table with trigger for auto-creation
- [x] Create `category` table
- [x] Seed default categories
- [x] Create `expense` table
- [x] Create `salary_history` table
- [x] Set up Row Level Security (RLS) policies for all tables
- [x] Test RLS policies work correctly
- [x] Create database indexes for common queries

### Phase 2: Monorepo & Project Setup ✅

- [x] Initialize pnpm workspace
- [x] Create `apps/api` package structure
- [x] Create `apps/web` package structure
- [x] Create `packages/shared` for Zod schemas
- [x] Set up TypeScript configs (base + per-package)
- [x] Set up BiomeJS
- [x] Set up Vitest for testing

### Phase 3: Shared Package ✅

- [x] Create Zod schemas for `expense`
- [x] Create Zod schemas for `category`
- [x] Create Zod schemas for `salary_history`
- [x] Create Zod schemas for `profile`
- [x] Create shared types (inferred from Zod)
- [x] Create money utilities (cents ↔ BRL conversion)

### Phase 4: API - Auth & Profile (Current)

- [ ] Set up Hono with Cloudflare Workers
- [ ] Create auth middleware (Supabase JWT verification)
- [ ] Create error handling middleware
- [ ] Implement `GET /profile` endpoint
- [ ] Implement `PATCH /profile` endpoint
- [ ] Write tests for profile endpoints

### Phase 5: API - Categories

- [ ] Implement `GET /categories` (user's + defaults)
- [ ] Implement `POST /categories`
- [ ] Implement `PATCH /categories/:id`
- [ ] Implement `DELETE /categories/:id` (soft delete)
- [ ] Write tests for category endpoints

### Phase 6: API - Expenses

- [ ] Implement `GET /expenses` with filters (date range, category, payment method)
- [ ] Implement `POST /expenses` (one-time)
- [ ] Implement `POST /expenses` (recurrent)
- [ ] Implement `POST /expenses` (installments - creates multiple records)
- [ ] Implement `PATCH /expenses/:id`
- [ ] Implement `DELETE /expenses/:id`
- [ ] Implement logic for projecting recurrent expenses
- [ ] Write tests for expense endpoints

### Phase 7: API - Salary

- [ ] Implement `GET /salary?month=YYYY-MM` (returns active salary for month)
- [ ] Implement `POST /salary` (create new salary history record)
- [ ] Implement `GET /salary/history` (all salary changes)
- [ ] Write tests for salary endpoints

### Phase 8: Frontend - Setup

- [ ] Initialize Vite + React
- [ ] Set up Tailwind CSS
- [ ] Set up shadcn/ui
- [ ] Set up React Router v7
- [ ] Set up React Query
- [ ] Set up Zustand
- [ ] Create base layout components

### Phase 9: Frontend - Auth Pages

- [ ] Create `/sign-in` page
- [ ] Create `/sign-up` page
- [ ] Implement Supabase Auth integration
- [ ] Create auth guards for protected routes

### Phase 10: Frontend - Expenses Page

- [ ] Create `/expenses` page layout
- [ ] Implement month selector (navigation)
- [ ] Implement salary display + inline edit
- [ ] Implement expenses table with filters
- [ ] Create add expense form (one-time)
- [ ] Create add expense form (recurrent)
- [ ] Create add expense form (installments)
- [ ] Implement edit expense
- [ ] Implement delete expense

### Phase 11: Frontend - Dashboard

- [ ] Create `/dashboard` page layout
- [ ] Implement monthly summary chart
- [ ] Implement category breakdown (pie chart)
- [ ] Implement spending trends

### Phase 12: Frontend - Profile & Landing

- [ ] Create `/profile` page
- [ ] Create `/landing` page (marketing)

### Phase 13: Deployment

- [ ] Deploy API to Cloudflare Workers
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Configure environment variables
- [ ] Set up CI/CD (GitHub Actions)

---

## Entity Design Reference

### profile

| Column       | Type        | Notes                   |
| ------------ | ----------- | ----------------------- |
| `user_id`    | uuid        | PK, FK to auth.users.id |
| `name`       | text        |                         |
| `email`      | text        | Denormalized from auth  |
| `avatar_url` | text        | Nullable                |
| `currency`   | text        | Default 'BRL'           |
| `locale`     | text        | Default 'pt-BR'         |
| `created_at` | timestamptz |                         |
| `updated_at` | timestamptz |                         |

### category

| Column       | Type        | Notes                           |
| ------------ | ----------- | ------------------------------- |
| `id`         | uuid        | PK                              |
| `user_id`    | uuid        | Nullable. null = system default |
| `name`       | text        | e.g., 'Alimentação'             |
| `icon`       | text        | Nullable                        |
| `color`      | text        | Nullable. Hex for charts        |
| `is_active`  | boolean     | Soft delete                     |
| `created_at` | timestamptz |                                 |
| `updated_at` | timestamptz |                                 |

**System defaults:** Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Compras, Outros

### expense

| Column                 | Type        | Notes                                      |
| ---------------------- | ----------- | ------------------------------------------ |
| `id`                   | uuid        | PK                                         |
| `user_id`              | uuid        | FK to auth.users                           |
| `category_id`          | uuid        | FK to category                             |
| `description`          | text        |                                            |
| `amount_cents`         | integer     | R$55,90 = 5590                             |
| `payment_method`       | text        | 'credit_card', 'debit_card', 'pix', 'cash' |
| `date`                 | date        | When expense occurred                      |
| `is_recurrent`         | boolean     | Default false                              |
| `recurrence_day`       | integer     | Nullable (1-31)                            |
| `recurrence_start`     | date        | Nullable                                   |
| `recurrence_end`       | date        | Nullable                                   |
| `installment_current`  | integer     | Nullable                                   |
| `installment_total`    | integer     | Nullable                                   |
| `installment_group_id` | uuid        | Nullable                                   |
| `created_at`           | timestamptz |                                            |
| `updated_at`           | timestamptz |                                            |

### salary_history

| Column           | Type        | Notes                    |
| ---------------- | ----------- | ------------------------ |
| `id`             | uuid        | PK                       |
| `user_id`        | uuid        | FK to auth.users         |
| `amount_cents`   | integer     | BRL in centavos          |
| `effective_from` | date        | When this salary started |
| `created_at`     | timestamptz |                          |

---

## Key Decisions

1. **Money as cents** — All amounts stored as integers (centavos)
2. **Installments as separate records** — 12x = 12 linked records
3. **Recurrent as virtual projection** — Single record, no background jobs
4. **Salary inline edit** — On /expenses page, creates history record
5. **Categories** — System defaults + user-created, duplicates allowed with UI warning
6. **Co-located files** — Components/hooks/tests in same folder (kebab-case)
7. **Controller → UseCase → Repository** — Backend architecture

---

## Indexes Strategy

Based on expected query patterns:

- `expense(user_id, date)` — Fetching user's expenses by month
- `expense(installment_group_id)` — Grouping installments
- `salary_history(user_id, effective_from)` — Finding active salary for a date
- `category(user_id)` — Fetching user's categories
