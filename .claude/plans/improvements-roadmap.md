# Plim - Improvements Roadmap

This document outlines proposed improvements to elevate the Plim application from its current senior-level implementation to industry-leading standards.

## Current Assessment Summary

- **Security:** 9/10
- **UI/UX:** 8/10
- **Seniority:** 9/10
- **Architecture:** 9/10
- **Overall:** 8.75/10

---

## 1. E2E Testing Suite

**Priority:** High
**Effort:** Medium (2-3 weeks)
**Impact:** Improves confidence in deployments, catches integration bugs

### Implementation Plan

#### Tools
- **Playwright** (recommended) or Cypress
- Test environments: Chrome, Firefox, Safari (WebKit)
- CI/CD integration

#### Test Coverage

**Critical Flows:**
- [ ] User registration with email verification
- [ ] Sign in with email/password
- [ ] Sign in with Google OAuth
- [ ] Password reset flow (request → OTP → password update)
- [ ] Onboarding flow (6 steps)
- [ ] Create one-time expense
- [ ] Create installment expense
- [ ] Create recurrent expense
- [ ] Edit/delete expense
- [ ] Category management
- [ ] Spending limit warnings
- [ ] Profile updates (name, currency, locale)
- [ ] Avatar upload
- [ ] Salary history tracking
- [ ] Dark mode toggle persistence

**Performance Tests:**
- [ ] Page load times < 2s
- [ ] Form submission responsiveness
- [ ] Table rendering with 100+ expenses

#### File Structure
```
apps/web/
└── e2e/
    ├── auth/
    │   ├── sign-in.spec.ts
    │   ├── sign-up.spec.ts
    │   └── password-reset.spec.ts
    ├── expenses/
    │   ├── create-expense.spec.ts
    │   ├── edit-expense.spec.ts
    │   └── delete-expense.spec.ts
    ├── onboarding/
    │   └── onboarding-flow.spec.ts
    ├── profile/
    │   └── profile-management.spec.ts
    └── fixtures/
        ├── test-users.json
        └── test-data.json
```

#### CI Integration
- Run on every PR
- Fail builds on test failures
- Screenshot/video capture on failures
- Parallel test execution

---

## 2. Comprehensive Accessibility Audit

**Priority:** High
**Effort:** Medium (2-3 weeks)
**Impact:** Legal compliance, inclusive design, broader user base

### WCAG 2.1 AA Compliance Targets

#### Level A Requirements
- [x] Semantic HTML structure
- [x] Form labels properly associated
- [x] Color not sole differentiator
- [x] Keyboard navigable
- [ ] **Missing:** Skip navigation links
- [ ] **Missing:** Page titles for all routes
- [ ] **Missing:** Logical heading hierarchy (H1 → H2 → H3)

#### Level AA Requirements
- [ ] Contrast ratios: 4.5:1 for normal text, 3:1 for large text
- [ ] Focus indicators on all interactive elements
- [ ] ARIA live regions for dynamic content
- [ ] Alt text for all images
- [ ] Form error identification and suggestions
- [ ] Consistent navigation across pages
- [ ] Multiple ways to find pages (search, sitemap)

### Implementation Tasks

#### Audit Tools
- [ ] Install axe DevTools extension
- [ ] Run Lighthouse accessibility audit
- [ ] Test with NVDA/JAWS screen readers
- [ ] Keyboard-only navigation testing
- [ ] Color contrast validation

#### Code Improvements
- [ ] Add `aria-live="polite"` to toast notification container
- [ ] Add `aria-describedby` to complex form fields
- [ ] Implement focus trap in modals (verify Radix handles this)
- [ ] Add skip to main content link
- [ ] Ensure all icon buttons have accessible labels
- [ ] Add `role="status"` for loading states
- [ ] Verify heading hierarchy on all pages
- [ ] Add landmark roles (`main`, `nav`, `complementary`)

#### Documentation
- [ ] Create accessibility statement page
- [ ] Document keyboard shortcuts
- [ ] Add ARIA label conventions to component guidelines
- [ ] Create accessibility testing checklist for PRs

---

## 3. Performance Monitoring Integration

**Priority:** Medium
**Effort:** Low (1 week)
**Impact:** Visibility into production issues, optimization targets

### Metrics to Track

#### Frontend Metrics
- Core Web Vitals (LCP, FID, CLS)
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- API response times
- Bundle size tracking

#### Backend Metrics
- API endpoint response times
- Database query performance
- Cloudflare Workers execution time
- Rate limit hit rates
- Error rates by endpoint

### Tools

**Option 1: Cloudflare Analytics**
- Built-in for Cloudflare Workers
- No additional cost
- Real User Monitoring (RUM)

**Option 2: Vercel Analytics** (if using Vercel for web)
- Web Vitals tracking
- Audience insights
- Free tier available

**Option 3: Sentry Performance**
- Combined with error tracking
- Transaction tracing
- Database query monitoring

### Implementation

```typescript
// apps/web/src/lib/analytics.ts
export const trackWebVitals = (metric: Metric) => {
  // Send to analytics service
  if (import.meta.env.PROD) {
    sendToAnalytics({
      name: metric.name,
      value: metric.value,
      id: metric.id,
    })
  }
}

// apps/api/src/middleware/performance.middleware.ts
export const performanceMiddleware = async (c: Context, next: Next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start

  // Log slow requests
  if (duration > 1000) {
    console.warn(`Slow request: ${c.req.path} took ${duration}ms`)
  }
}
```

#### Alerts
- [ ] Set up alerts for errors > 1% of requests
- [ ] Alert on API response time > 2s
- [ ] Alert on LCP > 2.5s
- [ ] Alert on rate limit threshold reached

---

## 4. Error Tracking Service

**Priority:** High
**Effort:** Low (1 week)
**Impact:** Faster debugging, production issue visibility

### Recommended Tool: Sentry

**Why Sentry:**
- Free tier (5k events/month)
- Source map support
- Breadcrumbs for debugging
- Release tracking
- Performance monitoring included
- Cloudflare Workers integration

### Implementation

#### Installation
```bash
pnpm add @sentry/react @sentry/vite-plugin
pnpm add -D @sentry/cloudflare
```

#### Frontend Setup
```typescript
// apps/web/src/main.tsx
import * as Sentry from '@sentry/react'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}
```

#### Backend Setup
```typescript
// apps/api/src/index.ts
import { touchSentryContext } from '@sentry/cloudflare'

app.use('*', async (c, next) => {
  touchSentryContext(c.executionContext)
  await next()
})

app.onError((err, c) => {
  Sentry.captureException(err, {
    contexts: {
      request: {
        url: c.req.url,
        method: c.req.method,
        headers: c.req.header(),
      },
    },
  })
  return errorHandler(err, c)
})
```

#### Context Enrichment
- [ ] Add user ID to Sentry context
- [ ] Tag errors by API endpoint
- [ ] Capture request/response in breadcrumbs
- [ ] Set up release tracking with git commits
- [ ] Configure source maps for production

---

## 5. Internationalization (i18n) Support

**Priority:** Medium
**Effort:** High (3-4 weeks)
**Impact:** Global market expansion, better UX for non-English users

### Target Languages (Phase 1)
- Portuguese (BR) - primary market
- English (US) - secondary
- Spanish (LATAM) - expansion

### Implementation Approach

#### Tool: i18next + react-i18next

**Why i18next:**
- Industry standard
- TypeScript support
- Lazy loading of translations
- Pluralization/interpolation support
- Date/number formatting

#### Installation
```bash
pnpm add i18next react-i18next i18next-browser-languagedetector
```

#### File Structure
```
apps/web/
└── src/
    └── locales/
        ├── pt-BR/
        │   ├── common.json
        │   ├── auth.json
        │   ├── expenses.json
        │   ├── profile.json
        │   └── errors.json
        ├── en-US/
        │   └── [same structure]
        └── es-LATAM/
            └── [same structure]
```

#### Implementation Tasks

**Setup:**
- [ ] Configure i18next with language detector
- [ ] Create translation files for all UI strings
- [ ] Extract hardcoded strings to translation keys
- [ ] Add language switcher to settings
- [ ] Store language preference in profile

**Number/Currency Formatting:**
- [ ] Use `Intl.NumberFormat` for currency display
- [ ] Respect user's currency preference (BRL/USD/EUR)
- [ ] Format dates using `Intl.DateTimeFormat`

**Validation Messages:**
- [ ] Translate Zod error messages
- [ ] Use i18next in schema validation

**Backend:**
- [ ] Send API errors in user's preferred language
- [ ] Translate email templates
- [ ] Add `Accept-Language` header parsing

#### Example Usage
```typescript
// Before
<h1>Bem-vindo ao Plim</h1>

// After
import { useTranslation } from 'react-i18next'

const { t } = useTranslation('common')
<h1>{t('welcome')}</h1>
```

---

## 6. Documentation

**Priority:** Medium
**Effort:** Medium (2-3 weeks)
**Impact:** Easier onboarding, maintainability, contribution

### 6.1 API Documentation

#### Tool: OpenAPI (Swagger)

**Implementation:**
```typescript
// apps/api/src/openapi.ts
import { OpenAPIHono } from '@hono/zod-openapi'

const app = new OpenAPIHono()

app.openapi(
  {
    method: 'post',
    path: '/expenses',
    request: {
      body: {
        content: {
          'application/json': {
            schema: createExpenseSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Expense created successfully',
        content: {
          'application/json': {
            schema: expenseSchema,
          },
        },
      },
    },
  },
  createExpenseHandler
)
```

**Documentation Site:**
- [ ] Generate OpenAPI spec from Zod schemas
- [ ] Set up Swagger UI at `/api/docs`
- [ ] Document authentication flow
- [ ] Add example requests/responses
- [ ] Document error codes

### 6.2 Component Storybook

#### Tool: Storybook

**Installation:**
```bash
pnpm dlx storybook@latest init
```

**Component Coverage:**
- [ ] All UI primitives (`/components/ui/`)
- [ ] Form components
- [ ] Complex widgets (expense modal, onboarding)
- [ ] Layout components
- [ ] Dark mode variants

**Story Examples:**
```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'default',
  },
}
```

**Addons:**
- [ ] a11y addon for accessibility testing
- [ ] viewport addon for responsive testing
- [ ] interactions addon for testing user flows

### 6.3 Developer Documentation

**Create `/docs` directory:**

**README Updates:**
- [ ] Update root README with project overview
- [ ] Add architecture diagram
- [ ] Document development setup
- [ ] Add contribution guidelines

**Documentation Files:**
- [ ] `/docs/architecture.md` - System design, database schema
- [ ] `/docs/authentication.md` - Auth flow, JWT handling
- [ ] `/docs/deployment.md` - Deployment process, env vars
- [ ] `/docs/testing.md` - Testing strategy, how to run tests
- [ ] `/docs/security.md` - Security practices, encryption
- [ ] `/docs/troubleshooting.md` - Common issues and solutions

**Code Comments:**
- [ ] Add JSDoc to complex functions
- [ ] Document business logic in use cases
- [ ] Add inline comments for encryption/security code

---

## Implementation Priorities

### Phase 1: Critical (Next 1-2 months)
1. **Error tracking** - Immediate production visibility
2. **E2E testing** - Prevent regressions
3. **Accessibility audit** - Compliance and inclusivity

### Phase 2: Important (Months 3-4)
4. **Performance monitoring** - Optimize based on real data
5. **API documentation** - Enable future integrations
6. **Component storybook** - Developer experience

### Phase 3: Nice-to-Have (Months 5-6)
7. **Internationalization** - Market expansion when ready

---

## Success Metrics

### Testing
- E2E test coverage: > 80% of critical user flows
- All tests passing in CI/CD
- Test execution time < 5 minutes

### Accessibility
- Lighthouse accessibility score: > 95
- Zero axe violations
- Screen reader testing on 3+ critical flows

### Performance
- API p95 response time: < 500ms
- Web Vitals: All in "Good" range (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- Error rate: < 0.5%

### Documentation
- API documentation coverage: 100% of endpoints
- Storybook coverage: 100% of reusable components
- Developer docs: Setup, architecture, deployment complete

---

## Estimated Total Effort

- **E2E Testing:** 2-3 weeks
- **Accessibility Audit:** 2-3 weeks
- **Performance Monitoring:** 1 week
- **Error Tracking:** 1 week
- **Internationalization:** 3-4 weeks
- **Documentation:** 2-3 weeks

**Total:** 11-17 weeks (2.5-4 months) for full implementation

**Note:** These can be parallelized across multiple developers or tackled incrementally in sprints.
