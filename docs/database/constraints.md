# Database Constraints

Relational constraints ensure that corrupted, invalid, or orphaned data cannot enter the database. This layer of security is enforced directly at the SQL level, bypassing any application bugs.

## 1. Foreign Key Constraints (Referential Integrity)

- **`ON DELETE RESTRICT`:** We do not use `CASCADE` by default for critical data. For example, if you attempt to hard-delete an organization, PostgreSQL will reject it if there are clients attached.
- All FK columns (e.g., `organization_id`, `client_id`, `assigned_to`) strictly map to `uuid` primary keys in their parent tables.

## 2. Check Constraints (Data Validation)

We use `CHECK` constraints to validate enum-like fields and logic:

### Clients Table
- `CONSTRAINT check_client_status CHECK (status IN ('lead', 'active', 'closed'))`
- `CONSTRAINT check_client_value CHECK (contract_value >= 0)`

### Profiles Table
- `CONSTRAINT check_profile_role CHECK (role IN ('admin', 'manager', 'member'))`
- `CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$')`

### Payments & Expenses
- `CONSTRAINT check_payment_amount CHECK (amount >= 0)`
- `CONSTRAINT check_payment_status CHECK (status IN ('pending', 'paid', 'refunded'))`
- `CONSTRAINT check_expense_amount CHECK (amount >= 0)`

### Meetings
- `CONSTRAINT check_meeting_status CHECK (status IN ('scheduled', 'completed', 'cancelled'))`

## 3. Unique Constraints

- `profiles.email` must be globally UNIQUE across the database to prevent duplicate account registration.
- (Future addition): Unique client names per organization: `UNIQUE(organization_id, name)` — though this may be too strict depending on business rules.

## 4. Default Values

- `created_at` defaults to `now()`.
- `updated_at` defaults to `now()` and is updated via a Postgres Trigger on row modification.
- `deleted_at` defaults to `NULL`.
- `id` defaults to `gen_random_uuid()`.
