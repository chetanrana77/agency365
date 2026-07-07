-- Database Blueprint V1 Init Script
-- This script creates the core schema, indexes, constraints, and RLS policies for Agency365.

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-----------------------------------------
-- 1. Table Creations
-----------------------------------------

CREATE TABLE organizations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    billing_plan text DEFAULT 'free',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE profiles (
    id uuid PRIMARY KEY, -- Maps to Supabase auth.users.id
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    role text NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE clients (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    name text NOT NULL,
    contact_email text,
    phone text,
    status text NOT NULL DEFAULT 'lead',
    contract_value numeric DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    assigned_to uuid REFERENCES profiles(id) ON DELETE RESTRICT,
    title text NOT NULL,
    is_completed boolean DEFAULT false,
    due_date date,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    amount numeric NOT NULL,
    currency text DEFAULT 'inr',
    status text DEFAULT 'paid',
    paid_at date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE expenses (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
    client_id uuid REFERENCES clients(id) ON DELETE RESTRICT,
    category text NOT NULL,
    amount numeric NOT NULL,
    incurred_at date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

CREATE TABLE meetings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id uuid NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
    title text NOT NULL,
    scheduled_at timestamptz,
    status text DEFAULT 'scheduled',
    recording_url text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz
);

-----------------------------------------
-- 2. Check Constraints
-----------------------------------------
ALTER TABLE profiles ADD CONSTRAINT check_profile_role CHECK (role IN ('admin', 'manager', 'member'));
ALTER TABLE profiles ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$');

ALTER TABLE clients ADD CONSTRAINT check_client_status CHECK (status IN ('lead', 'active', 'closed'));
ALTER TABLE clients ADD CONSTRAINT check_client_value CHECK (contract_value >= 0);

ALTER TABLE payments ADD CONSTRAINT check_payment_amount CHECK (amount >= 0);
ALTER TABLE payments ADD CONSTRAINT check_payment_status CHECK (status IN ('pending', 'paid', 'refunded'));

ALTER TABLE expenses ADD CONSTRAINT check_expense_amount CHECK (amount >= 0);

ALTER TABLE meetings ADD CONSTRAINT check_meeting_status CHECK (status IN ('scheduled', 'completed', 'cancelled'));

-----------------------------------------
-- 3. Indexes
-----------------------------------------
CREATE INDEX idx_profiles_org_id ON profiles(organization_id);
-- profiles(email) has unique constraint which automatically creates an index.

CREATE INDEX idx_clients_org_id ON clients(organization_id);
CREATE INDEX idx_clients_org_id_status ON clients(organization_id, status);
CREATE INDEX idx_clients_created_at ON clients(created_at);

CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_assigned_to_status ON tasks(assigned_to, is_completed);

CREATE INDEX idx_payments_client_id ON payments(client_id);
CREATE INDEX idx_payments_paid_at ON payments(paid_at);

CREATE INDEX idx_expenses_org_id ON expenses(organization_id);
CREATE INDEX idx_expenses_client_id ON expenses(client_id);
CREATE INDEX idx_expenses_incurred_at ON expenses(incurred_at);

CREATE INDEX idx_meetings_client_id ON meetings(client_id);
CREATE INDEX idx_meetings_scheduled_at ON meetings(scheduled_at);

-----------------------------------------
-- 4. Row-Level Security (RLS)
-----------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Note: Exact RLS policies defining auth.uid() joins are defined in docs/database/rls.md.
-- We will instantiate those specific policies during Sprint 2B (Organization Layer) setup.
