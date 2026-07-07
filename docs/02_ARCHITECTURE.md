# 02_ARCHITECTURE.md — System Architecture & Design

This document details the architectural patterns, data synchronization mechanisms, and code structure of **Agency365**.

---

## 1. Architectural Philosophy
Agency365 is designed as a **decentralized, offline-first client-side web application** that utilizes a remote backend (Supabase) as its centralized source of truth.

### Key Tenets:
- **Zero Framework Footprint:** Built on native ES6 Javascript Modules and Vanilla CSS. No compile/build step is required for local development.
- **Offline-First Resilience:** Data is written to `localStorage` first. Mutations automatically trigger asynchronous sync operations to Supabase. This guarantees that UI rendering is instantaneous and network drops do not block operational workflows.
- **Dynamic Imports:** Supabase SDK is loaded dynamically on boot, ensuring that failure to reach the CDN does not crash the local application layer.

---

## 2. Global Component Mapping

```mermaid
graph TD
    User([User Browser]) --> UI[HTML DOM Pages]
    UI --> App[app.js Lifecycle & Guard]
    App --> FeatureJS[Page JS Module: dashboard.js, clients.js, crm.js...]
    FeatureJS --> LocalStore[(localStorage Cache)]
    LocalStore --> SyncPatch[supabaseClient.js Monkey-Patch]
    SyncPatch --> Supabase[(Supabase Backend Database)]
```

### Component Responsibilities:
- **`app.js`**: Orchestrates application boot, manages user authentication, global session guards, custom dialog modules (window.customConfirm, window.customPrompt), keyboard shortcuts, notifications, and pull-to-refresh.
- **`supabaseClient.js`**: Configures the Supabase client wrapper, handles user login/signup database calls, dynamically intercepts all `localStorage.setItem` calls, and pushes updates asynchronously.
- **`styles.css` & `mobile-overrides.css`**: Define the design system tokens, typography scales, light/dark themes, desktop layouts, and responsive tablet/mobile overrides.

---

## 3. Data Synchronization Strategy

### A. Read Operations (Bootstrap)
On application load, `app.js` triggers `syncFromSupabase()`.
1. The user's active session is verified via `supabase.auth.getUser()`.
2. Asynchronous parallel requests fetch data from the tables: `clients`, `proposals`, `expenses`, and `events`.
3. The returned datasets overwrite local keys (`agency365_clients`, etc.) in `localStorage` using the underlying original `setItem` function to prevent trigger recursion.

### B. Write Operations (Upsert Strategy)
To maintain simplicity and prevent sync conflicts:
1. When page Javascript mutates data (e.g. adding a meeting inside clients array), it updates its in-memory array and calls `localStorage.setItem('agency365_clients', JSON.stringify(clients))`.
2. The monkey-patched `setItem` intercepts this call.
3. An asynchronous deletion removes all remote rows matching the current `user_id`.
4. The entire locally mutated array is mapped to new rows containing `{ user_id, data: itemObject }` and bulk-inserted into Supabase.

---

## 4. Key Architectural Restrictions
- **No Shared State Across Modules:** Modules must load state directly from the centralized `localStorage` keys or session caches during initialization.
- **No UI-Blocking API Requests:** Network database writes must always run in the background. The interface must transition states instantly based on successful local cache mutations.

---

## 5. Architectural Debt & Scaling Redesign (P0/P1)

### A. Current Architectural Technical Debt
- **LocalStorage as Database:** LocalStorage is the primary source of truth, causing sync conflicts and making multi-device/team collaboration fragile.
- **Giant Client Object:** Nested tables (`tasks[]`, `meetings[]`, `payments[]`, `expenses[]`) are stored inside a single client JSONB column, leading to bloated payloads, slow updates, and un-indexable queries.
- **Mixed Concerns:** UI rendering, calculation rules, storage logic, validation, and notifications are coupled inside files like `client-detail.js`.

### B. Target SaaS Architecture (Sprints 3 & 4)
We are migrating to a decoupled architecture utilizing the **Repository Pattern** and **Service Layer**:

```text
[UI Layer / Modules]
       ↓
[Service Layer] (ClientService, FinanceService, etc. - holds business logic)
       ↓
[Repository Layer] (Handles localStorage caching + Supabase queries)
       ↓
[Data Store] (Supabase Database as Central Source of Truth)
```

1. **Repository Pattern:** Page scripts must not make direct Supabase calls. All database reads and writes go through localized repository classes (e.g. `ClientRepository`) which manage local caching and network synchronization transparently.
2. **Service Layer:** Houses reusable business logic (e.g. calculating health scores, invoicing counters, routing updates).
3. **Decomposition:** Large files must be split into single-responsibility scripts. No Javascript file should exceed 500 lines.
4. **Domain-Driven Directory Structure:** Legacy root scripts must be grouped by module boundary:
   ```text
   modules/
     ├── clients/
     ├── finance/
     ├── calendar/
     └── crm/
   ```

