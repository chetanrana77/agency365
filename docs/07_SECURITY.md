# 07_SECURITY.md — Application Security & Data Isolation Standards

This document establishes the security guidelines, token validations, and data isolation mechanisms of **Agency365**.

---

## 1. Authentication & Session Guards
- **Supabase Auth:** Authentications must go through Supabase Authentication (`supabase.auth`).
- **Password Safety:** Raw passwords must never be stored in `localStorage` or transmitted in plain text.
- **Session Expiration:** User authentication is stored in `sessionStorage` under `agency365_unlocked = 'true'`. Closing the browser window/tab immediately invalidates the session context.
- **Route Protection:** Every module entry point checks for user validation in `checkAuthAndInit()`. Non-public directories automatically redirect users back to `login.html`.

---

## 2. Relational Schema Isolation (RLS)

> [!IMPORTANT]
> All SQL tables must enable Row-Level Security (RLS). Direct unchecked tables are prohibited.

### Strict User Scoping
The policy `auth.uid() = user_id` ensures that a logged-in user can only query, edit, or delete database rows that they created.
- System queries from client-side code never download raw database tables.
- Updates utilize targeted filters mapping the user ID.

---

## 3. Token-Based Public Access

For features where third parties (e.g. clients) need access without authentication (onboarding pages, customer portals):
1. **Public Tokens:** Tokens must be cryptographically secure UUIDs generated on the server or dynamically (`crypto.randomUUID()`).
2. **Expiration Boundaries:** Onboarding tokens must have an `expires_at` timestamp (default: 7 days). Validations reject requests if the current time exceeds this value.
3. **Scoped RLS policies:** Public data fetching from clients table must be explicitly scoped via subqueries verifying that a valid, active portal token exists:
```sql
create policy "public portal client read" on clients
  for select using (
    exists (select 1 from portal_tokens pt where pt.client_id = item_id)
  );
```

---

## 4. Input Validation & XSS Prevention
- **HTML Escaping:** Never assign raw query inputs directly to elements via `.innerHTML`. Always use `.textContent` or verify input values.
- **Form Sanitization:** Truncate trailing whitespaces and validate GST values, emails, and URLs against strict regular expressions before database write operations.
