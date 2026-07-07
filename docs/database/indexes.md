# Database Indexing Strategy

To guarantee that database queries complete in `< 50ms` even as the platform scales to 100+ million rows, we employ a rigorous indexing strategy based on B-Trees.

## Core Principles
1. **Foreign Keys are Always Indexed:** PostgreSQL does not automatically index foreign keys. We explicitly create indexes on all foreign key columns to prevent full-table scans during `JOIN` operations or cascading deletes.
2. **Multi-Tenant Indexing:** When filtering large tables (like `clients` or `expenses`), queries will almost always filter by `organization_id` first. We use composite indexes (e.g., `(organization_id, status)`) to optimize these primary access patterns.
3. **Date/Time Indexing:** Dashboard analytics heavily rely on date ranges. We index temporal columns like `paid_at`, `incurred_at`, and `created_at`.

## Defined Indexes

### Profiles
- `CREATE INDEX idx_profiles_org_id ON profiles(organization_id);`
- `CREATE UNIQUE INDEX idx_profiles_email ON profiles(email);`

### Clients
- `CREATE INDEX idx_clients_org_id ON clients(organization_id);`
- `CREATE INDEX idx_clients_org_id_status ON clients(organization_id, status);`
- `CREATE INDEX idx_clients_created_at ON clients(created_at);`

### Tasks
- `CREATE INDEX idx_tasks_client_id ON tasks(client_id);`
- `CREATE INDEX idx_tasks_assigned_to_status ON tasks(assigned_to, is_completed);`

### Payments & Expenses
- `CREATE INDEX idx_payments_client_id ON payments(client_id);`
- `CREATE INDEX idx_payments_paid_at ON payments(paid_at);`
- `CREATE INDEX idx_expenses_org_id ON expenses(organization_id);`
- `CREATE INDEX idx_expenses_client_id ON expenses(client_id);`
- `CREATE INDEX idx_expenses_incurred_at ON expenses(incurred_at);`

### Meetings
- `CREATE INDEX idx_meetings_client_id ON meetings(client_id);`
- `CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);`
