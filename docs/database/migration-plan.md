# Database Migration Plan (Alpha -> V1)

Migrating from the Alpha architecture (which uses a single JSONB blob `agency365_clients` for everything) to the normalized relational V1 schema requires a careful, idempotent strategy.

## Phase 1: Database Initialization
Run the `v1_init.sql` schema migration to create the relational tables (`organizations`, `profiles`, `clients`, `tasks`, `meetings`, `payments`, `expenses`) alongside the existing `clients` (JSONB) table. 

## Phase 2: Data Extraction & Transformation (ETL)

A standalone Node.js migration script will be written to perform the following:

1. **Extract:** Fetch all rows from the Alpha `clients` JSONB table.
2. **Transform (Organizations & Profiles):**
   - For every unique `user_id` in the Alpha table, create an `organizations` row.
   - Create a `profiles` row linking the `user_id` to that new `organization_id`.
3. **Transform (Clients):**
   - Loop through the JSON array stored in the `data` column.
   - For each JSON object, map properties (`name`, `phone`, `amount`) to the new `clients` table columns.
4. **Transform (Child Entities):**
   - Loop through `client.tasks`, `client.meetings`, `client.payments`, `client.expenses`.
   - Insert rows into their respective normalized tables, mapping the foreign key `client_id` to the newly inserted client.

## Phase 3: Idempotency & Rollback
- **Idempotency:** The ETL script must use `ON CONFLICT DO NOTHING` (or `UPSERT`). If the script crashes halfway, we can run it again safely without duplicating rows.
- **Rollback:** The `v1_down.sql` script can quickly drop the V1 tables and revert the database state, leaving the Alpha JSONB tables completely untouched during the trial phase.

## Phase 4: Application Cutover
Once the ETL script confirms 100% data fidelity, the frontend repository layer (Sprint 3) will be updated to point to the new normalized tables, and the old Mutex `localStorage` JSONB sync will be permanently retired.
