---
name: push
description: Use when ready to commit and push changes to GitHub - analyzes changes, creates atomic commits per feature/scope, and pushes to remote
---

# Push Workflow

Analyzes all changes, groups them into logical atomic commits, runs validations, and pushes to GitHub.

## Process

1. **Analyze changes** — `git status` and `git diff`
2. **Group by scope** — Separate commits per feature/module
3. **Create atomic commits** — One commit per logical change
4. **Push** — All commits to current branch

### Validations will be run automatically before pushing using Lefthook

## Grouping Strategy

Group changes by:
- **Package/app** — `apps/web`, `apps/api`, `packages/shared`
- **Feature** — Related files that form one logical change
- **Type** — Separate features from fixes from refactors

### Example Grouping

If changes include:
```
apps/api/src/routes/expenses.ts
apps/api/src/services/expense-service.ts
apps/api/tests/expenses.test.ts
apps/web/src/features/expenses/ExpenseForm.tsx
apps/web/src/features/expenses/api.ts
packages/shared/schemas/expense.ts
```

Creates commits:
```
1. feat(shared): add expense validation schema
2. feat(api): add expense CRUD endpoints
3. test(api): add expense endpoint tests
4. feat(web): add expense form component
```

## Commit Message Format

```
<type>(<scope>): <subject>
```

### Types

| Type | When |
|------|------|
| `feat` | New feature or functionality |
| `fix` | Bug fix |
| `refactor` | Code restructure (no new feature or fix) |
| `style` | Formatting only |
| `test` | Adding/updating tests |
| `docs` | Documentation |
| `chore` | Maintenance (deps, config, build) |

### Scopes

| Scope | When |
|-------|------|
| `api` | Backend API changes |
| `web` | Frontend changes |
| `shared` | Shared package changes |
| `expenses` | Expense feature (cross-cutting) |
| `auth` | Authentication |
| `categories` | Categories feature |
| `budgets` | Budgets feature |
| `deps` | Dependency updates |

## Execution Flow

```
1. git status → identify all changed files
2. Analyze and group files logically
3. Run: pnpm typecheck && pnpm lint && pnpm test
4. For each group:
   a. git add <files in group>
   b. git commit -m "<type>(<scope>): <subject>"
5. git push
```

## Rules

- **Atomic commits** — Each commit should be one logical change
- **Buildable commits** — Each commit should pass CI individually
- **Clear messages** — Describe WHAT changed, code shows HOW
- **Tests with features** — If adding feature, include tests in same or adjacent commit

## Pre-Push Validations

Must pass before any commits:
```bash
pnpm typecheck   # TypeScript compilation
pnpm lint        # ESLint
pnpm test        # All tests
```

If any fail, fix issues first.

## Branch Handling

- If on `main`, prompt to create feature branch first
- Push to current branch with `git push`
- Use `--force-with-lease` only after intentional rebase
