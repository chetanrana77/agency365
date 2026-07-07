-- Database Blueprint V1 Rollback Script
-- Drops all tables, constraints, and indexes created in v1_init.sql

DROP TABLE IF EXISTS meetings CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Note: Indexes and Constraints are dropped automatically when their parent tables are dropped.
-- The UUID extension is generally kept active, so we do not drop it.
