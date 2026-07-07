# 00_START_HERE.md — Project Overview & Codebase Entry Point

Welcome to **Agency365**. This document serves as the primary onboarding file and developer entry point for the project. All developers (human and AI agents) must read this document and the accompanying docs in this directory before modifying any code.

---

## 1. Project Mission & Vision
Agency365 is designed to be the definitive operating system for digital agencies. It consolidates CRM (lead management), clients, billing, proposals, project tracking, meetings, calendar events, and client communication into a single unified workspace.

Our architectural philosophy is focused on building a scalable, maintainable, production-ready SaaS. We do not patch over symptoms; we address architectural technical debt first, ensuring long-term sustainability.

---

## 2. Directory Structure
```
/agency365            # Workspace root
  ├── docs/           # Engineering documentation (this directory)
  ├── icons/          # App assets and PWA icons
  ├── app.js          # Core app lifecycle, routing, global event hooks
  ├── supabaseClient.js# Supabase dynamically initialized connection wrapper
  ├── styles.css      # Core Vanilla CSS design tokens and style rules
  ├── mobile-overrides.css# Targeted layout overrides for tablets and mobile devices
  ├── sw.js           # PWA Service Worker caching app assets
  ├── manifest.json   # PWA application manifest
  ├── onboarding.html # Public client-self-onboarding form
  ├── portal.html     # Public customer read-only view dashboard
  └── [feature].html  # Standalone feature pages (dashboard, clients, crm, calendar, proposals, finance, account, revenue)
```

---

## 3. Core Technologies
- **Front-End:** Vanilla HTML5, ES6+ Javascript Modules, and Vanilla CSS (no framework wrappers like React or Vue; no Tailwind CSS).
- **Backend/Database:** Supabase (PostgreSQL) for Authentication, Row-Level Security (RLS) data isolation, dynamic real-time sync, and relational storage.
- **Client Sync:** Fallback to client-side `localStorage` sync, dynamically updating Supabase backend on mutation.

---

## 4. Documentation Index
Every developer must review the following documents in order before making changes:

1. **[01_PRODUCT.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/01_PRODUCT.md)**: Product goals, modules, target users, and release phases.
2. **[02_ARCHITECTURE.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/02_ARCHITECTURE.md)**: System design, data flow, dynamic modules, and sync strategy.
3. **[03_DATABASE.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/03_DATABASE.md)**: PostgreSQL schema details, relational integrity, index usage, and Row Level Security (RLS) policies.
4. **[04_AI_RULES.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/04_AI_RULES.md)**: Mandates, rules, and procedures for AI coding agents.
5. **[05_CODING_STANDARDS.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/05_CODING_STANDARDS.md)**: JS conventions, file structures, state isolation, and DOM selectors rules.
6. **[06_UI_DESIGN_SYSTEM.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/06_UI_DESIGN_SYSTEM.md)**: HSL color palettes, typography scale, spacing rules, and responsive design variables.
7. **[07_SECURITY.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/07_SECURITY.md)**: Authentication protocols, input validation, XSS prevention, and access token scoping.
8. **[08_API_GUIDELINES.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/08_API_GUIDELINES.md)**: Guidelines for asynchronous network requests, error states, and external integrations (Supabase / Gemini).
9. **[09_DEPLOYMENT.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/09_DEPLOYMENT.md)**: Deployment environment mapping, CI/CD pipeline overview, and DNS configurations.
10. **[10_ROADMAP.md](file:///Users/chetanrana/Antigravity%20Codes/project-365/docs/10_ROADMAP.md)**: Transition plan from Alpha (Internal Techmize use) to Closed Beta and Public release.
