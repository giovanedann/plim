# Plim App - Implementation Plan

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

### Phase 4: API - Auth & Profile ✅

- [x] Set up Hono with Cloudflare Workers
- [x] Create auth middleware (Supabase JWT verification)
- [x] Create error handling middleware
- [x] Implement `GET /profile` endpoint
- [x] Implement `PATCH /profile` endpoint
- [x] Write tests for profile endpoints

### Phase 5: API - Categories ✅

- [x] Implement `GET /categories` (user's + defaults)
- [x] Implement `POST /categories`
- [x] Implement `PATCH /categories/:id`
- [x] Implement `DELETE /categories/:id` (soft delete)
- [x] Write tests for category endpoints

### Phase 6: API - Expenses ✅

- [x] Implement `GET /expenses` with filters (date range, category, payment method)
- [x] Implement `POST /expenses` (one-time)
- [x] Implement `POST /expenses` (recurrent)
- [x] Implement `POST /expenses` (installments - creates multiple records)
- [x] Implement `PATCH /expenses/:id`
- [x] Implement `DELETE /expenses/:id`
- [x] Implement logic for projecting recurrent expenses
- [x] Write tests for expense endpoints

### Phase 7: API - Salary ✅

- [x] Implement `GET /salary?month=YYYY-MM` (returns active salary for month)
- [x] Implement `POST /salary` (create new salary history record)
- [x] Implement `GET /salary/history` (all salary changes)
- [x] Write tests for salary endpoints

### Phase 8: Frontend - Setup ✅

- [x] Initialize Vite + React
- [x] Set up Tailwind CSS
- [x] Set up shadcn/ui
- [x] Set up dark/light mode (shadcn theme provider)
- [x] Set up React Router v7
- [x] Set up React Query
- [x] Set up Zustand
- [x] Create base layout components

### Phase 9: Frontend - Auth Pages ✅

- [x] Create `/sign-in` page
- [x] Create `/sign-up` page
- [x] Implement Supabase Auth integration (Google OAuth)
- [x] Create auth guards for protected routes

**Auth UI Design**: Split-screen layout

- Left side: Dark panel (`bg-slate-950`) with floating animated Lucide finance icons (Wallet, CreditCard, PiggyBank, etc.) using CSS keyframe animations
- Right side: Themed form area with logo, form card, social sign-in buttons, and link to alternate auth page

### Phase 10: Frontend - Onboarding ✅

**Status:** ✅ Complete (2026-01-19)

- [x] Create onboarding flow after sign-up
- [x] Step 1: Welcome screen (app intro)
- [x] Step 2: Set initial salary
- [x] Step 3: Choose preferred categories (or keep defaults)
- [x] Step 4: Add first expense (guided)
- [x] Mark user as onboarded in profile
- [x] Skip onboarding for returning users

### Phase 11: Frontend - Expenses Page ✅

- [x] Create `/expenses` page layout
- [x] Implement month selector (navigation)
- [x] Implement salary display + inline edit
- [x] Implement expenses table with filters
- [x] Create add/edit expense modal with type selector (one-time, recurrent, installments)
- [x] Implement conditional form fields per expense type
- [x] Implement delete expense confirmation

### Phase 12: Frontend - Dashboard ✅

**Status:** ✅ Complete (2026-01-21)

#### API Endpoints (8 total)

- [x] `GET /dashboard/summary` - KPI summary with period comparison
- [x] `GET /dashboard/expenses-timeline` - Daily/weekly/monthly expense trends
- [x] `GET /dashboard/income-vs-expenses` - Income vs expenses comparison
- [x] `GET /dashboard/category-breakdown` - Expenses by category
- [x] `GET /dashboard/payment-breakdown` - Expenses by payment method
- [x] `GET /dashboard/savings-rate` - Monthly savings rate trends
- [x] `GET /dashboard/salary-timeline` - Salary history over time
- [x] `GET /dashboard/installment-forecast` - Future installment payments

#### Frontend Components

- [x] Create `/dashboard` page layout with responsive grid
- [x] Implement TimeRangeSelector (7d, 30d, 90d, 12m, YTD)
- [x] Implement SummaryCards (income, expenses, balance, savings rate)
- [x] Implement IncomeExpensesChart (bar chart comparison)
- [x] Implement ExpensesTimelineChart (area chart)
- [x] Implement SavingsRateChart (line chart with trend)
- [x] Implement CategoryBreakdownChart (pie chart)
- [x] Implement PaymentBreakdownChart (pie chart)
- [x] Implement TopCategoriesChart (horizontal bar chart)
- [x] Implement SalaryTimelineChart (line chart)
- [x] Implement InstallmentForecast (bar chart with totals)
- [x] Create useDashboard hook with React Query integration
- [x] Add chart color CSS variables for dark/light themes

### Phase 13: Profile Page & R2 File Storage ✅

**Status:** ✅ Complete (2026-01-21)

- [x] Create `/profile` page with edit form (name, currency, locale)
- [x] User can edit all profile information
- [x] Set up Cloudflare R2 bucket for avatar storage
- [x] Implement avatar upload endpoint (Workers → R2)
- [x] Configure R2 public access for avatar URLs
- [x] Add avatar upload UI with preview and confirm flow
- [x] Allow users to override OAuth avatar with custom upload
- [x] Update sidebar to prioritize custom avatar over OAuth avatar
- [x] Add dev scripts for remote R2 bindings during local development

### Phase 14

#### IMPORTANT FOR PHASE 14: I want a different landing page. I want to show 1 page/functionality at the time while users scrolls

#### to implement that, i want to add something like: 1st section: image on the left (animated, floating), and a description on the right. When the user scrolls to the next section, the image animate to the right, and the description now is on the left, on that transition, i want to switch images

- [ ] Create `/landing` page (marketing)
- [ ] Add marketing elements (with mocked prices for now)
- [ ] Add image/text switching mock
- [ ] add dashboard section
- [ ] add expenses section
- [ ] add categories section
- [ ] add profile section

### Phase 15: Frontend - Categories Management ✅

- [x] Create icon registry with type-safe Lucide mapping (54 icons in 10 groups)
- [x] Create CategoryIcon component with color and hover animation support
- [x] Show category icons in expense modal and table
- [x] Create IconPicker component with search and grouped display
- [x] Create ColorPicker component with 12-color preset palette
- [x] Implement inline category creation from expense modal ("Criar nova categoria")
- [x] Create `/categories` management page with CRUD operations
- [x] Separate system categories (read-only) from user categories (editable)
- [x] Add categories link to sidebar navigation

### Phase 16: Fancy 404 page

- [ ] Add fancy 404 page with animations and branding

### Phase 17: Deployment

- [ ] Deploy API to Cloudflare Workers
- [ ] Deploy frontend to Cloudflare Pages
- [ ] Configure environment variables
- [ ] Set up CI/CD (GitHub Actions)

---

## Entity Design Reference

### profile

| Column         | Type        | Notes                   |
| -------------- | ----------- | ----------------------- |
| `user_id`      | uuid        | PK, FK to auth.users.id |
| `name`         | text        |                         |
| `email`        | text        | Denormalized from auth  |
| `avatar_url`   | text        | Nullable                |
| `currency`     | text        | Default 'BRL'           |
| `locale`       | text        | Default 'pt-BR'         |
| `is_onboarded` | boolean     | Default false           |
| `created_at`   | timestamptz |                         |
| `updated_at`   | timestamptz |                         |

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
8. **Dark/Light mode** — shadcn theme provider, system preference default
9. **Onboarding flow** — Guided setup after sign-up (salary, categories, first expense)

---

## UI/Layout Style Guide

**Reference:** shadcn/ui examples

- Dashboard layout: <https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard>
- Tasks/table layout: <https://ui.shadcn.com/examples/tasks>

### App Shell Structure

```
SidebarProvider
├── AppSidebar (collapsible sidebar with navigation)
└── SidebarInset
    ├── SiteHeader (page title + theme toggle)
    └── Main Content Area
```

### Layout Patterns

1. **Sidebar** — Collapsible navigation with:
   - Logo/brand in header
   - Main navigation links (Dashboard, Despesas, Categorias)
   - User profile + logout in footer
   - Keyboard shortcut: `Ctrl/Cmd + B` to toggle

2. **Page Content** — Consistent spacing:

   ```tsx
   <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
     <div className="px-4 lg:px-6">{/* Page description */}</div>
     <div className="px-4 lg:px-6">{/* Content sections */}</div>
   </div>
   ```

3. **Card Grids** — Responsive columns:
   - Summary cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
   - Charts: `grid-cols-1 md:grid-cols-2`

4. **Tables** — Use shadcn Table component with rounded borders

### Page-Specific Guidelines

- **Dashboard** — Summary cards at top, charts below (Phase 12)
- **Expenses** — Salary cards, filters bar, data table

---

## Indexes Strategy

Based on expected query patterns:

- `expense(user_id, date)` — Fetching user's expenses by month
- `expense(installment_group_id)` — Grouping installments
- `salary_history(user_id, effective_from)` — Finding active salary for a date
- `category(user_id)` — Fetching user's categories
