# Database Tables & Justifications

This document outlines the core tables of Agency365 V1 database and their engineering justifications.

## `organizations`
- **Purpose:** Multi-tenant boundary. Groups users, clients, and billing data for a single agency.
- **Owner:** Identity & Billing Module.
- **Growth Estimate:** 10,000 to 50,000 rows (One per agency).
- **Archive Policy:** Never soft-deleted unless an agency closes their account.
- **AI Usage:** Used for high-level aggregate analytics (e.g., "Average revenue per agency").
- **Schema:**
  - `id` (uuid, PK)
  - `name` (text, not null)
  - `billing_plan` (text, default 'free')
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `deleted_at` (timestamptz, nullable)

## `profiles`
- **Purpose:** Maps Supabase Auth users to an organization and assigns permissions.
- **Owner:** Identity Module.
- **Growth Estimate:** 50,000 to 250,000 rows.
- **Archive Policy:** Soft-deleted when an employee leaves an agency.
- **AI Usage:** Identifies high-performing team members via task completion metrics.
- **Schema:**
  - `id` (uuid, PK, matches auth.users)
  - `organization_id` (uuid, FK)
  - `role` (text, not null)
  - `full_name` (text, not null)
  - `email` (text, not null)
  - `created_at`, `updated_at`, `deleted_at`

## `clients`
- **Purpose:** Central CRM entity representing an agency's customer.
- **Owner:** CRM Module.
- **Growth Estimate:** 1,000,000+ rows.
- **Archive Policy:** Soft-deleted via `deleted_at`.
- **AI Usage:** Health score predictions based on activity frequency and contract value.
- **Schema:**
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `name` (text, not null)
  - `contact_email` (text)
  - `phone` (text)
  - `status` (text, not null, default 'lead')
  - `contract_value` (numeric, default 0)
  - `created_at`, `updated_at`, `deleted_at`

## `tasks`
- **Purpose:** Action items for a project.
- **Owner:** Project Management Module.
- **Growth Estimate:** 50+ Million rows.
- **Archive Policy:** Soft-deleted.
- **AI Usage:** Workload distribution analysis and automated daily standup generation.
- **Schema:**
  - `id` (uuid, PK)
  - `client_id` (uuid, FK)
  - `assigned_to` (uuid, FK)
  - `title` (text, not null)
  - `is_completed` (boolean, default false)
  - `due_date` (date)
  - `created_at`, `updated_at`, `deleted_at`

## `payments`
- **Purpose:** Tracks incoming revenue.
- **Owner:** Finance Module.
- **Growth Estimate:** 10+ Million rows.
- **Archive Policy:** Immutable financial record. Soft-delete only for accidental entries.
- **AI Usage:** Cashflow forecasting, seasonality trends, and automated overdue invoice alerts.
- **Schema:**
  - `id` (uuid, PK)
  - `client_id` (uuid, FK)
  - `amount` (numeric, not null)
  - `currency` (text, default 'inr')
  - `status` (text, default 'paid')
  - `paid_at` (date, not null)
  - `created_at`, `updated_at`, `deleted_at`

## `expenses`
- **Purpose:** Tracks outgoing costs (agency-wide or project-specific).
- **Owner:** Finance Module.
- **Growth Estimate:** 10+ Million rows.
- **Archive Policy:** Immutable financial record. Soft-delete only.
- **AI Usage:** Profitability analysis.
- **Schema:**
  - `id` (uuid, PK)
  - `organization_id` (uuid, FK)
  - `client_id` (uuid, FK, nullable)
  - `category` (text, not null)
  - `amount` (numeric, not null)
  - `incurred_at` (date, not null)
  - `created_at`, `updated_at`, `deleted_at`

## `meetings`
- **Purpose:** Historical log of interactions.
- **Owner:** CRM Module.
- **Growth Estimate:** 20+ Million rows.
- **Archive Policy:** Soft-deleted.
- **AI Usage:** Meeting transcripts/notes will be vectorized for semantic search.
- **Schema:**
  - `id` (uuid, PK)
  - `client_id` (uuid, FK)
  - `title` (text, not null)
  - `scheduled_at` (timestamptz)
  - `status` (text, default 'scheduled')
  - `recording_url` (text)
  - `created_at`, `updated_at`, `deleted_at`
