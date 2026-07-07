# Database Seed Data

For local development and automated testing environments, we require robust seed data to test the platform without manually inputting records.

## Seed Strategy

A `seed.sql` file will be created to populate local environments with the following:

1. **Organizations:**
   - Techmize Internal (id: `11111111-1111-1111-1111-111111111111`)
   - Test Agency Alpha (id: `22222222-2222-2222-2222-222222222222`)

2. **Profiles:**
   - Admin Users (e.g., Chetan Rana for Techmize).
   - Standard Members (to test RLS policies and permission boundaries).

3. **Clients:**
   - 10 Active Clients.
   - 5 Closed Clients.
   - 15 Leads.

4. **Relational Data:**
   - 50 Tasks assigned across clients (mixed completed and pending).
   - 100 Payments to generate cashflow charts.
   - 100 Expenses to test profitability metrics.
   - 20 Meetings (past and future).

## CI/CD Pipeline
In the future, the seed script will be run automatically during GitHub Action workflows to verify that the database builds successfully and the V1 schema functions as intended against automated integration tests.
