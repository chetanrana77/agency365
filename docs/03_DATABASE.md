# 03_DATABASE.md — Supabase Database & Security Schema

This document specifies the PostgreSQL tables, indexes, and Row-Level Security (RLS) policies of the **Agency365** database.

---

## 1. Database Schema

All tables reside within the public schema of project ID `nytzlivcfiflqmqnjivd` on Supabase.

### A. Core Data Tables
These tables hold the JSONB data structures representing the application state.

#### Table: `clients`
Holds metadata and history arrays for all clients and leads.
- `id` (uuid, primary key): Defaults to `gen_random_uuid()`
- `user_id` (uuid): References `auth.users(id)` (cascade delete)
- `item_id` (text): Unique client identifier matching local model's ID field
- `data` (jsonb): Clean payload data mapping the client model
- `created_at` (timestamptz): Defaults to `now()`
- `updated_at` (timestamptz): Defaults to `now()`

#### Table: `proposals`
- `id` (uuid, primary key)
- `user_id` (uuid, references `auth.users(id)`)
- `item_id` (text)
- `data` (jsonb)
- `created_at` (timestamptz)

#### Table: `expenses`
- `id` (uuid, primary key)
- `user_id` (uuid, references `auth.users(id)`)
- `item_id` (text)
- `data` (jsonb)
- `created_at` (timestamptz)

#### Table: `events` (Calendar)
- `id` (uuid, primary key)
- `user_id` (uuid, references `auth.users(id)`)
- `item_id` (text)
- `data` (jsonb)
- `created_at` (timestamptz)

---

### B. System Configuration Tables

#### Table: `team_members`
Holds user roles and organizational boundaries.
- `id` (uuid, primary key)
- `owner_id` (uuid, references `auth.users(id)`)
- `email` (text): Target user email
- `name` (text): Display name
- `role` (text): `'admin'` | `'manager'` | `'member'`
- `org_id` (uuid): Ties users to same workspace boundary
- `status` (text): `'pending'` | `'active'`
- `invited_at` (timestamptz)

#### Table: `onboarding_tokens`
Tokens for public customer self-onboarding forms.
- `id` (uuid, primary key)
- `user_id` (uuid, references `auth.users(id)`)
- `client_id` (text): Unique string mapping target client record
- `token` (uuid, unique)
- `used` (boolean): Default `false`
- `expires_at` (timestamptz)

#### Table: `portal_tokens`
Tokens for public customer portals.
- `id` (uuid, primary key)
- `user_id` (uuid, references `auth.users(id)`)
- `client_id` (text)
- `token` (text, unique)

#### Table: `notifications`
- `id` (uuid, primary key)
- `user_id` (uuid, references `auth.users(id)`)
- `message` (text)
- `type` (text): Default `'info'`
- `read` (boolean): Default `false`
- `created_at` (timestamptz)

---

## 2. Row-Level Security (RLS) Policies

All database access requires RLS verification.

### Core Policy Rule: User Isolation
Users are only permitted to query or modify data belonging to their own user ID.
```sql
alter table clients enable row level security;
create policy "users own their clients" on clients
  for all using (auth.uid() = user_id);
```
*(Applies identically to tables: `proposals`, `expenses`, `events`, `notifications`, `team_members`)*

### Public Exemption Policies
Certain endpoints allow public access using tokens:
```sql
-- Allow public select of active token data
create policy "public can read valid tokens" on onboarding_tokens
  for select using (true);

-- Allow public portal tokens select
create policy "public can read portal tokens" on portal_tokens
  for select using (true);

-- Allow client data selection ONLY if matching portal token exists
create policy "public portal client read" on clients
  for select using (
    exists (select 1 from portal_tokens pt where pt.client_id = item_id)
  );
```

---

## 3. Database Indexes
To maintain optimal search performance:
- `idx_clients_user` on `clients(user_id)`
- `idx_clients_item` on `clients(item_id)`
- `idx_proposals_user` on `proposals(user_id)`
- `idx_expenses_user` on `expenses(user_id)`
- `idx_events_user` on `events(user_id)`

---

## 4. SaaS Scaling Database Evolution (Critical)

To grow the platform from 1 user to 10,000+ organizations, we are phasing out the single JSONB client blob and migrating to normalized relational tables with relational integrity rules.

### A. Required Missing Tables (V2 Redesign)
- **`organizations`**: Workspace boundary grouping multiple team members.
- **`profiles`**: Individual user profiles containing metadata, avatars, and application preferences.
- **`activity_logs`**: System event timeline for audit records.
- **`files`**: Scoped references to digital documents stored in Supabase Storage.
- **`comments`**: Threaded conversations associated with client profiles or tasks.

### B. Relational Schema Normalization (Sprint 2 & 4)
Nested arrays currently stored in JSONB will be separated into standalone relational tables:
1. `tasks` (Foreign key: `client_id` references `clients.id`)
2. `meetings` (Foreign key: `client_id` references `clients.id`)
3. `payments` (Foreign key: `client_id` references `clients.id`)
4. `expenses` (Foreign key: `client_id` references `clients.id`)
5. `communications` (Foreign key: `client_id` references `clients.id`)

### C. Scalability Enhancements
- **Multi-Tenant Indexing:** Add composite indexes on `(organization_id, client_id, status)` and `(created_at, due_date)` to optimize pagination and search results.
- **Relational Constraints:** Enforce Database-level `Foreign Keys`, `Unique Constraints`, and `Check Constraints` to prevent data corruption.
- **Soft Deletion:** Implement soft-deletes using `deleted_at` and `deleted_by` columns instead of raw deletion commands to preserve audit compliance.
