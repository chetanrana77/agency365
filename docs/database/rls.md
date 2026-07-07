# Row-Level Security (RLS) Strategy

Agency365 operates as a true Multi-Tenant SaaS. We use PostgreSQL Row-Level Security (RLS) to guarantee that users in Organization A can NEVER query, modify, or delete data belonging to Organization B, regardless of API bugs.

## RLS Enforcement Rules

1. **Enable RLS on all tables:** Every new table must have `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;` executed upon creation.
2. **Soft-Delete Filtering:** RLS policies globally filter out rows where `deleted_at IS NOT NULL`.

## Core Policy Logic

The core logic relies on the user's `auth.uid()` matching a profile record, which points to their `organization_id`.

### 1. `profiles` Table Policies
Users can read profiles belonging to their own organization.
```sql
CREATE POLICY "users can view team members" ON profiles
FOR SELECT USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND deleted_at IS NULL
);
```

### 2. Tenant Data Policies (`clients`, `expenses`, etc.)
Any table holding tenant data uses the `organization_id` to strictly limit access.
```sql
CREATE POLICY "users can view org clients" ON clients
FOR SELECT USING (
  organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND deleted_at IS NULL
);
```

### 3. Child Data Policies (`tasks`, `meetings`, `payments`)
For tables that reference a `client_id` (but not directly an `organization_id`), RLS joins against the `clients` table.
```sql
CREATE POLICY "users can view client tasks" ON tasks
FOR SELECT USING (
  client_id IN (
    SELECT id FROM clients 
    WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  )
  AND deleted_at IS NULL
);
```

*Note: As performance dictates, we may denormalize `organization_id` onto all child tables in the future to avoid the RLS JOIN overhead.*
