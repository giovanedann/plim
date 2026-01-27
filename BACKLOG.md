# BACKLOG.md - Deferred Items

Items moved here are valuable but not critical for current stage. These were originally in PLAN.md Phase 18 but are deferred until after the AI-powered features are launched.

---

## Error Monitoring & Logging (from Phase 18.2)

- [ ] Set up Sentry for frontend error tracking
- [ ] Set up Sentry for API error tracking (Cloudflare Workers)
- [ ] Add structured logging to API endpoints

---

## CI/CD Pipeline (from Phase 18.3)

- [ ] Create GitHub Actions workflow for linting/typecheck on PR
- [ ] Create GitHub Actions workflow for running tests on PR
- [ ] Create GitHub Actions workflow for API deployment on merge to main
- [ ] Create GitHub Actions workflow for frontend deployment on merge to main
- [ ] Add branch protection rules

---

## Data & Backup (from Phase 18.6)

- [ ] Set up Supabase automated backups (check plan)
- [ ] Test backup restore procedure

---

## Analytics & Monitoring (from Phase 18.7)

- [ ] Add Plausible or similar privacy-friendly analytics
- [ ] Set up uptime monitoring (e.g., Checkly, Better Uptime)
- [ ] Create dashboard for key metrics (signups, active users)

---

## Notes

These items will be revisited after:

1. AI-powered agentic platform is launched (Phase 19)
2. Stripe billing integration is complete
3. User base has grown enough to justify the infrastructure investment

**Priority order when resuming:**

1. Error Monitoring (Sentry) - Critical for production debugging
2. CI/CD Pipeline - Important for team scaling
3. Analytics & Monitoring - Important for business metrics
4. Data & Backup - Important for compliance
