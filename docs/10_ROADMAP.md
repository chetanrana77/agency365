# 10_ROADMAP.md — Product Roadmap & Evolution Milestones

This document establishes the official development sprints, releases, and milestones for **Agency365**.

---

## 🔄 Release & Evolution Strategy

We follow an **Evolution Strategy** rather than a "big bang" rewrite.
- **Maintain Stability:** Keep the current Alpha running live for Techmize's daily internal operations.
- **Incremental Refactoring:** Build the V2 architecture underneath the active application module-by-module (CRM → Finance → Calendar → Portal).
- **Gradual Migration:** Migrate data incrementally, maintaining backward compatibility at each deployment milestone.

---

## 🏃 Engineering Sprints

### Sprint 1 — Stabilize Alpha (Current)
- **Goal:** Resolve immediate blocking bugs, optimize loading metrics, and ensure zero data loss during daily Techmize usage.
- [x] Integrate real Supabase Authentication.
- [x] Configure PostgreSQL table schemas and Row-Level Security policies.
- [x] Implement project deadline tracking.
- [x] Deploy project and link custom subdomain `365.techmize.in`.
- [ ] Monitor and eliminate sync errors.
- [ ] Optimize initial page load times below 500ms.

---

### Sprint 2A — Database Normalization
- **Goal:** Design and migrate from the giant Client JSON blob to a relational schema.
- [ ] Deliverable: Entity Relationship Diagram (ERD) & Database Blueprint
- [ ] Deliverable: Table Definitions (clients, tasks, meetings, payments, expenses)
- [ ] Deliverable: Foreign Keys & Relational Constraints
- [ ] Deliverable: Index Strategy & Soft Deletion schema
- [ ] Deliverable: Migration SQL Scripts

---

### Sprint 2B — Organization Layer
- **Goal:** Establish multi-tenant boundaries, teams, and role-based access.
- [ ] Deliverable: Organizations and Profiles Tables
- [ ] Deliverable: Team Members, Roles, and Permissions matrix
- [ ] Deliverable: Invitation Flow architecture
- [ ] Deliverable: Tenant Isolation mechanisms
- [ ] Deliverable: Row-Level Security (RLS) Policies

---

### Sprint 3 — Repository Pattern & Service Layer
- **Goal:** Decouple DOM manipulation and business rules from the data layer.
- [ ] Create the Service Layer (`ClientService`, `FinanceService`, `ProposalService`, `NotificationService`).
- [ ] Implement the Repository Pattern to abstract localStorage caches and Supabase queries.
- [ ] Introduce custom permission matrices (e.g. `CanCreateProposal`, `CanViewFinance`).

---

### Sprint 4 — Module Decomposition
- **Goal:** Split large scripts (e.g. `client-detail.js`) into single-responsibility modules.
- [ ] Refactor `client-detail.js` into sub-modules (Overview, Meetings, Work Updates, Communications, Finance).
- [ ] Restructure directory to group by module domain:
  ```text
  modules/
    ├── clients/
    ├── finance/
    └── calendar/
  ```
- [ ] Ensure all Javascript files are under 500 lines.

---

### Sprint 5 — Performance & Event Engine
- **Goal:** Enable pagination, search debouncing, and event-driven updates.
- [ ] Implement pagination and virtual lists for large tables.
- [ ] Build an in-memory Pub/Sub event system (e.g. `PaymentCreated` triggers dashboard, analytics, and notification updates).
- [ ] Implement debounced client-side searches.

---

### Sprint 6 — AI, Automation & Developer Experience
- **Goal:** Finalize SaaS scaling features, automated test coverage, and public API.
- [ ] Implement Gemini AI project proposal templates generator.
- [ ] Configure ESLint, Prettier, Husky pre-commit hooks.
- [ ] Implement Stripe Billing engine integration.
- [ ] Establish Storybook component registry for the Design System.
