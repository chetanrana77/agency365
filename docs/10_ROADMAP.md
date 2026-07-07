# 10_ROADMAP.md — Product Roadmap & Milestones

This document establishes the feature scope, stabilization metrics, and deployment timeline of **Agency365**.

---

## Phase 1: Alpha (Current)
*Internal Techmize Use Only.*

### Goal:
Stabilize all core modules so Techmize can run daily operations completely inside Agency365. Do not expand the feature scope unless required for internal operations.

### Key Milestones:
- [x] Integrate live Supabase authentication.
- [x] Configure PostgreSQL table schemas and Row-Level Security policies.
- [x] Implement project deadline tracking.
- [x] Deploy project and link custom subdomain `365.techmize.in`.
- [ ] Achieve zero data synchronization errors over 30 days of daily use.
- [ ] Optimize loading times to ensure page transitions complete in under 500ms.

---

## Phase 2: Closed Beta
*Invite a small group of partner agencies.*

### Goal:
Collect feedback, resolve scalability bottlenecks, refine user flows, and optimize cross-device synchronization.

### Key Milestones:
- [ ] Build automated in-app crash reporting.
- [ ] Enable real-time updates using Supabase Realtime listeners.
- [ ] Conduct user testing to refine navigation and layouts on iOS and Android devices.
- [ ] Resolve any concurrency bugs when multiple team members edit the same client concurrently.

---

## Phase 3: Public Release
*Production SaaS Launch.*

### Goal:
Launch the platform publicly as a secure, scalable subscription SaaS.

### Key Milestones:
- [ ] Integrate Stripe billing for subscription management.
- [ ] Implement database-level automated daily backups.
- [ ] Verify compliance with security and privacy regulations (GDPR, CCPA).
- [ ] Complete automated unit and integration test coverage.
